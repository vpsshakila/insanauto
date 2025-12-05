// components/Mingguan/StatisticsCard.jsx
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Download,
  BarChart3,
  MoreVertical,
  Smartphone,
  Award,
  AlertTriangle,
  MapPin,
  User,
  Building2,
  Calendar,
} from "lucide-react";

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{data.monthLabel}</p>
        <div className="mt-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Score:</span>
            <span className="text-sm font-semibold text-[#43172F]">
              {data.score}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">On Target:</span>
            <span className="text-sm font-semibold text-green-600">
              {data.perfect} TID
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Baik:</span>
            <span className="text-sm font-semibold text-yellow-600">
              {data.good} TID
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Perlu Perhatian:</span>
            <span className="text-sm font-semibold text-red-600">
              {data.needsAttention} TID
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-1 mt-1">
            <span className="text-sm text-gray-600">Total TID:</span>
            <span className="text-sm font-semibold text-gray-800">
              {data.total} TID
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Bar Component
const CustomBar = (props) => {
  const { x, y, width, height, payload } = props;
  const score = payload?.score || 0;
  let fillColor = "#E5E7EB";

  if (score >= 80) fillColor = "#10B981";
  else if (score >= 60) fillColor = "#FBBF24";
  else fillColor = "#EF4444";

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fillColor}
        rx={6}
        ry={6}
        className="transition-all duration-300 hover:opacity-80"
      />
    </g>
  );
};

