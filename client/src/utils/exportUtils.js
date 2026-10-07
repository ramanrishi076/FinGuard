import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Normalizes transaction data for export
 */
export const prepareTransactionExportData = (transactions, currentUser) => {
  return transactions.map((tx) => {
    const isIncoming = currentUser?.id && tx.receiverUserId === currentUser.id && tx.type === "TRANSFER";
    let partyRole = "To";
    let partyName = tx.receiverName || (tx.receiverWalletId ? `Wallet #${tx.receiverWalletId}` : "—");
    let partyUpi = tx.receiverUpiId || "—";

    if (tx.type === "DEPOSIT") {
      partyRole = "Source";
      partyName = "Direct Deposit";
      partyUpi = "Bank Account";
    } else if (tx.type === "WITHDRAWAL") {
      partyRole = "Payout";
      partyName = "Direct Withdrawal";
      partyUpi = "Linked Bank Account";
    } else if (isIncoming) {
      partyRole = "From";
      partyName = tx.senderName || (tx.senderWalletId ? `Wallet #${tx.senderWalletId}` : "Contact");
      partyUpi = tx.senderUpiId || "—";
    } else {
      partyRole = "To";
      partyName = tx.receiverName || (tx.receiverWalletId ? `Wallet #${tx.receiverWalletId}` : "Contact");
      partyUpi = tx.receiverUpiId || "—";
    }

    const dateObj = new Date(tx.createdAt);
    const formattedDate = dateObj.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formattedTime = dateObj.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const isCredit = tx.type === "DEPOSIT" || isIncoming;
    const amountNum = Number(tx.amount || 0);

    return {
      raw: tx,
      id: `#${tx.id}`,
      dateTime: `${formattedDate} ${formattedTime}`,
      type: tx.type,
      partyRole,
      partyName,
      partyUpi,
      description: tx.description || "—",
      status: tx.status,
      amount: amountNum,
      amountFormatted: `${isCredit ? "+" : "-"} ₹${amountNum.toLocaleString("en-IN")}`,
      isCredit,
    };
  });
};

/**
 * Filters transactions by date range preset / custom dates and flow type (all/debit/credit)
 */
export const filterTransactionsForExport = (
  transactions,
  currentUser,
  {
    preset = "all", // "7d" | "10d" | "1m" | "3m" | "custom" | "all"
    fromDate = "",
    toDate = "",
    flowType = "all", // "all" | "debit" | "credit"
  } = {}
) => {
  const now = new Date();
  let startDate = null;
  let endDate = null;

  if (preset === "7d") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    endDate = now;
  } else if (preset === "10d") {
    startDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    endDate = now;
  } else if (preset === "1m") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    endDate = now;
  } else if (preset === "3m") {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    endDate = now;
  } else if (preset === "custom") {
    if (fromDate) {
      startDate = new Date(`${fromDate}T00:00:00`);
    }
    if (toDate) {
      endDate = new Date(`${toDate}T23:59:59.999`);
    }
  }

  return transactions.filter((tx) => {
    // 1. Date Filter
    if (startDate || endDate) {
      const txDate = new Date(tx.createdAt);
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
    }

    // 2. Flow Filter
    const isIncoming = currentUser?.id && tx.receiverUserId === currentUser.id && tx.type === "TRANSFER";
    const isCredit = tx.type === "DEPOSIT" || isIncoming;

    if (flowType === "credit" && !isCredit) return false;
    if (flowType === "debit" && isCredit) return false;

    return true;
  });
};

/**
 * Exports transactions as a beautifully formatted PDF statement
 */
