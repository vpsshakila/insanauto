// components/Mingguan/FormDialog.jsx
import React, { useState } from "react";
import {
  X,
  Save,
  Camera,
  HardDrive,
  User,
  Building,
  IdCard,
  MapPin,
  CalendarDays,
} from "lucide-react";

const FormDialog = ({
  mode = "add", // 'add' atau 'edit'
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
  showAlert, // Tambahkan prop untuk showAlert
}) => {
  // Inisialisasi form langsung berdasarkan mode dan initialData
  const [formData, setFormData] = useState(() => {
    if (mode === "edit" && initialData) {
      return {
        tid: initialData.tid || "",
        kondisiCamera: initialData.kondisiCamera || "Baik",
        kondisiNVR: initialData.kondisiNVR || "Merekam",
        nama: initialData.nama || "",
        perusahaan: initialData.perusahaan || "",
        noPegawai: initialData.noPegawai || "",
        namaLokasi: initialData.namaLokasi || "",
        hari: initialData.hari || "",
      };
    }

    // Default untuk mode add
    return {
      tid: "",
      kondisiCamera: "Baik",
      kondisiNVR: "Merekam",
      nama: "",
      perusahaan: "",
      noPegawai: "",
      namaLokasi: "",
      hari: "",
    };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tid || !formData.nama || !formData.perusahaan) {
      showAlert({
        type: "error",
        title: "Validasi Gagal",
        message: "Harap isi TID, Nama, dan Perusahaan!",
      });
      return;
    }

    // Untuk mode edit, tambahkan ID
    const submitData =
      mode === "edit" && initialData
        ? { id: initialData.id, ...formData }
        : formData;

    onSubmit(submitData);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const getTitle = () => {
    return mode === "edit" ? "Form Edit Data" : "Form Tambah Data";
  };

  const getSubmitText = () => {
    return mode === "edit" ? "Simpan Perubahan" : "Simpan ke Database";
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-100 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#43172F] to-[#5A1F40] px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <User className="text-white" size={16} />
              </div>
              <div>
                <h2 className="text-md font-bold text-white">{getTitle()}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition p-2 hover:bg-white/10 rounded-lg"
              disabled={loading}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* TID */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <IdCard size={16} className="text-[#43172F]" />
                TID (Terminal ID)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.tid}
                onChange={(e) => handleChange("tid", e.target.value)}
                placeholder="Contoh: 190410"
                required
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#43172F] focus:ring-2 focus:ring-[#43172F]/20 focus:outline-none transition disabled:bg-gray-100 disabled:opacity-70"
              />
            </div>

            {/* Camera & NVR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Camera size={16} className="text-[#43172F]" />
                  Kondisi Camera
                </label>
                <select
                  value={formData.kondisiCamera}
                  onChange={(e) =>
                    handleChange("kondisiCamera", e.target.value)
                  }
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#43172F] focus:ring-2 focus:ring-[#43172F]/20 focus:outline-none transition disabled:bg-gray-100 disabled:opacity-70"
                >
                  <option value="Baik">✅ Baik</option>
                  <option value="Problem">❌ Problem</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <HardDrive size={16} className="text-[#43172F]" />
                  Kondisi NVR
                </label>
                <select
                  value={formData.kondisiNVR}
                  onChange={(e) => handleChange("kondisiNVR", e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#43172F] focus:ring-2 focus:ring-[#43172F]/20 focus:outline-none transition disabled:bg-gray-100 disabled:opacity-70"
                >
                  <option value="Merekam">✅ Merekam</option>
                  <option value="Problem">❌ Problem</option>
                </select>
              </div>
            </div>

            {/* Nama */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-[#43172F]" />
                Nama Petugas
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => handleChange("nama", e.target.value)}
                placeholder="Nama lengkap petugas"
                required
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#43172F] focus:ring-2 focus:ring-[#43172F]/20 focus:outline-none transition disabled:bg-gray-100 disabled:opacity-70"
              />
            </div>

            {/* Perusahaan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Building size={16} className="text-[#43172F]" />
                Perusahaan
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.perusahaan}
                onChange={(e) => handleChange("perusahaan", e.target.value)}
                placeholder="Nama perusahaan"
                required
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#43172F] focus:ring-2 focus:ring-[#43172F]/20 focus:outline-none transition disabled:bg-gray-100 disabled:opacity-70"
              />
            </div>

            {/* No Pegawai */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                No Pegawai (Opsional)
              </label>
              <input
                type="text"
                value={formData.noPegawai}
                onChange={(e) => handleChange("noPegawai", e.target.value)}
                placeholder="Contoh: 12345"
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#43172F] focus:ring-2 focus:ring-[#43172F]/20 focus:outline-none transition disabled:bg-gray-100 disabled:opacity-70"
              />
            </div>

            {/* Nama Lokasi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-[#43172F]" />
                Nama Lokasi (Opsional)
              </label>
              <input
                type="text"
                value={formData.namaLokasi}
                onChange={(e) => handleChange("namaLokasi", e.target.value)}
                placeholder="Nama lokasi"
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#43172F] focus:ring-2 focus:ring-[#43172F]/20 focus:outline-none transition disabled:bg-gray-100 disabled:opacity-70"
              />
            </div>

            {/* Hari */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <CalendarDays size={16} className="text-[#43172F]" />
                Hari (Opsional)
              </label>
              <select
                value={formData.hari}
                onChange={(e) => handleChange("hari", e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#43172F] focus:ring-2 focus:ring-[#43172F]/20 focus:outline-none transition disabled:bg-gray-100 disabled:opacity-70"
              >
                <option value="">Pilih Hari</option>
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Minggu">Minggu</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#43172F] to-[#5A1F40] text-white rounded-lg hover:shadow-lg font-medium transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {getSubmitText()}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormDialog;
