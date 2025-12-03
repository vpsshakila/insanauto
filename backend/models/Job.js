// models/Job.js
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    job_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tid: {
      type: String,
      required: true,
    },
    kondisi_camera: {
      type: String,
      required: true,
      enum: ["Baik", "Problem"],
    },
    kondisi_nvr: {
      type: String,
      required: true,
      enum: ["Merekam", "Problem"],
    },
    nama: {
      type: String,
      required: true,
    },
    perusahaan: {
      type: String,
      required: true,
    },
    no_pegawai: {
      type: String,
      required: true,
    },
    scheduled_time: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    executed_at: {
      type: Date,
      default: null,
    },
    error_message: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Job", jobSchema);
