// pages/AnalisisPage.jsx (halaman baru untuk menu Analisis)
import React from "react";
import useTitle from "../hooks/useTitle";

const AnalisisPage = () => {
  useTitle("Analisis - Insan");
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Analisis</h1>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-gray-600">
          Halaman analisis akan ditampilkan di sini.
        </p>
      </div>
    </div>
  );
};

export default AnalisisPage;
