// components/Mingguan/FormDialog.jsx
import React, { useState } from "react";
import {
  X,
  Save,
  Camera,
  HardDrive,
  User,
  Building,
  CreditCard,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

// FormInput Component
const FormInput = ({
  label,
  icon,
  name,
  disabled = false,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = " ",
  ...props
}) => {
  const inputId = `input-${name}`;

  return (
    <div className="relative w-full">
      <div className="relative">
        {/* INPUT */}
        <input
          id={inputId}
          type={type}
          disabled={disabled}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={twMerge(
            `peer w-full border-b-2 border-gray-300 bg-transparent 
             focus:outline-none focus:border-transparent
             px-0 pt-5 pb-1 text-sm transition-all duration-200`,
            icon ? "pl-7" : "",
            disabled ? "opacity-70 cursor-not-allowed" : ""
          )}
          {...props}
        />

        {/* UNDERLINE ANIMATION */}
        <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#43172F] transition-all duration-300 peer-focus:w-full" />

        {/* LABEL */}
        <label
          htmlFor={inputId}
          className={twMerge(
            `absolute text-gray-500 text-xs pointer-events-none
             transition-all duration-200 ease-in-out
             peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm 
             peer-placeholder-shown:text-gray-400 
             peer-focus:top-0 peer-focus:text-xs peer-focus:text-[#43172F]`,
            icon ? "left-7" : "left-0",
            value ? "top-0 text-xs text-[#43172F]" : ""
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* ICON */}
        {icon && (
          <div
            className={twMerge(
              `absolute left-0 top-[1.35rem] text-gray-400 
               transition-colors duration-200 
               peer-focus:text-[#43172F]`
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// FormSelect Component
const FormSelect = ({
  label,
  icon,
  name,
  disabled = false,
  value,
  onChange,
  required = false,
  options = [],
  ...props
}) => {
  const inputId = `select-${name}`;

  return (
    <div className="relative w-full">
      <div className="relative">
        {/* SELECT */}
        <select
          id={inputId}
          disabled={disabled}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={twMerge(
            `peer w-full border-b-2 border-gray-300 bg-transparent 
             focus:outline-none focus:border-transparent
             px-0 pt-5 pb-1 text-sm transition-all duration-200 appearance-none`,
            icon ? "pl-7" : "",
            disabled ? "opacity-70 cursor-not-allowed" : "",
            value ? "text-gray-900" : "text-gray-400"
          )}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: "right 0.5rem center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "1.5em 1.5em",
            paddingRight: "2.5rem",
          }}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* UNDERLINE ANIMATION */}
        <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#43172F] transition-all duration-300 peer-focus:w-full" />

        {/* LABEL */}
        <label
          htmlFor={inputId}
          className={twMerge(
            `absolute text-xs text-[#43172F] pointer-events-none
             transition-all duration-200 ease-in-out top-0`,
            icon ? "left-7" : "left-0"
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {/* ICON */}
        {icon && (
          <div
            className={twMerge(
              `absolute left-0 top-[1.35rem] text-gray-400 
               transition-colors duration-200 
               peer-focus:text-[#43172F]`
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

const FormDialog = ({
  mode = "add",
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
  showAlert,
}) => {
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

    return {
      tid: "190",
      kondisiCamera: "Baik",
      kondisiNVR: "Merekam",
      nama: "ALIF AYATULLAH SUROJUL MUBAROK",
      perusahaan: "INSAN",
      noPegawai: "83045",
      namaLokasi: "BRI UNIT ",
      hari: "Senin",
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

    const submitData =
      mode === "edit" && initialData
        ? { id: initialData.id, ...formData }
        : formData;

    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getTitle = () => {
    return mode === "edit" ? "Edit Data" : "Tambah Data";
  };

  const getSubmitText = () => {
    return mode === "edit" ? "Simpan" : "Simpan";
  };

  return (
    <div
      className="fixed inset-0 bg-black/60  flex items-center justify-center z-100 px-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        button:active {
          transform: scale(0.98);
        }
      `}</style>

      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#43172F] to-[#5A1F40] px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <User className="text-white" size={16} />
              </div>
              <h2 className="text-base font-bold text-white">{getTitle()}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition p-1.5 hover:bg-white/10 rounded-lg active:scale-95"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-4">
            {/* TID */}
            <FormInput
              icon={<CreditCard size={16} />}
              label="TID (Terminal ID)"
              name="tid"
              value={formData.tid}
              onChange={handleChange}
              required
              disabled={loading}
            />

            {/* Camera & NVR */}
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                icon={<Camera size={16} />}
                label="Kondisi Camera"
                name="kondisiCamera"
                value={formData.kondisiCamera}
                onChange={handleChange}
                disabled={loading}
                options={[
                  { value: "Baik", label: "✅ Baik" },
                  { value: "Problem", label: "❌ Problem" },
                ]}
              />

              <FormSelect
                icon={<HardDrive size={16} />}
                label="Kondisi NVR"
                name="kondisiNVR"
                value={formData.kondisiNVR}
                onChange={handleChange}
                disabled={loading}
                options={[
                  { value: "Merekam", label: "✅ Merekam" },
                  { value: "Problem", label: "❌ Problem" },
                ]}
              />
            </div>

            {/* Nama */}
            <FormInput
              icon={<User size={16} />}
              label="Nama Petugas"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              disabled={loading}
            />

            {/* Perusahaan */}
            <FormInput
              icon={<Building size={16} />}
              label="Perusahaan"
              name="perusahaan"
              value={formData.perusahaan}
              onChange={handleChange}
              required
              disabled={loading}
            />

            {/* No Pegawai */}
            <FormInput
              icon={<CreditCard size={16} />}
              label="No Pegawai (Opsional)"
              name="noPegawai"
              value={formData.noPegawai}
              onChange={handleChange}
              disabled={loading}
            />

            {/* Nama Lokasi */}
            <FormInput
              icon={<MapPin size={16} />}
              label="Nama Lokasi (Opsional)"
              name="namaLokasi"
              value={formData.namaLokasi}
              onChange={handleChange}
              disabled={loading}
            />

            {/* Hari */}
            <FormSelect
              icon={<CalendarDays size={16} />}
              label="Hari (Opsional)"
              name="hari"
              value={formData.hari}
              onChange={handleChange}
              disabled={loading}
              options={[
                { value: "", label: "Pilih Hari" },
                { value: "Senin", label: "Senin" },
                { value: "Selasa", label: "Selasa" },
                { value: "Rabu", label: "Rabu" },
                { value: "Kamis", label: "Kamis" },
                { value: "Jumat", label: "Jumat" },
                { value: "Sabtu", label: "Sabtu" },
                { value: "Minggu", label: "Minggu" },
              ]}
            />
          </div>

          {/* Footer Buttons */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all disabled:opacity-50 active:scale-95"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-[#43172F] to-[#5A1F40] text-white rounded-xl hover:shadow-lg font-semibold transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {getSubmitText()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormDialog;
