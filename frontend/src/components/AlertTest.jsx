import React, { useState } from "react";
import AlertDialog from "./Alert/AlertDialog";

const AlertTestPage = () => {
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);

  const alerts = [
    {
      type: "success",
      title: "Berhasil!",
      message: "Data Anda telah berhasil disimpan ke database.",
      confirmText: "Tutup",
      showCancel: false,
    },
    {
      type: "error",
      title: "Terjadi Kesalahan",
      message:
        "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.",
      confirmText: "Coba Lagi",
      showCancel: true,
    },
    {
      type: "warning",
      title: "Peringatan!",
      message:
        "Anda akan keluar dari halaman ini. Perubahan yang belum disimpan akan hilang.",
      confirmText: "Lanjutkan",
      showCancel: true,
      cancelText: "Batal",
    },
    {
      type: "info",
      title: "Informasi Penting",
      message:
        "Sistem akan melakukan maintenance pada tanggal 15 Desember 2025 pukul 22.00 WIB.",
      confirmText: "Mengerti",
      showCancel: false,
    },
    {
      type: "delete",
      title: "Hapus Data?",
      message:
        "Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus",
      showCancel: true,
      cancelText: "Tidak",
    },
    {
      type: "confirm",
      title: "Konfirmasi Aksi",
      message:
        "Apakah Anda yakin ingin melanjutkan proses ini? Pastikan semua data sudah benar.",
      confirmText: "Ya, Lanjutkan",
      showCancel: true,
      cancelText: "Tidak",
    },
  ];

  const handleAlertClick = (alert) => {
    setActiveAlert(alert);
    const timestamp = new Date().toLocaleTimeString("id-ID");
    setAlertHistory((prev) => [
      {
        type: alert.type,
        time: timestamp,
      },
      ...prev.slice(0, 9),
    ]);
  };

  const getTypeColor = (type) => {
    const colors = {
      success: "bg-green-100 text-green-700 border-green-300",
      error: "bg-red-100 text-red-700 border-red-300",
      warning: "bg-yellow-100 text-yellow-700 border-yellow-300",
      info: "bg-blue-100 text-blue-700 border-blue-300",
      delete: "bg-red-100 text-red-700 border-red-300",
      confirm: "bg-purple-100 text-purple-700 border-purple-300",
    };
    return colors[type] || colors.info;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0C7A0] via-[#8B5A7C] to-[#43172F] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
            🎨 Alert Dialog Testing
          </h1>
          <p className="text-white/90 text-lg">
            Klik tombol di bawah untuk menguji berbagai tipe alert
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Alert Buttons Section */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Tipe Alert</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {alerts.map((alert, index) => (
                  <button
                    key={index}
                    onClick={() => handleAlertClick(alert)}
                    className="group bg-white hover:bg-gray-50 text-gray-800 font-semibold py-5 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F0C7A0] to-[#43172F] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <div className="relative">
                      <span className="text-lg capitalize block mb-1">
                        {alert.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        Click to test
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Usage Example */}
              <div className="mt-6 bg-[#43172F]/80 rounded-xl p-5 text-white backdrop-blur-sm">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <span>📝</span> Cara Penggunaan
                </h3>
                <pre className="text-xs bg-black/40 p-4 rounded-lg overflow-x-auto">
                  {`import AlertDialog from './components/AlertDialog';
import { useState } from 'react';

function App() {
  const [showAlert, setShowAlert] = useState(false);

  return (
    <>
      <button onClick={() => setShowAlert(true)}>
        Show Alert
      </button>

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        onConfirm={() => {
          console.log('Confirmed!');
          setShowAlert(false);
        }}
        type="success"
        title="Berhasil!"
        message="Data berhasil disimpan"
        confirmText="OK"
        cancelText="Batal"
        showCancel={true}
      />
    </>
  );
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* History & Info Section */}
          <div className="space-y-6">
            {/* Alert History */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📊</span> History
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {alertHistory.length === 0 ? (
                  <p className="text-white/60 text-sm text-center py-4">
                    Belum ada alert yang ditampilkan
                  </p>
                ) : (
                  alertHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className={`text-sm px-3 py-2 rounded-lg border ${getTypeColor(
                        item.type
                      )} flex justify-between items-center`}
                    >
                      <span className="capitalize font-medium">
                        {item.type}
                      </span>
                      <span className="text-xs opacity-75">{item.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Features Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>✨</span> Features
              </h2>
              <ul className="space-y-2 text-white/90 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>6 tipe alert berbeda</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Animasi icon yang menarik</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Backdrop blur effect</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Fully reusable component</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Responsive design</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Custom callbacks</span>
                </li>
              </ul>
            </div>

            {/* Props Documentation */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📖</span> Props
              </h2>
              <div className="space-y-2 text-white/90 text-xs">
                <div className="bg-black/20 p-2 rounded">
                  <span className="text-[#F0C7A0] font-mono">isOpen</span>
                  <span className="text-white/60"> - boolean</span>
                </div>
                <div className="bg-black/20 p-2 rounded">
                  <span className="text-[#F0C7A0] font-mono">onClose</span>
                  <span className="text-white/60"> - function</span>
                </div>
                <div className="bg-black/20 p-2 rounded">
                  <span className="text-[#F0C7A0] font-mono">onConfirm</span>
                  <span className="text-white/60"> - function</span>
                </div>
                <div className="bg-black/20 p-2 rounded">
                  <span className="text-[#F0C7A0] font-mono">type</span>
                  <span className="text-white/60"> - string</span>
                </div>
                <div className="bg-black/20 p-2 rounded">
                  <span className="text-[#F0C7A0] font-mono">title</span>
                  <span className="text-white/60"> - string</span>
                </div>
                <div className="bg-black/20 p-2 rounded">
                  <span className="text-[#F0C7A0] font-mono">message</span>
                  <span className="text-white/60"> - string</span>
                </div>
                <div className="bg-black/20 p-2 rounded">
                  <span className="text-[#F0C7A0] font-mono">confirmText</span>
                  <span className="text-white/60"> - string</span>
                </div>
                <div className="bg-black/20 p-2 rounded">
                  <span className="text-[#F0C7A0] font-mono">cancelText</span>
                  <span className="text-white/60"> - string</span>
                </div>
                <div className="bg-black/20 p-2 rounded">
                  <span className="text-[#F0C7A0] font-mono">showCancel</span>
                  <span className="text-white/60"> - boolean</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Render Active Alert */}
      {activeAlert && (
        <AlertDialog
          isOpen={!!activeAlert}
          onClose={() => setActiveAlert(null)}
          onConfirm={() => {
            console.log(`${activeAlert.type} confirmed!`);
          }}
          {...activeAlert}
        />
      )}
    </div>
  );
};

export default AlertTestPage;
