require("dotenv").config();

const { connectDB } = require("./config/db");

const MODELS = [
  "./models/Company",
  "./models/User",
  "./models/ApprovalRule",
  "./models/Expense",
  "./models/ApprovalAction",
  "./models/AuditLog"
];

const registerModels = () => {
  MODELS.forEach((modelPath) => {
    try {
      require(modelPath);
    } catch (error) {
      console.error(`Failed to load model ${modelPath}:`, error.message);
      process.exit(1);
    }
  });
};

// ❗ THEN load app
const app = require("./app");

const startServer = async () => {
  try {
    registerModels();
    await connectDB();
    console.log("MongoDB Connected ✅");

    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running 🚀");
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