export const exportTransactionsToPDF = (transactions, currentUser, options = {}) => {
  const opts = typeof options === "string" ? { titleSuffix: options } : options || {};
  const {
    periodLabel = "All Time",
    flowLabel = "All Transactions",
    titleSuffix = "",
  } = opts;

  const data = prepareTransactionExportData(transactions, currentUser);
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor = [27, 110, 243]; // Google Blue
  const darkText = [32, 33, 36];
  const mutedText = [95, 99, 104];
  const borderColor = [218, 220, 224];

  // Header Banner Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 120, "F");

  // Top Accent Bar (Google Colors)
  doc.setFillColor(66, 133, 244); // Blue
  doc.rect(0, 0, pageWidth * 0.25, 4, "F");
  doc.setFillColor(234, 67, 53); // Red
  doc.rect(pageWidth * 0.25, 0, pageWidth * 0.25, 4, "F");
  doc.setFillColor(251, 188, 5); // Yellow
  doc.rect(pageWidth * 0.5, 0, pageWidth * 0.25, 4, "F");
  doc.setFillColor(52, 168, 83); // Green
  doc.rect(pageWidth * 0.75, 0, pageWidth * 0.25, 4, "F");

  // App Logo & Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.text("FinGuard Pay", 40, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...mutedText);
  doc.text("Google Pay Shield • AI Fraud-Protected Wallet Statement", 40, 54);

  // Statement Meta (Right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...darkText);
  doc.text("ACCOUNT STATEMENT", pageWidth - 40, 38, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedText);
  const generatedAt = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.text(`Generated: ${generatedAt}`, pageWidth - 40, 52, { align: "right" });
  doc.text(`Period: ${periodLabel}`, pageWidth - 40, 65, { align: "right" });
  doc.text(`Filter: ${flowLabel} (${data.length} records)`, pageWidth - 40, 78, { align: "right" });

  // User summary bar
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.75);
  doc.line(40, 88, pageWidth - 40, 88);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...darkText);
  doc.text(`Account Holder: ${currentUser?.name || "FinGuard User"}`, 40, 104);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedText);
  const upiId = currentUser?.email?.includes("@") && !currentUser?.email?.endsWith("@finguard.com")
    ? currentUser.email
    : `${(currentUser?.email || "user").split("@")[0]}@finguard`;
  doc.text(`UPI ID: ${upiId}`, pageWidth - 40, 104, { align: "right" });

  // Summary Metrics Cards
  const totalApproved = data.filter((d) => d.status === "APPROVED");
  const totalCredits = totalApproved
    .filter((d) => d.isCredit)
    .reduce((sum, d) => sum + d.amount, 0);
  const totalDebits = totalApproved
    .filter((d) => !d.isCredit)
    .reduce((sum, d) => sum + d.amount, 0);

  const cardY = 132;
  const cardWidth = (pageWidth - 80 - 24) / 3;
  const cardHeight = 44;

  // Card 1: Inflow
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(40, cardY, cardWidth, cardHeight, 6, 6, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text("Total Credits (Inflow)", 50, cardY + 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`+ ₹${totalCredits.toLocaleString("en-IN")}`, 50, cardY + 34);

  // Card 2: Outflow
  const card2X = 40 + cardWidth + 12;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 6, 6, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Total Debits (Outflow)", card2X + 10, cardY + 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`- ₹${totalDebits.toLocaleString("en-IN")}`, card2X + 10, cardY + 34);

  // Card 3: Shield Status
  const card3X = card2X + cardWidth + 12;
  const blockedCount = data.filter((d) => d.status === "BLOCKED").length;
  doc.setFillColor(blockedCount > 0 ? 254 : 240, blockedCount > 0 ? 242 : 249, blockedCount > 0 ? 242 : 255);
  doc.setDrawColor(blockedCount > 0 ? 254 : 191, blockedCount > 0 ? 202 : 219, blockedCount > 0 ? 202 : 254);
  doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 6, 6, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(blockedCount > 0 ? 153 : 30, blockedCount > 0 ? 27 : 58, blockedCount > 0 ? 27 : 138);
  doc.text("AI Shield Interceptions", card3X + 10, cardY + 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${blockedCount} High-Risk Blocked`, card3X + 10, cardY + 34);

  // Table Data Mapping
  const tableRows = data.map((d) => [
    d.id,
    d.dateTime,
    d.type,
    `${d.partyRole}: ${d.partyName}\n${d.partyUpi}`,
    d.description,
    d.status,
    d.amountFormatted,
  ]);

  // Generate Table via autoTable
  autoTable(doc, {
    startY: 190,
    margin: { left: 40, right: 40, bottom: 40 },
    head: [["Tx ID", "Date & Time", "Type", "Party / UPI Details", "Description", "Fraud Status", "Amount"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [27, 110, 243],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
      cellPadding: 7,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [32, 33, 36],
      cellPadding: 6,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold" },
      1: { cellWidth: 78 },
      2: { cellWidth: 62 },
      3: { cellWidth: 125 },
      4: { cellWidth: 85 },
      5: { cellWidth: 65, halign: "center" },
      6: { cellWidth: 60, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body") {
        const row = data[hookData.row.index];
        if (hookData.column.index === 5) {
          if (row?.status === "APPROVED") {
            hookData.cell.styles.textColor = [46, 125, 50]; // Green
          } else if (row?.status === "BLOCKED") {
            hookData.cell.styles.textColor = [198, 40, 40]; // Red
            hookData.cell.styles.fontStyle = "bold";
          } else if (row?.status === "FLAGGED" || row?.status === "REVIEW") {
            hookData.cell.styles.textColor = [230, 81, 0]; // Amber
          }
        }
        if (hookData.column.index === 6) {
          hookData.cell.styles.textColor = row?.isCredit ? [46, 125, 50] : [32, 33, 36];
        }
      }
    },
    didDrawPage: (hookData) => {
      const str = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...mutedText);
      doc.text(str, pageWidth - 40, pageHeight - 20, { align: "right" });
      doc.text(`FinGuard AI Shield • Period: ${periodLabel} • Filter: ${flowLabel}`, 40, pageHeight - 20);
    },
  });

  const cleanSuffix = titleSuffix ? `_${titleSuffix.replace(/[^a-zA-Z0-9_-]/g, "")}` : "";
  const filename = `FinGuard_Statement_${new Date().toISOString().split("T")[0]}${cleanSuffix}.pdf`;
  doc.save(filename);
};

/**
 * Exports transactions as a structured Microsoft Excel (.xlsx) spreadsheet
 */
export const exportTransactionsToExcel = (transactions, currentUser, options = {}) => {
  const opts = typeof options === "string" ? { titleSuffix: options } : options || {};
  const {
    periodLabel = "All Time",
    flowLabel = "All Transactions",
    titleSuffix = "",
  } = opts;

  const data = prepareTransactionExportData(transactions, currentUser);

  // Transform rows for sheet
  const rows = data.map((d) => ({
    "Transaction ID": d.id,
    "Date & Time": d.dateTime,
    "Type": d.type,
    "Role": d.partyRole,
    "Counterparty Name": d.partyName,
    "Counterparty UPI / Account": d.partyUpi,
    "Description": d.description,
    "Fraud Engine Decision": d.status,
    "Amount (INR)": d.isCredit ? d.amount : -d.amount,
  }));

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 16 }, // ID
    { wch: 20 }, // Date
    { wch: 14 }, // Type
    { wch: 10 }, // Role
    { wch: 24 }, // Name
    { wch: 26 }, // UPI
    { wch: 28 }, // Description
    { wch: 18 }, // Status
    { wch: 16 }, // Amount
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

  // Summary sheet
  const totalApproved = data.filter((d) => d.status === "APPROVED");
  const summaryRows = [
    { Property: "Account Holder", Value: currentUser?.name || "FinGuard User" },
    { Property: "Account Email / UPI", Value: currentUser?.email || "—" },
    { Property: "Statement Period", Value: periodLabel },
    { Property: "Transaction Type Filter", Value: flowLabel },
    { Property: "Statement Export Date", Value: new Date().toLocaleString("en-IN") },
    { Property: "Total Transactions Count", Value: data.length },
    {
      Property: "Approved Inflow / Credits (INR)",
      Value: totalApproved.filter((d) => d.isCredit).reduce((sum, d) => sum + d.amount, 0),
    },
    {
      Property: "Approved Outflow / Debits (INR)",
      Value: totalApproved.filter((d) => !d.isCredit).reduce((sum, d) => sum + d.amount, 0),
    },
    { Property: "Blocked Fraud Transactions", Value: data.filter((d) => d.status === "BLOCKED").length },
    { Property: "Flagged / Review Transactions", Value: data.filter((d) => d.status === "FLAGGED" || d.status === "REVIEW").length },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 32 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Account Summary");

  const cleanSuffix = titleSuffix ? `_${titleSuffix.replace(/[^a-zA-Z0-9_-]/g, "")}` : "";
  const filename = `FinGuard_Transactions_${new Date().toISOString().split("T")[0]}${cleanSuffix}.xlsx`;
  XLSX.writeFile(workbook, filename);
};
