require("dotenv").config();

const { connectDB } = require("../config/db");
const Expense = require("../models/Expense");

const shouldApply = process.argv.includes("--apply");

const printCounts = async (label) => {
  const collection = Expense.collection;

  const hasLegacyOnly = await collection.countDocuments({
    mechantName: { $exists: true },
    $or: [{ merchantName: { $exists: false } }, { merchantName: null }]
  });

  const hasBothFields = await collection.countDocuments({
    mechantName: { $exists: true },
    merchantName: { $exists: true }
  });

  console.log(`\n[${label}]`);
  console.log(`Legacy-only records (mechantName only): ${hasLegacyOnly}`);
  console.log(`Records with both fields: ${hasBothFields}`);

  return { hasLegacyOnly, hasBothFields };
};

const migrate = async () => {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    await printCounts("Before migration");

    if (!shouldApply) {
      console.log("\nDry run mode. Re-run with --apply to execute migration.");
      process.exit(0);
    }

    const collection = Expense.collection;

    const copyResult = await collection.updateMany(
      {
        mechantName: { $exists: true },
        $or: [{ merchantName: { $exists: false } }, { merchantName: null }]
      },
      [
        { $set: { merchantName: "$mechantName" } },
        { $unset: "mechantName" }
      ]
    );

    const cleanupResult = await collection.updateMany(
      {
        mechantName: { $exists: true },
        merchantName: { $exists: true }
      },
      [{ $unset: "mechantName" }]
    );

    console.log("\nMigration complete.");
    console.log(`Copied records: ${copyResult.modifiedCount}`);
    console.log(`Cleaned records: ${cleanupResult.modifiedCount}`);

    await printCounts("After migration");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
};

migrate();
