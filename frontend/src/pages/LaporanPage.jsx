// pages/LaporanPage.jsx (contoh halaman)
import useTitle from "../hooks/useTitle";

const LaporanPage = () => {
  useTitle("Laporan - Insan");
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Laporan</h1>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-gray-600">
          Halaman laporan akan ditampilkan di sini.
        </p>
      </div>
    </div>
  );
};

export default LaporanPage;
