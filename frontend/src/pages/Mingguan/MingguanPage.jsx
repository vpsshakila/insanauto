// pages/MingguanPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Calendar, Plus, X, CheckSquare, Square } from "lucide-react";
import { apiService } from "../../services/api";
import MingguanCard from "../../components/Mingguan/MingguanCard";
import ScheduleModal from "../../components/Mingguan/ScheduleModal";
import JobsCard from "../../components/Mingguan/JobsCard";
import FormDialog from "../../components/Mingguan/FormDialog";
import AlertDialog from "../../components/Alert/AlertDialog"; // Import AlertDialog
import { useAlert } from "../../hooks/useAlert"; // Import custom hook

const MingguanPage = () => {
  const [formDataList, setFormDataList] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [editingRow, setEditingRow] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("forms");
  const [selectionMode, setSelectionMode] = useState(false);
  const longPressTimer = useRef(null);

  // Gunakan custom hook untuk alert
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

  // Handle card click for selection
  const handleCardClick = (id, e) => {
    // Check if clicking on card body (not buttons)
    if (
      e.target.closest("button") ||
      e.target.closest("svg") ||
      e.target.closest("path")
    ) {
      return;
    }

    if (selectionMode) {
      // Toggle selection
      if (selectedRows.includes(id)) {
        setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
      } else {
        setSelectedRows([...selectedRows, id]);
      }
    } else {
      // Enter selection mode on desktop
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      if (!isTouchDevice) {
        setSelectionMode(true);
        setSelectedRows([id]);
      }
    }
  };

  // Handle long press for mobile
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
    if (selectedRows.length === formDataList.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(formDataList.map((row) => row.id));
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
      const selectedForms = formDataList.filter((row) =>
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
      confirmText: "Batalkan",
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

  return (
    <div className="min-h-screen bg-[#F0C7A0] flex flex-col items-center">
      <div className="w-full max-w-md flex-1">
        {/* Header */}
        <div className="bg-[#43172F] text-white px-4 pt-2 pb-3 sticky top-0 z-20">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold py-2">Mingguan</h1>

            {/* Add Button di Pojok Kanan Atas - New Design */}
            {activeTab === "forms" && !selectionMode && (
              <button
                onClick={openAddDialog}
                className="px-2 py-2 bg-[#F0C7A0] text-[#43172F] rounded-lg flex items-center gap-2 hover:bg-[#F0C7A0]/90 active:scale-95 transition-all font-medium"
                aria-label="Tambah Form"
              >
                <Plus size={18} />
              </button>
            )}
          </div>

          {/* Tab Controller dengan Animasi */}
          <div className="relative bg-[#5A1F40] rounded-lg p-0.5">
            <div className="flex h-10">
              <button
                onClick={() => {
                  setActiveTab("forms");
                  if (selectionMode) {
                    cancelSelection();
                  }
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
                  <span className="text-sm font-medium ">Forms</span>
                  <span className="bg-[#43172F] text-white px-1.5 py-0.5 rounded-full text-xs">
                    {formDataList.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab("jobs");
                  if (selectionMode) {
                    cancelSelection();
                  }
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
                  {selectedRows.length === formDataList.length &&
                  formDataList.length > 0 ? (
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
        <div className="p-4 pb-6">
          {/* Forms Tab Content */}
          {activeTab === "forms" && (
            <div className="mb-6">
              {/* Forms List */}
              {formDataList.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center shadow">
                  <div className="text-5xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Belum ada data form
                  </h3>
                  <p className="text-gray-500">
                    Tekan tombol Tambah di atas untuk menambah
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formDataList.map((row) => (
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
                      showDeleteConfirm={showDeleteConfirm} // Tambahkan prop
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Jobs Tab Content */}
          {activeTab === "jobs" && (
            <div className="pb-14">
              {scheduledJobs.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center shadow">
                  <div className="text-5xl mb-4">⏰</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Belum ada job
                  </h3>
                  <p className="text-gray-500">
                    Jadwalkan form untuk membuat job
                  </p>
                </div>
              ) : (
                <JobsCard
                  jobs={scheduledJobs}
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
