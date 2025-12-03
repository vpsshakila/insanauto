// config/database.js
const mongoose = require("mongoose");
require("dotenv").config();

class Database {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;

    // Build MongoDB URI
    const DB_USER = process.env.DB_USER || "admin";
    const DB_PASSWORD = process.env.DB_PASSWORD || "secret";
    const DB_HOST = process.env.DB_HOST || "localhost";
    const DB_PORT = process.env.DB_PORT || 27017;
    const DB_NAME = process.env.DB_NAME || "form_scheduler";

    this.mongoURI = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;
  }

  async connect() {
    if (this.isInitialized) {
      console.log("⚠️  Database already connected");
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._connect();
    await this.initPromise;
    this.isInitialized = true;
  }

  async _connect() {
    try {
      console.log("🔌 Connecting to MongoDB...");
      console.log(
        `   Host: ${process.env.DB_HOST || "localhost"}:${
          process.env.DB_PORT || 27017
        }`
      );
      console.log(`   Database: ${process.env.DB_NAME || "form_scheduler"}`);

      await mongoose.connect(this.mongoURI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });

      console.log("✅ Connected to MongoDB");

      // Event listeners
      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        console.log("⚠️  MongoDB disconnected");
      });

      mongoose.connection.on("reconnected", () => {
        console.log("✅ MongoDB reconnected");
      });

      console.log("✅ MongoDB database initialized");
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);
      throw error;
    }
  }

  async close() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("🔌 MongoDB connection closed");
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();
