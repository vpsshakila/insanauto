// components/Mingguan/FormDataCard.jsx
import { Trash2, Edit2, CheckSquare, Square } from "lucide-react";

const FormDataCard = ({ data, isSelected, onSelect, onEdit, onDelete }) => {
  const getStatusIcon = (status) => {
    return status === "Baik" || status === "Merekam" ? "✅" : "❌";
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 ${
        isSelected
          ? "border-[#43172F] shadow-md"
          : "border-transparent hover:border-gray-200 hover:shadow"
      }`}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={onSelect}
              className="mt-1 flex-shrink-0"
              aria-label={isSelected ? "Deselect" : "Select"}
            >
              {isSelected ? (
                <CheckSquare
                  size={22}
                  className="text-[#43172F]"
                  fill="#43172F"
                />
              ) : (
                <Square size={22} className="text-gray-400" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-[#43172F]">
                  TID:{" "}
                  <span className="bg-[#F0C7A0]/30 px-3 py-1 rounded-md">
                    {data.tid}
                  </span>
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">
                    {data.namaLokasi || "Lokasi belum diisi"}
                  </span>
                </div>
              </div>

              {/* Hari */}
              {data.hari && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#43172F]/10 text-[#43172F]">
                    {data.hari}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={onEdit}
              className="p-2 text-[#8B5A2B] hover:bg-[#F0C7A0]/20 rounded-lg transition"
              aria-label="Edit"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => onDelete(data.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              aria-label="Hapus"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Kondisi Row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Kondisi Camera</div>
            <div className="font-medium flex items-center gap-2">
              <span>{getStatusIcon(data.kondisiCamera)}</span>
              <span
                className={
                  data.kondisiCamera === "Baik"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {data.kondisiCamera}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Kondisi NVR</div>
            <div className="font-medium flex items-center gap-2">
              <span>{getStatusIcon(data.kondisiNVR)}</span>
              <span
                className={
                  data.kondisiNVR === "Merekam"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {data.kondisiNVR}
              </span>
            </div>
          </div>
        </div>

        {/* Detail Petugas */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            Detail Petugas
          </div>

          <div className="space-y-3">
            {/* Nama */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24 flex-shrink-0">
                Nama:
              </span>
              <span className="font-medium text-gray-800">{data.nama}</span>
            </div>

            {/* Perusahaan */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24 flex-shrink-0">
                Perusahaan:
              </span>
              <span className="font-medium text-gray-800">
                {data.perusahaan}
              </span>
            </div>

            {/* No Pegawai */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-24 flex-shrink-0">
                No Pegawai:
              </span>
              <span className="font-medium text-gray-800">
                {data.noPegawai}
              </span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
              data.isFromDB
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            ✅ Tersimpan di Database
          </span>
        </div>
      </div>
    </div>
  );
};

export default FormDataCard;
