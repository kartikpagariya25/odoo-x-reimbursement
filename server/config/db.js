const mongoose = require("mongoose");

const DEFAULT_DB_OPTIONS = {
	maxPoolSize: 10,
	serverSelectionTimeoutMS: 10000,
	socketTimeoutMS: 45000,
	retryWrites: true,
	w: "majority"
};

const connectDB = async () => {
	const mongoUri = process.env.MONGO_URI;

	if (!mongoUri) {
		throw new Error("MONGO_URI is not configured");
	}

	await mongoose.connect(mongoUri, DEFAULT_DB_OPTIONS);
	return mongoose.connection;
};

module.exports = { connectDB };
