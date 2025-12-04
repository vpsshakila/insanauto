// pages/MingguanPage.jsx
import React, { useState, useEffect } from "react";
import { Calendar, Plus, RefreshCw } from "lucide-react";
import { apiService } from "../../services/api";
import FormDataCard from "../../components/Mingguan/FormDataCard";
import ScheduleModal from "../../components/Mingguan/ScheduleModal";
import JobsCard from "../../components/Mingguan/JobsCard";
import FormDialog from "../../components/Mingguan/FormDialog"; // Import komponen tunggal

const MingguanPage = () => {
  const [formDataList, setFormDataList] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // 'add' atau 'edit'
  const [editingRow, setEditingRow] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("forms");

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
      console.error("Failed to load templates:", error);
    }
  };

  const loadScheduledJobs = async () => {
    try {
      const response = await apiService.getJobs();
      if (response.success) {
        setScheduledJobs(response.jobs);
      }
    } catch (error) {
      console.error("Failed to load jobs:", error);
    }
  };

  const handleFormSubmit = async (formData) => {
    setDialogLoading(true);
    try {
      if (dialogMode === "add") {
        // Mode Add
        const response = await apiService.addTemplate(formData);
        if (response.success) {
          const savedForm = {
            id: response.template._id,
            ...formData,
            isFromDB: true,
          };
          setFormDataList([...formDataList, savedForm]);
          setShowFormDialog(false);
          setResult({
            success: true,
            message: "✅ Data form berhasil disimpan ke database!",
          });
        }
      } else {
        // Mode Edit
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
          setResult({
            success: true,
            message: "✅ Data form berhasil diperbarui!",
          });
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: `❌ Gagal ${
          dialogMode === "add" ? "menyimpan" : "memperbarui"
        } data form: ${error.message}`,
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteRow = async (id) => {
    const _row = formDataList.find((r) => r.id === id);

    if (!confirm("Hapus template ini dari database?")) return;

    try {
      await apiService.deleteTemplate(id);
      setFormDataList(formDataList.filter((r) => r.id !== id));
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
      setResult({
        success: true,
        message: "✅ Template berhasil dihapus!",
      });
    } catch (error) {
      setResult({
        success: false,
        message: "❌ Gagal menghapus template: " + error.message,
      });
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
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
      alert("Pilih minimal 1 form untuk dijadwalkan!");
      return;
    }

    setLoading(true);
    setResult(null);

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

      setResult({
        success: true,
        message: response.message,
      });

      await loadScheduledJobs();
      setSelectedRows([]);
      setShowScheduleModal(false);
      setActiveTab("jobs");
    } catch (error) {
      setResult({
        success: false,
        message: "Error: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId) => {
    try {
      await apiService.cancelJob(jobId);
      await loadScheduledJobs();
    } catch (error) {
      alert("Gagal membatalkan job: " + error.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm("Yakin mau hapus job ini?")) return;

    try {
      await apiService.deleteJob(jobId);
      await loadScheduledJobs();
    } catch (error) {
      alert("Gagal menghapus job: " + error.message);
    }
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

  return (
    <div className="min-h-screen bg-[#F0C7A0]">
      {/* Header */}
      <div className="bg-[#43172F] text-white p-4">
        <div>
          <h1 className="text-xl font-bold">📅 Upload Mingguan</h1>
          <p className="text-sm text-[#F0C7A0] opacity-80">
            Data form tersimpan otomatis ke database
          </p>
        </div>

        {/* Desktop Tabs - Posisi di atas */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setActiveTab("forms")}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
              activeTab === "forms"
                ? "bg-white text-[#43172F]"
                : "bg-[#5A1F40] text-white hover:bg-[#6A2F50]"
            }`}
          >
            📋 Data Form ({formDataList.length})
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
              activeTab === "jobs"
                ? "bg-white text-[#43172F]"
                : "bg-[#5A1F40] text-white hover:bg-[#6A2F50]"
            }`}
          >
            ⏰ Scheduled Jobs ({scheduledJobs.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Result Alert */}
        {result && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              result.success
                ? "bg-green-100 border border-green-300 text-green-800"
                : "bg-red-100 border border-red-300 text-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{result.message}</span>
              <button
                onClick={() => setResult(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons - Desktop Only */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={openAddDialog}
            className="flex items-center gap-2 px-5 py-3 bg-[#43172F] text-white rounded-lg hover:bg-[#5A1F40] transition"
          >
            <Plus size={20} />
            Tambah Data Form
          </button>

          {selectedRows.length > 0 && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-[#2D5016] text-white rounded-lg hover:bg-[#3D6A1E] transition"
            >
              <Calendar size={20} />
              Jadwalkan ({selectedRows.length})
            </button>
          )}

          <button
            onClick={loadScheduledJobs}
            className="flex items-center gap-2 px-5 py-3 bg-white text-[#43172F] border border-[#43172F] rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} />
            Refresh Jobs
          </button>
        </div>

        {/* Forms Tab Content */}
        {activeTab === "forms" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#43172F]">
                Daftar Data Form ({formDataList.length})
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedRows.length} dipilih
                </span>
              </div>
            </div>

            {formDataList.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Belum ada data form
                </h3>
                <p className="text-gray-500 mb-4">
                  Tambahkan data form untuk memulai
                </p>
                <button
                  onClick={openAddDialog}
                  className="px-6 py-3 bg-[#43172F] text-white rounded-lg font-medium"
                >
                  <Plus size={20} className="inline mr-2" />
                  Tambah Data Form
                </button>
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="bg-white rounded-lg p-4 mb-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === formDataList.length &&
                        formDataList.length > 0
                      }
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-[#43172F] rounded"
                    />
                    <span className="font-medium text-[#43172F]">
                      Pilih Semua ({selectedRows.length} dipilih)
                    </span>
                  </div>
                </div>

                {/* Forms Grid */}
                <div className="grid gap-4">
                  {formDataList.map((row) => (
                    <FormDataCard
                      key={row.id}
                      data={row}
                      isSelected={selectedRows.includes(row.id)}
                      onSelect={() => handleSelectRow(row.id)}
                      onEdit={() => openEditDialog(row)}
                      onDelete={handleDeleteRow}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Jobs Tab Content */}
        {activeTab === "jobs" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#43172F]">
                Scheduled Jobs ({scheduledJobs.length})
              </h2>
              <button
                onClick={loadScheduledJobs}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#43172F] border border-[#43172F] rounded-lg hover:bg-gray-50"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>

            <JobsCard
              jobs={scheduledJobs}
              onCancel={handleCancelJob}
              onDelete={handleDeleteJob}
            />
          </div>
        )}
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

      {/* Form Dialog (Tunggal untuk Add dan Edit) */}
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
        />
      )}
    </div>
  );
};

export default MingguanPage;
