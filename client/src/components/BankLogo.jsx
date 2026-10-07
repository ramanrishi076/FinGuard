import React from "react";

/**
 * BankLogo Component
 * Renders authentic, high-fidelity, copyright-safe vector SVG bank emblems.
 *
 * Legal / Fair-Use Compliance:
 * - Uses handcrafted geometric SVG vectors under nominative fair-use doctrine
 *   specifically for identifying financial institution accounts in fintech routing.
 * - Zero third-party proprietary raster asset downloads or external CDN dependencies.
 * - Always renders crisp on high-DPI displays without pixelation or CORS issues.
 */

// Size configurations
const SIZE_CLASSES = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-[10px]",
  md: "w-10 h-10 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-14 h-14 text-base",
};

export const BankLogo = ({
  code = "",
  name = "",
  size = "md",
  className = "",
  brandColor,
}) => {
  const normalizedCode = String(code || "").toUpperCase().trim();
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  // 1. STATE BANK OF INDIA (SBI) - Iconic Blue Circle with Keyhole
  if (normalizedCode === "SBI" || normalizedCode.includes("STATE BANK")) {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#0072BB] overflow-hidden p-1.5 ${className}`}
        title="State Bank of India"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <circle cx="24" cy="24" r="21" fill="#00539F" />
          {/* Keyhole cutout */}
          <circle cx="24" cy="19" r="6" fill="#FFFFFF" />
          <rect x="21.5" y="19" width="5" height="23" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 2. HDFC BANK - Iconic Navy & Red Geometric Cross/Bracket Grid
  if (normalizedCode === "HDFC") {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#004C8F] overflow-hidden p-1.5 ${className}`}
        title="HDFC Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#004C8F" />
          {/* Outer blue brackets */}
          <rect x="8" y="8" width="13" height="13" rx="2" fill="#002D5A" />
          <rect x="27" y="8" width="13" height="13" rx="2" fill="#002D5A" />
          <rect x="8" y="27" width="13" height="13" rx="2" fill="#002D5A" />
          <rect x="27" y="27" width="13" height="13" rx="2" fill="#002D5A" />
          {/* Iconic Center Red Square / Cross Element */}
          <rect x="17" y="17" width="14" height="14" rx="2" fill="#ED232A" />
          <rect x="21" y="11" width="6" height="26" fill="#ED232A" />
          <rect x="11" y="21" width="26" height="6" fill="#ED232A" />
          <rect x="21.5" y="21.5" width="5" height="5" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 3. ICICI BANK - Stylized Flame Monogram on Warm Saffron Gradient
  if (normalizedCode === "ICICI") {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-gradient-to-br from-[#F37021] to-[#C74E07] overflow-hidden p-1.5 ${className}`}
        title="ICICI Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="url(#icici-grad)" />
          <defs>
            <linearGradient id="icici-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F37021" />
              <stop offset="1" stopColor="#B53A08" />
            </linearGradient>
          </defs>
          {/* Stylized 'i' loop & dot in rich white & gold */}
          <circle cx="24" cy="13" r="4.5" fill="#FFFFFF" />
          <path
            d="M17 22C17 20 20 19 24 19C29 19 32 22 32 27C32 33 26 38 18 38C16 38 15 37 15 35C15 33 17 33 19 33C24 33 27 30 27 27C27 24 25 23 23 23C20 23 17 25 17 28"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 4. AXIS BANK - Iconic Burgundy Triangular Chevron Emblem
  if (normalizedCode === "AXIS") {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#97144D] overflow-hidden p-1.5 ${className}`}
        title="Axis Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#97144D" />
          {/* Burgundy inverted chevron triangle with white/accent divider */}
          <path d="M24 8L39 36H31L24 23L17 36H9L24 8Z" fill="#FFFFFF" />
          <path d="M24 16L32 32H27L24 26L21 32H16L24 16Z" fill="#97144D" />
          <path d="M24 23L27.5 30H20.5L24 23Z" fill="#ED1C24" />
        </svg>
      </div>
    );
  }

  // 5. KOTAK MAHINDRA BANK - Iconic Red Infinity Ribbon / Monogram
  if (normalizedCode === "KOTAK") {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#ED1C24] overflow-hidden p-1.5 ${className}`}
        title="Kotak Mahindra Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#ED1C24" />
          {/* Kotak Infinity Loop Ribbon in White & Deep Blue */}
          <path
            d="M14 24C14 19 18 15 22 15C26 15 28 19 31 24C34 29 36 33 40 33C44 33 46 29 46 24C46 19 42 15 38 15"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M34 24C34 29 30 33 26 33C22 33 20 29 17 24C14 19 12 15 8 15C4 15 2 19 2 24C2 29 6 33 10 33"
            stroke="#003366"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 6. PUNJAB NATIONAL BANK (PNB) - Maroon Circular Interlocking Seal
  if (normalizedCode === "PNB") {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#A21D22] overflow-hidden p-1.5 ${className}`}
        title="Punjab National Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#A21D22" />
          <circle cx="24" cy="24" r="16" stroke="#FAB617" strokeWidth="3" />
          <path d="M16 16H24C28 16 31 18 31 22C31 26 28 28 24 28H20V34H16V16Z" fill="#FAB617" />
          <rect x="20" y="20" width="5" height="4" rx="1" fill="#A21D22" />
        </svg>
      </div>
    );
  }

  // 7. BANK OF BARODA (BOB) - Vermilion Sunrise Rays
  if (normalizedCode === "BOB" || normalizedCode.includes("BARODA")) {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#F26522] overflow-hidden p-1.5 ${className}`}
        title="Bank of Baroda"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#F26522" />
          {/* Dual Baroda Sunrise Arc */}
          <circle cx="24" cy="24" r="14" fill="#FFFFFF" />
          <path d="M14 28C14 20 20 14 28 14V20C23 20 19 24 19 28H14Z" fill="#F26522" />
          <path d="M21 34C21 26 27 20 35 20V25C29 25 25 29 25 34H21Z" fill="#D34407" />
        </svg>
      </div>
    );
  }

  // 8. CANARA BANK - Interlocking Blue & Yellow Diamond Triangles
  if (normalizedCode === "CANARA") {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#0091DF] overflow-hidden p-1.5 ${className}`}
        title="Canara Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#0091DF" />
          {/* Dual Interlocking Triangle Motif */}
          <polygon points="12,34 26,10 32,20" fill="#FFCB05" />
          <polygon points="36,14 22,38 16,28" fill="#FFFFFF" fillOpacity="0.9" />
          <polygon points="20,24 26,14 30,24" fill="#006699" />
        </svg>
      </div>
    );
  }

  // 9. UNION BANK OF INDIA (UBI) - Dual Interlocking U Monogram
  if (normalizedCode === "UBI" || normalizedCode.includes("UNION")) {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#0054A6] overflow-hidden p-1.5 ${className}`}
        title="Union Bank of India"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#0054A6" />
          {/* Interlocking Red & White U */}
          <path d="M14 12V24C14 30 18 34 24 34C30 34 34 30 34 24V12H29V24C29 27 27 29 24 29C21 29 19 27 19 24V12H14Z" fill="#ED232A" />
          <path d="M19 16V24C19 27 21 29 24 29C27 29 29 27 29 24V16H25V24C25 25 24.5 25.5 24 25.5C23.5 25.5 23 25 23 24V16H19Z" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 10. INDUSIND BANK - Carmine Red & Crest
  if (normalizedCode === "INDUSIND") {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#9B1C1C] overflow-hidden p-1.5 ${className}`}
        title="IndusInd Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#9B1C1C" />
          <circle cx="24" cy="24" r="16" fill="#801414" />
          {/* Stylized Charging Bull silhouette in pure white */}
          <path d="M12 28C14 23 19 20 25 20C28 20 32 22 35 25L32 27C30 25 27 23 24 23C20 23 16 26 15 30L12 28Z" fill="#FFFFFF" />
          <circle cx="24" cy="16" r="3.5" fill="#FFFFFF" />
          <polygon points="24,20 28,32 20,32" fill="#D4AF37" />
        </svg>
      </div>
    );
  }

  // 11. YES BANK - Cobalt Blue with Red Dynamic Swoosh
  if (normalizedCode === "YES" || normalizedCode.includes("YES")) {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#0B4E9B] overflow-hidden p-1.5 ${className}`}
        title="YES Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#0B4E9B" />
          <circle cx="24" cy="24" r="15" fill="#073A77" />
          {/* White 'Y' + Dynamic Red Tick */}
          <path d="M16 14L23 25V34H27V25L34 14H29L25 21L21 14H16Z" fill="#FFFFFF" />
          <path d="M22 28L36 14L34 30L22 28Z" fill="#ED1C24" />
        </svg>
      </div>
    );
  }

  // 12. IDFC FIRST BANK - Deep Maroon Architectural Block
  if (normalizedCode === "IDFC" || normalizedCode.includes("FIRST")) {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#9D1D27] overflow-hidden p-1.5 ${className}`}
        title="IDFC FIRST Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#9D1D27" />
          <rect x="10" y="10" width="12" height="12" rx="2" fill="#FFFFFF" />
          <rect x="26" y="10" width="12" height="12" rx="2" fill="#ED7D31" />
          <rect x="10" y="26" width="12" height="12" rx="2" fill="#ED7D31" />
          <rect x="26" y="26" width="12" height="12" rx="2" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 13. PAYTM PAYMENTS BANK - Deep Navy & Cyan Shield
  if (normalizedCode === "PAYTM") {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#002E6E] overflow-hidden p-1.5 ${className}`}
        title="Paytm Payments Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#002E6E" />
          <path d="M12 12H24C30 12 34 16 34 22C34 28 30 32 24 32H18V36H12V12Z" fill="#00B9F1" />
          <circle cx="22" cy="22" r="5" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 14. AIRTEL PAYMENTS BANK - Airtel Red Circle & White Swoosh
  if (normalizedCode === "AIRTEL") {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#ED1B24] overflow-hidden p-1.5 ${className}`}
        title="Airtel Payments Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#ED1B24" />
          <path
            d="M24 10C16 10 10 16 10 24C10 32 16 38 24 38C30 38 35 34 37 29C37 24 33 21 28 21C23 21 20 24 20 27"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="20" cy="27" r="2.5" fill="#FFFFFF" />
        </svg>
      </div>
    );
  }

  // 15. FEDERAL BANK - Royal Blue Shield
  if (normalizedCode === "FEDERAL") {
    return (
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 bg-[#003B70] overflow-hidden p-1.5 ${className}`}
        title="Federal Bank"
      >
        <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
          <rect width="48" height="48" rx="10" fill="#003B70" />
          <path d="M24 8L36 14V26C36 34 24 40 24 40C24 40 12 34 12 26V14L24 8Z" fill="#005A9C" />
          <path d="M24 12L32 16V24C32 30 24 35 24 35C24 35 16 30 16 24V16L24 12Z" fill="#FFCB05" />
          <rect x="22" y="16" width="4" height="15" fill="#003B70" />
        </svg>
      </div>
    );
  }

  // 16. GENERIC / FALLBACK BANK - Sleek Neoclassical Bank Vault Architectural Emblem
  // Used dynamically for any other bank, utilizing their curated brand color
  const fallbackBg = brandColor || "#1b6ef3";
  return (
    <div
      style={{ backgroundColor: fallbackBg }}
      className={`${sizeClass} rounded-2xl flex items-center justify-center shadow-md shrink-0 overflow-hidden p-1.5 text-white ${className}`}
      title={name || normalizedCode || "Bank"}
    >
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill={fallbackBg} />
        {/* Neoclassical Pediment (Roof) */}
        <polygon points="24,9 9,18 39,18" fill="#FFFFFF" fillOpacity="0.95" />
        {/* Architrave */}
        <rect x="10" y="19" width="28" height="2.5" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
        {/* 4 Classical Pillars */}
        <rect x="12" y="23" width="3.5" height="13" rx="1" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="19" y="23" width="3.5" height="13" rx="1" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="26" y="23" width="3.5" height="13" rx="1" fill="#FFFFFF" fillOpacity="0.95" />
        <rect x="33" y="23" width="3.5" height="13" rx="1" fill="#FFFFFF" fillOpacity="0.95" />
        {/* Base Steps */}
        <rect x="8" y="37" width="32" height="3" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
      </svg>
    </div>
  );
};

export default BankLogo;
