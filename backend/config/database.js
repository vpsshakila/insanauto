const mongoose = require("mongoose");
require("dotenv").config();

class Database {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 detik

    // Build MongoDB URI
    const DB_USER = process.env.DB_USER || "admin";
    const DB_PASSWORD = process.env.DB_PASSWORD || "secret";
    const DB_HOST = process.env.DB_HOST || "localhost";
    const DB_PORT = process.env.DB_PORT || 27017;
    const DB_NAME = process.env.DB_NAME || "form_scheduler";

    // Gunakan URI dari env jika ada, jika tidak build manual
    this.mongoURI =
      process.env.MONGODB_URI ||
      `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?authSource=admin`;

    // Options untuk koneksi
    this.connectionOptions = {
      serverSelectionTimeoutMS: 15000, // 15 detik
      socketTimeoutMS: 45000, // 45 detik
      connectTimeoutMS: 15000, // 15 detik
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
      heartbeatFrequencyMS: 10000,
    };
  }

  async connect() {
    if (this.isInitialized && mongoose.connection.readyState === 1) {
      console.log("⚠️  Database already connected");
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._connectWithRetry();
    try {
      await this.initPromise;
      this.isInitialized = true;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  async _connectWithRetry() {
    while (this.connectionAttempts < this.maxRetries) {
      try {
        console.log(
          `🔌 Attempt ${this.connectionAttempts + 1}/${
            this.maxRetries
          } to connect to MongoDB...`
        );

        // Hide password in logs for security
        const safeURI = this.mongoURI.replace(
          /\/\/([^:]+):([^@]+)@/,
          "//***:***@"
        );
        console.log(`   URI: ${safeURI}`);

        await mongoose.connect(this.mongoURI, this.connectionOptions);

        console.log("✅ Connected to MongoDB successfully");

        this.connectionAttempts = 0; // Reset counter on success
        this.setupEventListeners();

        return;
      } catch (error) {
        this.connectionAttempts++;

        console.error(
          `❌ Connection attempt ${this.connectionAttempts} failed:`,
          error.message
        );

        if (this.connectionAttempts >= this.maxRetries) {
          console.error(`💡 Failed after ${this.maxRetries} attempts`);
          throw new Error(
            `Failed to connect to MongoDB after ${this.maxRetries} attempts: ${error.message}`
          );
        }

        console.log(`   ⏳ Retrying in ${this.retryDelay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  setupEventListeners() {
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected");
      this.isInitialized = true;
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
      this.isInitialized = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected");
      this.isInitialized = false;

      // Auto-reconnect setelah 5 detik
      setTimeout(() => {
        if (mongoose.connection.readyState === 0) {
          console.log("🔄 Attempting auto-reconnect...");
          this.reconnect();
        }
      }, 5000);
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
      this.isInitialized = true;
    });

    mongoose.connection.on("close", () => {
      console.log("🔌 MongoDB connection closed");
      this.isInitialized = false;
    });
  }

  async reconnect() {
    try {
      if (mongoose.connection.readyState === 0) {
        console.log("🔄 Reconnecting to MongoDB...");
        this.initPromise = null;
        await this.connect();
      }
    } catch (error) {
      console.error("❌ Reconnection failed:", error.message);
    }
  }

  async close() {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(true); // force close
        console.log("🔌 MongoDB connection closed");
        this.isInitialized = false;
        this.initPromise = null;
      }
    } catch (error) {
      console.error("❌ Error closing connection:", error.message);
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  getStatus() {
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    return {
      readyState: states[mongoose.connection.readyState] || "unknown",
      isConnected: mongoose.connection.readyState === 1,
      isInitialized: this.isInitialized,
      host: mongoose.connection.host || "unknown",
      name: mongoose.connection.name || "unknown",
      models: Object.keys(mongoose.connection.models || {}),
      connectionAttempts: this.connectionAttempts,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Helper untuk execute query dengan safety check
   */
  async executeWithConnection(callback) {
    try {
      // Cek koneksi
      if (!this.isConnected()) {
        console.log("🔄 Database not connected, attempting to reconnect...");
        await this.reconnect();

        // Tunggu sedikit untuk connection stabil
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!this.isConnected()) {
          throw new Error("Database not available after reconnection attempt");
        }
      }

      return await callback();
    } catch (error) {
      console.error("❌ Database operation failed:", error.message);
      throw error;
    }
  }
}

module.exports = new Database();
