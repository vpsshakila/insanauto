// components/Mingguan/JobsCard.jsx
import React from "react";
import {
  Trash2,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  ChevronDown,
  Terminal,
  Hourglass,
} from "lucide-react";

const JobsCard = ({ jobs, onCancel, onDelete }) => {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-700",
        icon: Clock,
        label: "Pending",
      },
      processing: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        icon: Clock,
        label: "Processing",
      },
      completed: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-700",
        icon: CheckCircle,
        label: "Completed",
      },
      failed: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-700",
        icon: AlertCircle,
        label: "Failed",
      },
      cancelled: {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-700",
        icon: XCircle,
        label: "Cancelled",
      },
    };
    return configs[status] || configs.pending;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;

    // Format tanggal pendek
    const dateStr = date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });

    // Format waktu
    const timeStr = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Format waktu tersisa yang lebih sederhana
    let timeRemaining;
    let timeRemainingColor = "text-gray-600";
    let timeRemainingIcon = <Clock size={14} />;

    if (diffTime < 0) {
      timeRemaining = "Overdue";
      timeRemainingColor = "text-red-600";
      timeRemainingIcon = <AlertCircle size={14} />;
    } else {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        timeRemaining = `${diffDays}d`;
        timeRemainingColor =
          diffDays <= 1 ? "text-orange-600" : "text-blue-600";
      } else if (diffHours > 0) {
        timeRemaining = `${diffHours}h`;
        timeRemainingColor =
          diffHours <= 3 ? "text-orange-600" : "text-green-600";
      } else {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        timeRemaining = `${diffMinutes}m`;
        timeRemainingColor = "text-green-600";
      }
    }

    return {
      dateStr,
      timeStr,
      timeRemaining,
      timeRemainingColor,
      timeRemainingIcon,
    };
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center shadow">
        <div className="text-4xl mb-3 opacity-20">⏰</div>
        <h3 className="text-base font-semibold text-gray-700 mb-1">
          No scheduled jobs
        </h3>
        <p className="text-gray-500 text-sm">Schedule forms to create jobs</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const statusConfig = getStatusConfig(job.status);
        const Icon = statusConfig.icon;
        const { dateStr, timeStr, timeRemaining, timeRemainingColor } =
          formatDateTime(job.scheduled_time || job.scheduledTime);

        return (
          <div
            key={job._id}
            className="bg-white rounded-xl shadow border border-gray-100"
          >
            {/* Compact Job Card */}
            <div className="p-3">
              {/* Header Line - Status + TID */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    <Icon size={12} />
                    <span>{statusConfig.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="p-1 bg-gray-100 rounded">
                      <Terminal size={14} className="text-gray-600" />
                    </div>
                    <span className="text-base font-bold text-gray-800">
                      {job.tid}
                    </span>
                  </div>
                </div>

                {/* Action Menu */}
                {job.status === "pending" && (
                  <button
                    onClick={() => onCancel(job.job_id || job._id)}
                    className="p-1.5 text-gray-500 hover:text-red-600"
                    aria-label="Cancel job"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>

              {/* Time Info - Compact Layout */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* Date */}
                <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-lg">
                  <div className="p-1 bg-white rounded">
                    <Calendar size={14} className="text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-gray-500 font-medium">
                      Date
                    </div>
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {dateStr}
                    </div>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-lg">
                  <div className="p-1 bg-white rounded">
                    <Clock size={14} className="text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-gray-500 font-medium">
                      Time
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      {timeStr}
                    </div>
                  </div>
                </div>

                {/* Time Remaining */}
                <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-lg">
                  <div className="p-1 bg-white rounded">
                    <Hourglass size={14} className="text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-gray-500 font-medium">
                      Remaining
                    </div>
                    <div
                      className={`text-sm font-semibold ${timeRemainingColor}`}
                    >
                      {timeRemaining}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delete Button - Small at bottom */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => onDelete(job.job_id || job._id)}
                  className="w-full py-2 flex items-center justify-center gap-1.5 bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 size={14} />
                  <span>Delete Job</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JobsCard;
