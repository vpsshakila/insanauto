// components/Mingguan/JobsTable.jsx
import { Trash2, XCircle, CheckCircle, Clock, AlertCircle } from "lucide-react";

const JobsTable = ({ jobs, onCancel, onDelete }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Clock,
        label: "Pending",
      },
      processing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: Clock,
        label: "Processing",
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Completed",
      },
      failed: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: AlertCircle,
        label: "Failed",
      },
      cancelled: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: XCircle,
        label: "Cancelled",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("id-ID", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">Belum ada jobs yang dijadwalkan</p>
        <p className="text-sm">Jobs yang dijadwalkan akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              TID
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Nama
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Perusahaan
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Waktu Jadwal
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Status
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job._id}
              className="border-b border-gray-200 hover:bg-gray-50"
            >
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {job.tid}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{job.nama}</td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {job.perusahaan}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {formatDate(job.scheduled_time)}
              </td>
              <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  {job.status === "pending" && (
                    <>
                      <button
                        onClick={() => onCancel(job.job_id)}
                        className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition"
                        title="Cancel job"
                      >
                        <XCircle size={18} />
                      </button>
                      <button
                        onClick={() => onDelete(job.job_id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        title="Delete job"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  {job.status !== "pending" && (
                    <button
                      onClick={() => onDelete(job.job_id)}
                      className="p-1 text-gray-400 hover:bg-gray-50 rounded transition"
                      title="Delete job"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JobsTable;