const StatisticsCard = ({ jobs, formTemplates }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMonth, setSelectedMonth] = useState(null);

  // State untuk TID tab
  const [selectedTIDMonth, setSelectedTIDMonth] = useState(() => {
    // Default bulan saat ini (format: YYYY-MM)
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  const [expandedTIDs, setExpandedTIDs] = useState({});

  // Helper function to get month name
  const getMonthName = (date) => {
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  };

  // Get all TIDs from formTemplates (master data)
  const getAllTIDs = () => {
    return formTemplates.map((template) => ({
      tid: template.tid,
      namaLokasi: template.namaLokasi || "Tidak diketahui",
      nama: template.nama || "Tidak diketahui",
      perusahaan: template.perusahaan || "Tidak diketahui",
      noPegawai: template.noPegawai || "Tidak diketahui",
      hari: template.hari || "Tidak diketahui",
      kondisiCamera: template.kondisiCamera || "Tidak diketahui",
      kondisiNVR: template.kondisiNVR || "Tidak diketahui",
      lastUpdated: template.updatedAt || template.createdAt,
    }));
  };

  // Calculate monthly statistics dengan data dari formTemplates dan jobs
  const calculateMonthlyStats = () => {
    const completedJobs = jobs.filter((job) => job.status === "completed");
    const allTIDs = getAllTIDs();

    // Group by month
    const monthlyGroups = {};

    // Initialize dengan semua TID dari formTemplates - 6 bulan terakhir
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthLabel = getMonthName(date);

      monthlyGroups[monthKey] = {
        key: monthKey,
        label: monthLabel,
        date: date,
        totalTIDs: allTIDs.length,
        tidStats: {},
        tidDetails: {},
        tidCompletedDates: {}, // Simpan tanggal completed per TID
        perfectTIDs: 0,
        goodTIDs: 0,
        needsAttentionTIDs: allTIDs.length,
        totalJobs: 0,
      };

      // Initialize semua TID dengan 0 completed
      allTIDs.forEach((tid) => {
        monthlyGroups[monthKey].tidStats[tid.tid] = 0;
        monthlyGroups[monthKey].tidDetails[tid.tid] = {
          namaLokasi: tid.namaLokasi,
          nama: tid.nama,
          perusahaan: tid.perusahaan,
        };
        monthlyGroups[monthKey].tidCompletedDates[tid.tid] = [];
      });
    }

    // Fill dengan completed jobs dan simpan tanggalnya
    completedJobs.forEach((job) => {
      const date = new Date(
        job.updatedAt || job.completedAt || job.scheduled_time
      );
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (monthlyGroups[monthKey]) {
        monthlyGroups[monthKey].tidStats[job.tid] =
          (monthlyGroups[monthKey].tidStats[job.tid] || 0) + 1;
        monthlyGroups[monthKey].totalJobs++;

        // Simpan tanggal completed
        if (!monthlyGroups[monthKey].tidCompletedDates[job.tid]) {
          monthlyGroups[monthKey].tidCompletedDates[job.tid] = [];
        }
        monthlyGroups[monthKey].tidCompletedDates[job.tid].push(date);
      }
    });

    // Calculate TID categories for each month
    Object.values(monthlyGroups).forEach((month) => {
      month.perfectTIDs = 0;
      month.goodTIDs = 0;
      month.needsAttentionTIDs = 0;

      Object.entries(month.tidStats).forEach(([count]) => {
        if (count >= 4) {
          month.perfectTIDs++;
        } else if (count >= 2) {
          month.goodTIDs++;
        } else {
          month.needsAttentionTIDs++;
        }
      });

      // Calculate score (percentage of perfect TIDs)
      month.score =
        month.totalTIDs > 0
          ? Math.round((month.perfectTIDs / month.totalTIDs) * 100)
          : 0;
      month.scoreDisplay = `${month.score}%`;
    });

    // Convert to array and sort by date (newest first)
    const monthlyArray = Object.values(monthlyGroups).sort(
      (a, b) => b.date - a.date
    );

    return monthlyArray;
  };

  // Calculate overall stats with formTemplates data
  const calculateOverallStats = () => {
    const completedJobs = jobs.filter((j) => j.status === "completed");
    const pendingJobs = jobs.filter((j) => j.status === "pending");
    const failedJobs = jobs.filter((j) => j.status === "failed");
    const cancelledJobs = jobs.filter((j) => j.status === "cancelled");
    const allTIDs = getAllTIDs();

    // Get current month
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    // Get current month completed jobs per TID
    const currentMonthJobs = completedJobs.filter((j) => {
      const jobDate = new Date(
        j.updatedAt || j.completedAt || j.scheduled_time
      );
      const jobMonthKey = `${jobDate.getFullYear()}-${String(
        jobDate.getMonth() + 1
      ).padStart(2, "0")}`;
      return jobMonthKey === currentMonthKey;
    });

    // Calculate TID health termasuk yang belum ada job sama sekali
    const tidHealth = allTIDs.map((template) => {
      const tidJobs = completedJobs.filter((j) => j.tid === template.tid);
      const currentMonthCount = currentMonthJobs.filter(
        (j) => j.tid === template.tid
      ).length;

      // Get completion dates untuk current month
      const currentMonthDates = currentMonthJobs
        .filter((j) => j.tid === template.tid)
        .map((j) => new Date(j.updatedAt || j.completedAt || j.scheduled_time))
        .sort((a, b) => b - a); // Urutkan terbaru dulu

      let status = "needs-attention";
      let statusLabel = "Perlu Perhatian";
      let icon = <AlertTriangle size={14} className="text-red-500" />;

      if (currentMonthCount >= 4) {
        status = "perfect";
        statusLabel = "On Target";
        icon = <Award size={14} className="text-green-500" />;
      } else if (currentMonthCount >= 2) {
        status = "good";
        statusLabel = "Baik";
        icon = <CheckCircle size={14} className="text-yellow-500" />;
      }

      const lastJob = tidJobs.sort(
        (a, b) =>
          new Date(b.updatedAt || b.completedAt || b.scheduled_time) -
          new Date(a.updatedAt || a.completedAt || a.scheduled_time)
      )[0];

      return {
        tid: template.tid,
        namaLokasi: template.namaLokasi,
        nama: template.nama,
        perusahaan: template.perusahaan,
        status,
        statusLabel,
        icon,
        completedCount: currentMonthCount,
        totalCompleted: tidJobs.length,
        lastCompleted: lastJob
          ? new Date(
              lastJob.updatedAt || lastJob.completedAt || lastJob.scheduled_time
            )
          : null,
        currentMonthDates, // Simpan tanggal-tanggal completed bulan ini
        jobs: tidJobs,
        noPegawai: template.noPegawai,
        hari: template.hari,
      };
    });

    const perfectTIDs = tidHealth.filter((t) => t.status === "perfect").length;
    const goodTIDs = tidHealth.filter((t) => t.status === "good").length;
    const needsAttentionTIDs = tidHealth.filter(
      (t) => t.status === "needs-attention"
    ).length;
    const totalTIDs = allTIDs.length;

    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      pendingJobs: pendingJobs.length,
      failedJobs: failedJobs.length,
      cancelledJobs: cancelledJobs.length,
      totalTIDs: totalTIDs,
      perfectTIDs,
      goodTIDs,
      needsAttentionTIDs,
      overallScore:
        totalTIDs > 0 ? Math.round((perfectTIDs / totalTIDs) * 100) : 0,
      tidHealth: tidHealth.sort((a, b) => b.completedCount - a.completedCount),
    };
  };

  // Get TIDs needing attention
  const getTIDsNeedingAttention = () => {
    const { tidHealth } = overallStats;
    return tidHealth
      .filter((tid) => tid.status === "needs-attention")
      .sort((a, b) => (a.lastCompleted || 0) - (b.lastCompleted || 0));
  };

  // Calculate chart data
  const getChartData = () => {
    const monthlyStats = calculateMonthlyStats();
    return monthlyStats.map((month) => ({
      name: month.label.split(" ")[0].substring(0, 3), // Hanya ambil 3 karakter pertama
      monthLabel: month.label, // Tetap simpan label lengkap untuk tooltip
      score: month.score,
      perfect: month.perfectTIDs,
      good: month.goodTIDs,
      needsAttention: month.needsAttentionTIDs,
      total: month.totalTIDs,
      fullData: month,
    }));
  };

  // Get available months for TID filter (6 bulan terakhir + all)
  const getAvailableMonths = () => {
    const months = calculateMonthlyStats();
    return [
      { value: "all", label: "Semua Bulan" },
      ...months.map((month) => ({
        value: month.key,
        label: month.label,
      })),
    ];
  };

  // Filter TIDs by selected month
  const getFilteredTIDs = () => {
    if (selectedTIDMonth === "all") {
      return overallStats.tidHealth;
    }

    const monthlyStats = calculateMonthlyStats();
    const selectedMonthData = monthlyStats.find(
      (m) => m.key === selectedTIDMonth
    );

    if (!selectedMonthData) return overallStats.tidHealth;

    // Return TIDs with their count and dates for the selected month
    return overallStats.tidHealth.map((tid) => {
      const count = selectedMonthData.tidStats[tid.tid] || 0;
      const completedDates = selectedMonthData.tidCompletedDates[tid.tid] || [];
      const status =
        count >= 4 ? "perfect" : count >= 2 ? "good" : "needs-attention";
      const statusLabel =
        count >= 4 ? "On Target" : count >= 2 ? "Baik" : "Perlu Perhatian";
      const icon =
        count >= 4 ? (
          <Award size={14} className="text-green-500" />
        ) : count >= 2 ? (
          <CheckCircle size={14} className="text-yellow-500" />
        ) : (
          <AlertTriangle size={14} className="text-red-500" />
        );

      return {
        ...tid,
        status,
        statusLabel,
        icon,
        completedCount: count,
        totalCompleted: count,
        currentMonthDates: completedDates, // Use the dates from selected month
      };
    });
  };

  // Toggle expanded state untuk TID card
  const toggleTIDExpanded = (tid) => {
    setExpandedTIDs((prev) => ({
      ...prev,
      [tid]: !prev[tid],
    }));
  };

  const monthlyStats = calculateMonthlyStats();
  const overallStats = calculateOverallStats();
  const chartData = getChartData();
  const attentionTIDs = getTIDsNeedingAttention();
  const availableMonths = getAvailableMonths();
  const filteredTIDs = getFilteredTIDs();

  // Handle month selection
  const handleMonthSelect = (month) => {
    setSelectedMonth(month === selectedMonth ? null : month);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "Belum ada";
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hari ini";
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format date untuk display di expanded content
  const formatDateDetailed = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export data
  const exportData = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      totalTIDs: overallStats.totalTIDs,
      overallScore: overallStats.overallScore,
      perfectTIDs: overallStats.perfectTIDs,
      goodTIDs: overallStats.goodTIDs,
      needsAttentionTIDs: overallStats.needsAttentionTIDs,
      monthlyStats: monthlyStats,
      attentionTIDs: attentionTIDs.map((t) => ({
        tid: t.tid,
        namaLokasi: t.namaLokasi,
        completedCount: t.completedCount,
        lastCompleted: t.lastCompleted,
        nama: t.nama,
        perusahaan: t.perusahaan,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statistics-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="pb-20">
      {/* Mobile Tabs Navigation */}
      <div className="sticky top-[88px] z-20 bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-1.5 text-center transition-colors ${
              activeTab === "overview"
                ? "text-[#43172F] border-b-2 border-[#43172F] font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex flex-col items-center">
              <BarChart3 size={18} />
              <span className="text-xs mt-1">Overview</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("tid-detail")}
            className={`flex-1 py-1.5 text-center transition-colors ${
              activeTab === "tid-detail"
                ? "text-[#43172F] border-b-2 border-[#43172F] font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex flex-col items-center">
              <Smartphone size={18} />
              <span className="text-xs mt-1">All TIDs</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex-1 py-1.5 text-center transition-colors ${
              activeTab === "alerts"
                ? "text-[#43172F] border-b-2 border-[#43172F] font-semibold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex flex-col items-center relative">
              <AlertCircle size={18} />
              <span className="text-xs mt-1">Alerts</span>
              {attentionTIDs.length > 0 && (
                <span className="absolute -top-1 right-9 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {attentionTIDs.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="p-4 space-y-4">
          {/* Quick Stats Cards - Compact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 font-medium">
                    On Target
                  </p>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    {overallStats.perfectTIDs}
                    <span className="text-xs font-normal text-gray-600 ml-1">
                      / {overallStats.totalTIDs}
                    </span>
                  </p>
                </div>
                <Award size={20} className="text-green-600" />
              </div>
              <div className="mt-2">
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: `${overallStats.overallScore}%` }}
                  />
                </div>
                <p className="text-xs text-green-700 mt-1">
                  {overallStats.overallScore}% TID mencapai target
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 font-medium">Total TID</p>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    {overallStats.totalTIDs}
                  </p>
                </div>
                <Smartphone size={20} className="text-blue-600" />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                {formTemplates.length} template terdaftar
              </p>
            </div>
          </div>

          {/* Monthly Performance Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">
                  Monthly Performance
                </h3>
                <p className="text-sm text-gray-500">6 bulan terakhir</p>
              </div>
              <Filter size={18} className="text-gray-400" />
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  barSize={28}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6B7280" }}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="score"
                    shape={CustomBar}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span className="text-gray-600">≥80%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                <span className="text-gray-600">60-79%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span className="text-gray-600">{"<"}60%</span>
              </div>
            </div>
          </div>

          {/* Recent Months Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Detail Bulanan</h3>
              <p className="text-sm text-gray-500">
                Berdasarkan {overallStats.totalTIDs} TID terdaftar
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {monthlyStats.slice(0, 3).map((month) => (
                <div
                  key={month.key}
                  className={`p-4 ${
                    selectedMonth === month.key ? "bg-gray-50" : ""
                  }`}
                  onClick={() => handleMonthSelect(month.key)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {month.label}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {month.totalJobs} jobs completed
                      </p>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          month.score >= 80
                            ? "text-green-600"
                            : month.score >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {month.score}%
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-gray-600">On Target</span>
                        <span className="text-xs font-semibold text-gray-800 ml-auto">
                          {month.perfectTIDs}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <span className="text-xs text-gray-600">Baik</span>
                        <span className="text-xs font-semibold text-gray-800 ml-auto">
                          {month.goodTIDs}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs text-gray-600">
                          Perlu Perhatian
                        </span>
                        <span className="text-xs font-semibold text-gray-800 ml-auto">
                          {month.needsAttentionTIDs}
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      size={20}
                      className={`text-gray-400 transition-transform ${
                        selectedMonth === month.key ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Expanded Content */}
                  {selectedMonth === month.key && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Semua TID ({Object.keys(month.tidStats).length}):
                        </p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {Object.entries(month.tidStats)
                            .sort(([, a], [, b]) => b - a)
                            .map(([tid, count]) => {
                              const detail = month.tidDetails[tid];
                              return (
                                <div
                                  key={tid}
                                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-800">
                                        TID {tid}
                                      </span>
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                          count >= 4
                                            ? "bg-green-100 text-green-800"
                                            : count >= 2
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {count >= 4
                                          ? "On Target"
                                          : count >= 2
                                          ? "Baik"
                                          : "Perhatian"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      <MapPin
                                        size={12}
                                        className="text-gray-400"
                                      />
                                      <span className="text-xs text-gray-500 truncate">
                                        {detail?.namaLokasi ||
                                          "Tidak diketahui"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm font-bold text-gray-800">
                                      {count}x
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All TIDs Tab */}
      {activeTab === "tid-detail" && (
        <div className="p-4 space-y-4">
          {/* Filter Bar dengan Month Selector */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <select
                value={selectedTIDMonth}
                onChange={(e) => setSelectedTIDMonth(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm border-none focus:ring-2 focus:ring-[#43172F] focus:outline-none appearance-none"
              >
                {availableMonths.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={exportData}
              className="px-3 py-2 bg-[#43172F] text-white rounded-lg text-sm font-medium hover:bg-[#43172F]/90 transition-colors"
              title="Export Data"
            >
              <Download size={18} />
            </button>
          </div>

          {/* Info tentang bulan yang dipilih */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {selectedTIDMonth === "all"
                    ? "Semua Bulan"
                    : availableMonths.find((m) => m.value === selectedTIDMonth)
                        ?.label}
                </p>
                <p className="text-xs text-gray-500">
                  Menampilkan {filteredTIDs.length} TID
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">Target: 4x/bulan</div>
              </div>
            </div>
          </div>

          {/* TID List - Single Column dengan height compact */}
          <div className="space-y-2">
            {filteredTIDs.slice(0, 20).map((tid) => (
              <div
                key={tid.tid}
                className={`rounded-xl border ${
                  tid.status === "perfect"
                    ? "border-green-200 bg-green-50"
                    : tid.status === "good"
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                {/* Compact Header */}
                <div
                  className="p-2.5 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleTIDExpanded(tid.tid)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {tid.icon}
                    <div className="min-w-0">
                      <div className="font-bold text-gray-800 text-sm">
                        TID {tid.tid}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-gray-400" />
                        <span className="text-xs text-gray-600 truncate">
                          {tid.namaLokasi}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-800">
                        {tid.completedCount}x
                      </div>
                      <div className="text-xs text-gray-500">/4 target</div>
                    </div>
                    {expandedTIDs[tid.tid] ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedTIDs[tid.tid] && (
                  <div className="px-2.5 pb-2.5 border-t border-gray-200">
                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">
                          Progress target
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {tid.completedCount}/4
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            tid.status === "perfect"
                              ? "bg-green-500"
                              : tid.status === "good"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              (tid.completedCount / 4) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Completion Dates */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Tanggal Completed ({tid.currentMonthDates?.length || 0}
                        ):
                      </p>
                      {tid.currentMonthDates &&
                      tid.currentMonthDates.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {tid.currentMonthDates
                            .sort((a, b) => b - a) // Urutkan terbaru dulu
                            .map((date, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-1.5 px-2 bg-white rounded border border-gray-100"
                              >
                                <div className="flex items-center gap-2">
                                  <Calendar
                                    size={12}
                                    className="text-gray-400"
                                  />
                                  <span className="text-xs text-gray-600">
                                    {formatDateDetailed(date)}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {formatDate(date)}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-3 bg-gray-50 rounded border border-gray-100">
                          <p className="text-xs text-gray-500">
                            Belum ada job completed pada bulan ini
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Petugas Info */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {tid.nama}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {tid.perusahaan}
                        </span>
                      </div>
                    </div>

                    {/* Status Info */}
                    <div className="mt-2 text-center">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          tid.status === "perfect"
                            ? "bg-green-100 text-green-800"
                            : tid.status === "good"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tid.statusLabel}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Info */}
          {filteredTIDs.length > 20 && (
            <div className="text-center py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Menampilkan 20 dari {filteredTIDs.length} TID
              </p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredTIDs.filter((t) => t.status === "perfect").length}
                </div>
                <div className="text-xs text-gray-500 mt-1">On Target</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredTIDs.filter((t) => t.status === "good").length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Baik</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {
                    filteredTIDs.filter((t) => t.status === "needs-attention")
                      .length
                  }
                </div>
                <div className="text-xs text-gray-500 mt-1">Perhatian</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="p-4 space-y-4">
          {attentionTIDs.length === 0 ? (
            <div className="text-center py-8">
              <Award size={48} className="text-green-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700">
                Semua TID On Target!
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Semua {overallStats.totalTIDs} TID telah mencapai target
                maintenance bulan ini
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} className="text-red-500" />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      TID Perlu Perhatian
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {attentionTIDs.length} dari {overallStats.totalTIDs} TID
                      belum mencapai target
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {attentionTIDs.slice(0, 10).map((tid) => (
                  <div
                    key={tid.tid}
                    className="bg-white rounded-xl border border-red-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-500" />
                        <div>
                          <span className="font-bold text-gray-800">
                            TID {tid.tid}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {tid.namaLokasi}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Perlu Perhatian
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Completed bulan ini:
                        </span>
                        <span className="text-sm font-semibold text-red-600">
                          {tid.completedCount}x
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Terakhir maintenance:
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {formatDate(tid.lastCompleted)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Target bulanan:
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          4x
                        </span>
                      </div>

                      {/* Petugas Info */}
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <User size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {tid.nama}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <Building2 size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {tid.perusahaan}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock size={14} className="text-gray-400" />
                        <span className="text-gray-600">
                          {tid.completedCount === 0
                            ? "Belum ada maintenance bulan ini"
                            : tid.completedCount === 1
                            ? "Butuh 3 maintenance lagi"
                            : "Butuh 2 maintenance lagi"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {attentionTIDs.length > 10 && (
                <div className="text-center py-3">
                  <p className="text-sm text-gray-500">
                    ...dan {attentionTIDs.length - 10} TID lainnya
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="text-xs text-gray-600">
            {activeTab === "overview" &&
              `${overallStats.totalTIDs} TID • ${overallStats.overallScore}% score`}
            {activeTab === "tid-detail" &&
              `${filteredTIDs.length} TID • ${
                selectedTIDMonth === "all"
                  ? "All"
                  : availableMonths.find((m) => m.value === selectedTIDMonth)
                      ?.label
              }`}
            {activeTab === "alerts" &&
              `${attentionTIDs.length} perlu perhatian`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportData}
              className="p-2 text-gray-600 hover:text-[#43172F] transition-colors"
              title="Export Data"
            >
              <Download size={18} />
            </button>
            <button
              className="p-2 text-gray-600 hover:text-[#43172F] transition-colors"
              title="More Options"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsCard;
