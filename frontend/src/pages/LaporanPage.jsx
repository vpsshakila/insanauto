// pages/LaporanPage.jsx (contoh halaman)
import React from "react";
import AlertTest from "../components/AlertTest";

const LaporanPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Laporan</h1>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-gray-600">
          Halaman laporan akan ditampilkan di sini.
        </p>
        <AlertTest />
      </div>
    </div>
  );
};

export default LaporanPage;
