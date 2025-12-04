// components/Mingguan/JobsCard.jsx
import {
  Trash2,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Calendar,
  User,
} from "lucide-react";

const JobsCard = ({ jobs, onCancel, onDelete }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: Clock,
        label: "Menunggu",
      },
      processing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: Clock,
        label: "Diproses",
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Selesai",
      },
      failed: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: AlertCircle,
        label: "Gagal",
      },
      cancelled: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: XCircle,
        label: "Dibatalkan",
      },
    };
    return configs[status] || configs.pending;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Format tanggal
    const dateStr = date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

    // Format waktu
    const timeStr = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Waktu tersisa
    let timeRemaining;
    if (diffDays < 0) {
      timeRemaining = "Lewat waktu";
    } else if (diffDays === 0) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      timeRemaining = diffHours <= 0 ? "Hari ini" : `${diffHours} jam lagi`;
    } else if (diffDays === 1) {
      timeRemaining = "Besok";
    } else {
      timeRemaining = `${diffDays} hari lagi`;
    }

    return { dateStr, timeStr, timeRemaining };
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 md:p-12 text-center shadow-sm">
        <div className="text-6xl mb-6 opacity-20">⏰</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-3">
          Belum ada scheduled jobs
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Pilih data form dan jadwalkan upload untuk membuat scheduled jobs
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {jobs.map((job) => {
        const statusConfig = getStatusConfig(job.status);
        const Icon = statusConfig.icon;
        const { dateStr, timeStr, timeRemaining } = formatDateTime(
          job.scheduled_time
        );

        return (
          <div
            key={job._id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="p-4 md:p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-[#43172F]">
                      TID:{" "}
                      <span className="bg-[#F0C7A0]/30 px-2 py-1 rounded">
                        {job.tid}
                      </span>
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                    >
                      <Icon size={12} />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} />
                    <span className="truncate">{job.nama}</span>
                  </div>
                </div>

                <ChevronRight
                  size={20}
                  className="text-gray-400 flex-shrink-0 ml-2"
                />
              </div>

              {/* Job Details */}
              <div className="space-y-4">
                {/* Perusahaan */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Perusahaan</div>
                  <div className="font-medium text-gray-800 truncate">
                    {job.perusahaan}
                  </div>
                </div>

                {/* Waktu Jadwal */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Calendar size={12} />
                      Tanggal
                    </div>
                    <div className="font-medium text-gray-800">{dateStr}</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Jam</div>
                    <div className="font-medium text-gray-800">{timeStr}</div>
                  </div>
                </div>

                {/* Waktu Tersisa */}
                <div
                  className={`rounded-lg p-3 ${
                    timeRemaining === "Lewat waktu"
                      ? "bg-red-50 border border-red-100"
                      : timeRemaining.includes("hari")
                      ? "bg-orange-50 border border-orange-100"
                      : "bg-green-50 border border-green-100"
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1">Sisa Waktu</div>
                  <div
                    className={`font-medium ${
                      timeRemaining === "Lewat waktu"
                        ? "text-red-600"
                        : timeRemaining.includes("hari")
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
                    {timeRemaining}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  {job.status === "pending" ? (
                    <>
                      <button
                        onClick={() => onCancel(job.job_id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm hover:bg-yellow-100 transition font-medium"
                      >
                        <XCircle size={16} />
                        <span>Batalkan</span>
                      </button>
                      <button
                        onClick={() => onDelete(job.job_id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 transition font-medium"
                      >
                        <Trash2 size={16} />
                        <span>Hapus</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onDelete(job.job_id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition font-medium"
                    >
                      <Trash2 size={16} />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JobsCard;
