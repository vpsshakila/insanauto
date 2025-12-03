// models/FormTemplate.js
const mongoose = require("mongoose");

const formTemplateSchema = new mongoose.Schema(
  {
    tid: {
      type: String,
      required: true,
    },
    kondisi_camera: {
      type: String,
      required: true,
      enum: ["Baik", "Problem"],
      default: "Baik",
    },
    kondisi_nvr: {
      type: String,
      required: true,
      enum: ["Merekam", "Problem"],
      default: "Merekam",
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
    nama_lokasi: {
      // Tambahkan field ini
      type: String,
      default: "",
    },
    hari: {
      // Tambahkan field ini
      type: String,
      enum: [
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
        "Minggu",
        "",
      ],
      default: "",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("FormTemplate", formTemplateSchema);
