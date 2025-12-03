import React, { useState } from "react";
import { X, Calendar } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">
              Jadwalkan Upload
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>{selectedCount} form</strong> akan dijadwalkan untuk
                diupload secara otomatis
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Waktu Upload
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              min={getMinDateTime()}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">
              ⏰ Minimal 5 menit dari sekarang
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-xs text-yellow-800">
              <strong>Info:</strong> Form akan diupload secara berurutan (satu
              per satu) meskipun dijadwalkan di waktu yang sama untuk
              menghindari konflik.
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Calendar size={18} />
                  Jadwalkan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
