require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

async function seed() {
  console.log("Seeding sample account: demo@finguard.com...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@finguard.com" },
    update: {
      password: hashedPassword,
      name: "Demo User",
    },
    create: {
      email: "demo@finguard.com",
      name: "Demo User",
      password: hashedPassword,
      wallet: {
        create: {
          balance: 75000n,
        },
      },
    },
    include: {
      wallet: true,
    },
  });

  // Ensure wallet exists and has balance
  let wallet = user.wallet;
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 75000n,
      },
    });
  } else {
    // If balance is 0, give it a healthy starting balance for testing
    if (wallet.balance === 0n) {
      wallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: 75000n },
      });
    }
  }

  // Create a second user for transfer testing if needed
  const peerUser = await prisma.user.upsert({
    where: { email: "alice@finguard.com" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "alice@finguard.com",
      name: "Alice Sharma",
      password: hashedPassword,
      wallet: {
        create: {
          balance: 30000n,
        },
      },
    },
    include: {
      wallet: true,
    },
  });

  // Add initial sample transactions if wallet has fewer than 2 transactions
  const txCount = await prisma.transaction.count({
    where: {
      OR: [
        { senderWalletId: wallet.id },
        { receiverWalletId: wallet.id },
      ],
    },
  });

  if (txCount === 0) {
    console.log("Adding initial seed transactions...");
    await prisma.transaction.createMany({
      data: [
        {
          receiverWalletId: wallet.id,
          amount: 50000n,
          type: "DEPOSIT",
          status: "APPROVED",
          description: "Initial wallet funding",
        },
        {
          receiverWalletId: wallet.id,
          amount: 25000n,
          type: "DEPOSIT",
          status: "APPROVED",
          description: "Client project milestone payment",
        },
      ],
    });
  }

  console.log("\n=========================================");
  console.log("SAMPLE TESTING ACCOUNT READY:");
  console.log("Email:    demo@finguard.com");
  console.log("Password: password123");
  console.log(`User ID:  ${user.id}`);
  console.log(`Wallet:   Wallet #${wallet.id} (Balance: ₹${wallet.balance})`);
  console.log("Peer User (for transfers):");
  console.log(`  User ID ${peerUser.id} (${peerUser.name} - ${peerUser.email})`);
  console.log("=========================================\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
