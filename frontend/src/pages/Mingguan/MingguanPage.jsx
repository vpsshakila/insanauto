// pages/MingguanPage.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  BarChart3,
  Calendar,
  Plus,
  X,
  CheckSquare,
  Square,
  Search,
  ArrowUpDown,
  Filter,
  Clock,
} from "lucide-react";
import { apiService } from "../../services/api";
import MingguanCard from "../../components/Mingguan/MingguanCard";
import ScheduleModal from "../../components/Mingguan/ScheduleModal";
import JobsCard from "../../components/Mingguan/JobsCard";
import StatisticsCard from "../../components/Mingguan/StatisticsCard";
import FormDialog from "../../components/Mingguan/FormDialog";
import AlertDialog from "../../components/Alert/AlertDialog";
import { useAlert } from "../../hooks/useAlert";

const MingguanPage = () => {
  const [formDataList, setFormDataList] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [editingRow, setEditingRow] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("forms");
  const [selectionMode, setSelectionMode] = useState(false);
  const longPressTimer = useRef(null);

  // State untuk search dan sort Forms
  const [showFormSearch, setShowFormSearch] = useState(false);
  const [formSearchQuery, setFormSearchQuery] = useState("");
  const [formSortField, setFormSortField] = useState("hari");
  const [formSortDirection, setFormSortDirection] = useState("asc");

  // State untuk search dan sort Jobs
  const [showJobSearch, setShowJobSearch] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobSortField, setJobSortField] = useState("scheduledTime");
  const [jobSortDirection, setJobSortDirection] = useState("desc");

  // Urutan hari untuk sorting
  const hariOrder = {
    Senin: 1,
    Selasa: 2,
    Rabu: 3,
    Kamis: 4,
    Jumat: 5,
    Sabtu: 6,
    Minggu: 7,
  };

  const {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showConfirm,
    showDeleteConfirm,
  } = useAlert();

  useEffect(() => {
    loadFormTemplates();
    loadScheduledJobs();
  }, []);

  // Filter dan sort Forms
  useEffect(() => {
    let filtered = formDataList;

    // Apply search filter untuk Forms
    if (formSearchQuery.trim()) {
      const query = formSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.tid?.toLowerCase().includes(query) ||
          item.namaLokasi?.toLowerCase().includes(query) ||
          item.hari?.toLowerCase().includes(query) ||
          item.nama?.toLowerCase().includes(query)
      );
    }

    // Apply sorting untuk Forms
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;

      if (formSortField === "hari") {
        // Sort berdasarkan urutan hari
        aValue = hariOrder[a.hari] || 99;
        bValue = hariOrder[b.hari] || 99;
      } else if (formSortField === "tid") {
        // Sort berdasarkan TID (numerical jika hanya angka)
        aValue = a.tid || "";
        bValue = b.tid || "";

        // Coba konversi ke number jika hanya angka
        const aNum = parseInt(aValue);
        const bNum = parseInt(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aValue = aNum;
          bValue = bNum;
        }
      }

      if (formSortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });

    setFilteredForms(filtered);
  }, [formDataList, formSearchQuery, formSortField, formSortDirection]);

  // Filter dan sort Jobs
  useEffect(() => {
    let filtered = scheduledJobs;

    // Apply search filter untuk Jobs
    if (jobSearchQuery.trim()) {
      const query = jobSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.tid?.toLowerCase().includes(query) ||
          job.status?.toLowerCase().includes(query)
      );
    }

    // Apply sorting untuk Jobs
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;

      if (jobSortField === "scheduledTime") {
        // Sort berdasarkan waktu terjadwal
        aValue = new Date(a.scheduled_time || a.scheduledTime || 0).getTime();
        bValue = new Date(b.scheduled_time || b.scheduledTime || 0).getTime();
      } else if (jobSortField === "tid") {
        // Sort berdasarkan TID
        aValue = a.tid || "";
        bValue = b.tid || "";

        const aNum = parseInt(aValue);
        const bNum = parseInt(bValue);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          aValue = aNum;
          bValue = bNum;
        }
      } else if (jobSortField === "status") {
        // Sort berdasarkan status
        aValue = a.status || "";
        bValue = b.status || "";
      }

      if (jobSortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });

    setFilteredJobs(filtered);
  }, [scheduledJobs, jobSearchQuery, jobSortField, jobSortDirection]);

  const loadFormTemplates = async () => {
    try {
      const response = await apiService.getTemplates();
      if (response.success) {
        const templates = response.templates.map((t) => ({
          id: t._id,
          tid: t.tid,
          kondisiCamera: t.kondisi_camera,
          kondisiNVR: t.kondisi_nvr,
          nama: t.nama,
          perusahaan: t.perusahaan,
          noPegawai: t.no_pegawai,
          namaLokasi: t.nama_lokasi || "",
          hari: t.hari || "",
          isFromDB: true,
        }));
        setFormDataList(templates);
      }
    } catch (error) {
      showError("Gagal memuat template: " + error.message);
    }
  };

  const loadScheduledJobs = async () => {
    try {
      const response = await apiService.getJobs();
      if (response.success) {
        setScheduledJobs(response.jobs);
      }
    } catch (error) {
      showError("Gagal memuat jobs: " + error.message);
    }
  };

  const handleFormSubmit = async (formData) => {
    setDialogLoading(true);
    try {
      if (dialogMode === "add") {
        const response = await apiService.addTemplate(formData);
        if (response.success) {
          const savedForm = {
            id: response.template._id,
            ...formData,
            isFromDB: true,
          };
          setFormDataList([...formDataList, savedForm]);
          setShowFormDialog(false);
          showSuccess("Data form berhasil disimpan!");
        }
      } else {
        const { id, ...dataToUpdate } = formData;
        const response = await apiService.updateTemplate(id, dataToUpdate);

        if (response.success) {
          setFormDataList(
            formDataList.map((row) =>
              row.id === id ? { ...row, ...dataToUpdate } : row
            )
          );
          setShowFormDialog(false);
          setEditingRow(null);
          showSuccess("Data form berhasil diperbarui!");
        }
      }
    } catch (error) {
      showError(
        `Gagal ${dialogMode === "add" ? "menyimpan" : "memperbarui"} data: ${
          error.message
        }`
      );
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteRow = async (id) => {
    try {
      await apiService.deleteTemplate(id);
      setFormDataList(formDataList.filter((r) => r.id !== id));
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
      showSuccess("Template berhasil dihapus!");
    } catch (error) {
      showError("Gagal menghapus template: " + error.message);
    }
  };

  const handleCardClick = (id, e) => {
    if (
      e.target.closest("button") ||
      e.target.closest("svg") ||
      e.target.closest("path")
    ) {
      return;
    }

    if (selectionMode) {
      if (selectedRows.includes(id)) {
        setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
      } else {
        setSelectedRows([...selectedRows, id]);
      }
    } else {
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (!isTouchDevice) {
        setSelectionMode(true);
        setSelectedRows([id]);
      }
    }
  };

  const handleCardPressStart = () => {
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (isTouchDevice && !selectionMode) {
      longPressTimer.current = setTimeout(() => {
        setSelectionMode(true);
      }, 500);
    }
  };

  const handleCardPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.length === filteredForms.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredForms.map((row) => row.id));
    }
  };

  const handleSchedule = async (scheduledTime) => {
    if (selectedRows.length === 0) {
      showAlert({
        type: "warning",
        title: "Peringatan",
        message: "Pilih minimal 1 form!",
      });
      return;
    }

    setLoading(true);

    try {
      const selectedForms = filteredForms.filter((row) =>
        selectedRows.includes(row.id)
      );

      const cleanedForms = selectedForms.map((row) => {
        const { id, isFromDB, ...rest } = row;
        delete rest.namaLokasi;
        delete rest.hari;
        return { id, isFromDB, ...rest };
      });

      const response = await apiService.scheduleBatch(
        cleanedForms,
        scheduledTime
      );

      showSuccess(response.message);

      await loadScheduledJobs();
      setSelectedRows([]);
      setSelectionMode(false);
      setShowScheduleModal(false);
      setActiveTab("jobs");
    } catch (error) {
      showError("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    showConfirm({
      title: "Konfirmasi Pembatalan",
      message: "Apakah Anda yakin ingin membatalkan job ini?",
      confirmText: "Ya, Batalkan",
      onConfirm: async () => {
        try {
          await apiService.cancelJob(jobId);
          await loadScheduledJobs();
          showSuccess("Job berhasil dibatalkan");
        } catch (error) {
          showError("Gagal membatalkan job: " + error.message);
        }
      },
    });
  };

  const handleDeleteJob = async (jobId) => {
    showDeleteConfirm({
      message: "Apakah Anda yakin ingin menghapus job ini?",
      onConfirm: async () => {
        try {
          await apiService.deleteJob(jobId);
          await loadScheduledJobs();
          showSuccess("Job berhasil dihapus");
        } catch (error) {
          showError("Gagal menghapus job: " + error.message);
        }
      },
    });
  };

  const openAddDialog = () => {
    setDialogMode("add");
    setEditingRow(null);
    setShowFormDialog(true);
  };

  const openEditDialog = (row) => {
    setDialogMode("edit");
    setEditingRow(row);
    setShowFormDialog(true);
  };

  const cancelSelection = () => {
    setSelectedRows([]);
    setSelectionMode(false);
  };

  // Handler untuk toggle sort Forms
  const handleFormSort = (field) => {
    if (formSortField === field) {
      setFormSortDirection(formSortDirection === "asc" ? "desc" : "asc");
    } else {
      setFormSortField(field);
      setFormSortDirection("asc");
    }
  };

  // Handler untuk toggle sort Jobs
  const handleJobSort = (field) => {
    if (jobSortField === field) {
      setJobSortDirection(jobSortDirection === "asc" ? "desc" : "asc");
    } else {
      setJobSortField(field);
      setJobSortDirection("desc"); // Default descending untuk waktu
    }
  };

  // Toggle search untuk Forms
  const toggleFormSearch = () => {
    setShowFormSearch(!showFormSearch);
    if (showFormSearch) {
      setFormSearchQuery("");
    }
  };

  // Toggle search untuk Jobs
  const toggleJobSearch = () => {
    setShowJobSearch(!showJobSearch);
    if (showJobSearch) {
      setJobSearchQuery("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F0C7A0] flex flex-col items-center">
      <div className="w-full max-w-md flex-1">
        {/* Header */}
        <div className="bg-[#43172F] text-white px-4 pt-2 pb-3 sticky top-0 z-20">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold py-2">Mingguan</h1>

            {/* Action Buttons di Pojok Kanan Atas */}
            <div className="flex items-center gap-2">
              {activeTab === "statistics" && !selectionMode && (
                <>
                  {/* Refresh Button */}
                  <button
                    onClick={loadScheduledJobs}
                    className="p-2 bg-[#F0C7A0] text-[#43172F] rounded-lg flex items-center justify-center hover:bg-[#F0C7A0]/90 transition-colors"
                    aria-label="Refresh Statistics"
                  >
                    <RefreshCw size={18} />
                  </button>
                </>
              )}
              {activeTab === "forms" && !selectionMode && (
                <>
                  {/* Search Button untuk Forms */}
                  <button
                    onClick={toggleFormSearch}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      showFormSearch
                        ? "bg-white text-[#43172F]"
                        : "bg-[#F0C7A0] text-[#43172F] hover:bg-[#F0C7A0]/90"
                    } transition-colors`}
                    aria-label="Search Forms"
                  >
                    <Search size={18} />
                  </button>

                  {/* Sort Button untuk Forms */}
                  <button
                    onClick={() => handleFormSort(formSortField)}
                    className="p-2 bg-[#F0C7A0] text-[#43172F] rounded-lg flex items-center justify-center hover:bg-[#F0C7A0]/90 transition-colors"
                    aria-label="Sort Forms"
                  >
                    <ArrowUpDown size={18} />
                  </button>

                  {/* Add Button */}
                  <button
                    onClick={openAddDialog}
                    className="p-2 bg-[#F0C7A0] text-[#43172F] rounded-lg flex items-center justify-center hover:bg-[#F0C7A0]/90 active:scale-95 transition-all"
                    aria-label="Tambah Form"
                  >
                    <Plus size={18} />
                  </button>
                </>
              )}
              {activeTab === "jobs" && !selectionMode && (
                <>
                  {/* Search Button untuk Jobs */}
                  <button
                    onClick={toggleJobSearch}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      showJobSearch
                        ? "bg-white text-[#43172F]"
                        : "bg-[#F0C7A0] text-[#43172F] hover:bg-[#F0C7A0]/90"
                    } transition-colors`}
                    aria-label="Search Jobs"
                  >
                    <Search size={18} />
                  </button>

                  {/* Sort Button untuk Jobs */}
                  <button
                    onClick={() => handleJobSort(jobSortField)}
                    className="p-2 bg-[#F0C7A0] text-[#43172F] rounded-lg flex items-center justify-center hover:bg-[#F0C7A0]/90 transition-colors"
                    aria-label="Sort Jobs"
                  >
                    <ArrowUpDown size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search Bar untuk Forms (hanya muncul saat diklik) */}
          {activeTab === "forms" && showFormSearch && !selectionMode && (
            <div className="mb-3 animate-fadeIn">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Cari TID, Lokasi, atau Hari..."
                  value={formSearchQuery}
                  onChange={(e) => setFormSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-800 rounded-lg border-none focus:ring-2 focus:ring-[#F0C7A0] focus:outline-none text-sm"
                  autoFocus
                />
                {formSearchQuery && (
                  <button
                    onClick={() => setFormSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Sort Options untuk Forms */}
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-white/80">
                  {filteredForms.length} dari {formDataList.length} template
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleFormSort("hari")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                      formSortField === "hari"
                        ? "bg-white text-[#43172F]"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <Calendar size={12} />
                    Hari
                    {formSortField === "hari" && (
                      <span className="ml-1">
                        {formSortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleFormSort("tid")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                      formSortField === "tid"
                        ? "bg-white text-[#43172F]"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <Filter size={12} />
                    TID
                    {formSortField === "tid" && (
                      <span className="ml-1">
                        {formSortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search Bar untuk Jobs (hanya muncul saat diklik) */}
          {activeTab === "jobs" && showJobSearch && !selectionMode && (
            <div className="mb-3 animate-fadeIn">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Cari TID atau Status..."
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-800 rounded-lg border-none focus:ring-2 focus:ring-[#F0C7A0] focus:outline-none text-sm"
                  autoFocus
                />
                {jobSearchQuery && (
                  <button
                    onClick={() => setJobSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Sort Options untuk Jobs */}
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-white/80">
                  {filteredJobs.length} dari {scheduledJobs.length} jobs
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleJobSort("scheduledTime")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                      jobSortField === "scheduledTime"
                        ? "bg-white text-[#43172F]"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <Clock size={12} />
                    Waktu
                    {jobSortField === "scheduledTime" && (
                      <span className="ml-1">
                        {jobSortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleJobSort("tid")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                      jobSortField === "tid"
                        ? "bg-white text-[#43172F]"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <Filter size={12} />
                    TID
                    {jobSortField === "tid" && (
                      <span className="ml-1">
                        {jobSortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleJobSort("status")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                      jobSortField === "status"
                        ? "bg-white text-[#43172F]"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <ArrowUpDown size={12} />
                    Status
                    {jobSortField === "status" && (
                      <span className="ml-1">
                        {jobSortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Controller */}
          <div className="relative bg-[#5A1F40] rounded-lg p-0.5">
            <div className="flex h-10">
              <button
                onClick={() => {
                  setActiveTab("forms");
                  if (selectionMode) cancelSelection();
                  if (showFormSearch) setShowFormSearch(false);
                }}
                className={`flex-1 rounded-md text-center transition-all duration-300 ease-in-out relative ${
                  activeTab === "forms" ? "text-[#43172F]" : "text-white"
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-md transition-all duration-300 ease-in-out ${
                    activeTab === "forms"
                      ? "bg-white shadow scale-100 opacity-100"
                      : "scale-95 opacity-0"
                  }`}
                />
                <div className="relative flex items-center justify-center gap-1.5 h-full">
                  <span className="text-sm font-medium">Forms</span>
                  <span className="bg-[#43172F] text-white px-1.5 py-0.5 rounded-full text-xs">
                    {formDataList.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab("jobs");
                  if (selectionMode) cancelSelection();
                  if (showJobSearch) setShowJobSearch(false);
                }}
                className={`flex-1 rounded-md text-center transition-all duration-300 ease-in-out relative ${
                  activeTab === "jobs" ? "text-[#43172F]" : "text-white"
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-md transition-all duration-300 ease-in-out ${
                    activeTab === "jobs"
                      ? "bg-white shadow scale-100 opacity-100"
                      : "scale-95 opacity-0"
                  }`}
                />
                <div className="relative flex items-center justify-center gap-1.5 h-full">
                  <span className="text-sm font-medium">Jobs</span>
                  <span className="bg-[#43172F] text-white px-1.5 py-0.5 rounded-full text-xs">
                    {scheduledJobs.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab("statistics");
                  if (selectionMode) cancelSelection();
                  if (showJobSearch) setShowJobSearch(false);
                  if (showFormSearch) setShowFormSearch(false);
                }}
                className={`flex-1 rounded-md text-center transition-all duration-300 ease-in-out relative ${
                  activeTab === "statistics" ? "text-[#43172F]" : "text-white"
                }`}
              >
                <div
                  className={`absolute inset-0 rounded-md transition-all duration-300 ease-in-out ${
                    activeTab === "statistics"
                      ? "bg-white shadow scale-100 opacity-100"
                      : "scale-95 opacity-0"
                  }`}
                />
                <div className="relative flex items-center justify-center gap-1.5 h-full">
                  <BarChart3 size={16} className="text-current" />
                  <span className="text-sm font-medium ml-1">Stats</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Selection Header Bar */}
        {selectionMode && (
          <div className="bg-white border-b border-gray-200 p-3 sticky top-[88px] z-10 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-2"
                >
                  {selectedRows.length === filteredForms.length &&
                  filteredForms.length > 0 ? (
                    <CheckSquare size={20} className="text-[#43172F]" />
                  ) : (
                    <Square size={20} className="text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    Pilih Semua
                  </span>
                </button>
                <span className="text-sm text-gray-500">
                  {selectedRows.length} terpilih
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-4 py-1.5 bg-[#2D5016] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2D5016]/90 transition-colors"
                  disabled={selectedRows.length === 0}
                >
                  Jadwalkan
                </button>
                <button
                  onClick={cancelSelection}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Cancel selection"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className=" pb-6">
          {activeTab === "statistics" && (
            <div className="">
              <StatisticsCard
                jobs={scheduledJobs}
                formTemplates={formDataList}
              />
            </div>
          )}
          {/* Forms Tab Content */}
          {activeTab === "forms" && (
            <div className=" p-4 mb-6">
              {/* Forms List */}
              {filteredForms.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center shadow">
                  <div className="text-5xl mb-4">
                    {formSearchQuery ? "🔍" : "📋"}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {formSearchQuery
                      ? "Tidak ditemukan"
                      : "Belum ada data form"}
                  </h3>
                  <p className="text-gray-500">
                    {formSearchQuery
                      ? "Coba dengan kata kunci lain"
                      : "Tekan tombol Tambah di atas untuk menambah"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredForms.map((row) => (
                    <MingguanCard
                      key={row.id}
                      data={row}
                      isSelected={selectedRows.includes(row.id)}
                      selectionMode={selectionMode}
                      onEdit={() => openEditDialog(row)}
                      onDelete={() => handleDeleteRow(row.id)}
                      onPressStart={handleCardPressStart}
                      onPressEnd={handleCardPressEnd}
                      onClick={(e) => handleCardClick(row.id, e)}
                      showDeleteConfirm={showDeleteConfirm}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Jobs Tab Content */}
          {activeTab === "jobs" && (
            <div className="p-4 pb-14">
              {filteredJobs.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center shadow">
                  <div className="text-5xl mb-4">
                    {jobSearchQuery ? "🔍" : "⏰"}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {jobSearchQuery ? "Tidak ditemukan" : "Belum ada job"}
                  </h3>
                  <p className="text-gray-500">
                    {jobSearchQuery
                      ? "Coba dengan kata kunci lain"
                      : "Jadwalkan form untuk membuat job"}
                  </p>
                </div>
              ) : (
                <JobsCard
                  jobs={filteredJobs}
                  onCancel={handleCancelJob}
                  onDelete={handleDeleteJob}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleSchedule}
          loading={loading}
          selectedCount={selectedRows.length}
        />
      )}

      {/* Form Dialog */}
      {showFormDialog && (
        <FormDialog
          mode={dialogMode}
          onClose={() => {
            setShowFormDialog(false);
            setEditingRow(null);
          }}
          onSubmit={handleFormSubmit}
          initialData={editingRow}
          loading={dialogLoading}
          showAlert={showAlert}
        />
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertState.isOpen}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancel={alertState.showCancel}
      />
    </div>
  );
};

export default MingguanPage;
