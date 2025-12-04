// components/Mingguan/ScheduleModal.jsx
import React, { useState } from "react";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#43172F] to-[#5A1F40] p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Jadwalkan Upload
                </h2>
                <p className="text-sm text-[#F0C7A0]/80">
                  {selectedCount} data form akan diupload
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition"
              disabled={loading}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <AlertCircle size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    {selectedCount} data form akan diupload secara otomatis
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Upload akan dilakukan secara berurutan
                  </p>
                </div>
              </div>
            </div>

            {/* DateTime Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-[#43172F]" />
                  Pilih Waktu Upload
                </span>
              </label>

              <div className="relative">
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={getMinDateTime()}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#43172F] focus:ring-2 focus:ring-[#43172F]/20 focus:outline-none transition pl-12"
                />
                <div className="absolute left-4 top-3.5 text-gray-400">📅</div>
              </div>

              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="text-amber-600">⏰</span>
                Minimal 5 menit dari waktu sekarang
              </p>
            </div>

            {/* Note */}
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Perhatian:</span> Form akan
                diupload satu per satu secara berurutan untuk menghindari
                konflik sistem.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#43172F] to-[#5A1F40] text-white rounded-lg hover:shadow-lg font-medium transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Calendar size={20} />
                    Jadwalkan Upload
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

export default ScheduleModal;
