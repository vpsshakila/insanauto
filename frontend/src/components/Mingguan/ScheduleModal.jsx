// components/Mingguan/ScheduleModal.jsx
import React, { useState } from "react";
import { X, Calendar, Clock, AlertCircle, Upload } from "lucide-react";
import { twMerge } from "tailwind-merge";

// FormInput Component (sama dengan di FormDialog)
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

const ScheduleModal = ({ onClose, onSchedule, loading, selectedCount }) => {
  const [scheduledTime, setScheduledTime] = useState("");

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!scheduledTime) {
      alert("Pilih waktu penjadwalan!");
      return;
    }
    onSchedule(scheduledTime);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 px-6"
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
        
        /* Custom styling for datetime-local input */
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(0.5);
          cursor: pointer;
        }
        
        input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
          filter: invert(0.3);
        }
      `}</style>

      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#43172F] to-[#5A1F40] px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                <Calendar className="text-white" size={16} />
              </div>
              <h2 className="text-base font-bold text-white">
                Jadwalkan Upload
              </h2>
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
          {/* Info Box */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex  items-center gap-3">
                <div className="mt-0.5">
                  <AlertCircle size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    {selectedCount} data akan diupload otomatis
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Upload akan dilakukan secara berurutan untuk menghindari
                    konflik sistem.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* DateTime Input dengan styling yang sama */}
            <div className="relative w-full">
              <div className="relative">
                <label className="absolute text-xs text-[#43172F] pointer-events-none top-0 left-7">
                  Waktu Upload
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div className="relative">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={getMinDateTime()}
                    required
                    className={`
                      peer w-full border-b-2 border-gray-300 bg-transparent 
                      focus:outline-none focus:border-transparent
                      px-0 pt-5 pb-1 text-sm transition-all duration-200
                      pl-7 pr-10
                      ${scheduledTime ? "text-gray-900" : "text-gray-400"}
                    `}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Cline x1='16' y1='2' x2='16' y2='6'%3E%3C/line%3E%3Cline x1='8' y1='2' x2='8' y2='6'%3E%3C/line%3E%3Cline x1='3' y1='10' x2='21' y2='10'%3E%3C/line%3E%3C/svg%3E")`,
                      backgroundPosition: "left 0.5rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.2em 1.2em",
                    }}
                  />

                  {/* UNDERLINE ANIMATION */}
                  <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#43172F] transition-all duration-300 peer-focus:w-full" />
                </div>

                {/* Icon tambahan di kanan */}
                <div className="absolute right-0 top-4 text-gray-400">
                  <Clock size={16} />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2 ml-7 flex items-center gap-1">
                <span className="text-amber-600">⏰</span>
                Minimal 5 menit dari waktu sekarang
              </p>
            </div>

            {/* Note */}
            <div className="mt-2">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Perhatian:</span> Pastikan waktu
                  yang dipilih sudah tepat. Proses upload tidak dapat dibatalkan
                  setelah dijadwalkan.
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Jumlah data:</span>
                <span className="font-semibold text-[#43172F]">
                  {selectedCount} TID
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <Clock size={10} className="mr-1" />
                  Menunggu jadwal
                </span>
              </div>
            </div>
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
                  Menjadwalkan...
                </>
              ) : (
                <>
                  <Calendar size={16} />
                  Jadwalkan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
