import React from "react";
import { Trash2 } from "lucide-react";

const FormDataTable = ({
  data,
  selectedRows,
  onSelectRow,
  onSelectAll,
  onUpdateRow,
  onDeleteRow,
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">Belum ada data form</p>
        <p className="text-sm">Klik "Tambah Row" untuk menambahkan data</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedRows.length === data.length && data.length > 0}
                onChange={onSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              TID
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Kondisi Camera
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Kondisi NVR
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Nama
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Perusahaan
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              No Pegawai
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-gray-200 hover:bg-gray-50 ${
                selectedRows.includes(row.id) ? "bg-blue-50" : ""
              }`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(row.id)}
                  onChange={() => onSelectRow(row.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={row.tid}
                  onChange={(e) => onUpdateRow(row.id, "tid", e.target.value)}
                  placeholder="190410"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </td>
              <td className="px-4 py-3">
                <select
                  value={row.kondisiCamera}
                  onChange={(e) =>
                    onUpdateRow(row.id, "kondisiCamera", e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Baik">✅ Baik</option>
                  <option value="Problem">❌ Problem</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <select
                  value={row.kondisiNVR}
                  onChange={(e) =>
                    onUpdateRow(row.id, "kondisiNVR", e.target.value)
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Merekam">✅ Merekam</option>
                  <option value="Problem">❌ Problem</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={row.nama}
                  onChange={(e) => onUpdateRow(row.id, "nama", e.target.value)}
                  placeholder="Nama Petugas"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={row.perusahaan}
                  onChange={(e) =>
                    onUpdateRow(row.id, "perusahaan", e.target.value)
                  }
                  placeholder="Nama Perusahaan"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={row.noPegawai}
                  onChange={(e) =>
                    onUpdateRow(row.id, "noPegawai", e.target.value)
                  }
                  placeholder="12345"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onDeleteRow(row.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                  title="Hapus row"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FormDataTable;
