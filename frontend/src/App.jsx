// App.jsx (yang sudah dimodifikasi)
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MingguanPage from "./pages/Mingguan/MingguanPage";
import Home from "./pages/Home";
import BottomNav from "./components/Menu/BottomNav";
import LaporanPage from "./pages/LaporanPage";
import AnalisisPage from "./pages/AnalisisPage";
import ProfilPage from "./pages/ProfilPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
        <div className="">
          {" "}
          {/* Padding lebih kecil */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mingguan" element={<MingguanPage />} />
            <Route path="/laporan" element={<LaporanPage />} />
            <Route path="/analisis" element={<AnalisisPage />} />
            <Route path="/profil" element={<ProfilPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
