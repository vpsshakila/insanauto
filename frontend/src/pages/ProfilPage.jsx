// pages/ProfilPage.jsx (contoh halaman)
import useTitle from "../hooks/useTitle";

const ProfilPage = () => {
  useTitle("Profil - Insan");
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Profil</h1>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-gray-600">
          Halaman profil akan ditampilkan di sini.
        </p>
      </div>
    </div>
  );
};

export default ProfilPage;
