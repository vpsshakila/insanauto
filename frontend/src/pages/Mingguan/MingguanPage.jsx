// pages/MingguanPage.jsx
import React, { useState, useEffect } from "react";
import { Calendar, Plus, Save, RefreshCw } from "lucide-react";
import { apiService } from "../../services/api";
import FormDataTable from "../../components/Mingguan/FormDataTable";
import ScheduleModal from "../../components/Mingguan/ScheduleModal";
import JobsTable from "../../components/Mingguan/JobsTable";

const MingguanPage = () => {
  const [formDataList, setFormDataList] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

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
          namaLokasi: t.nama_lokasi || "", // Tambahkan ini
          hari: t.hari || "", // Tambahkan ini
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

  const handleAddRow = () => {
    const newRow = {
      id: `temp_${Date.now()}`,
      tid: "",
      kondisiCamera: "Baik",
      kondisiNVR: "Merekam",
      nama: "",
      perusahaan: "",
      noPegawai: "",
      namaLokasi: "", // Tambahkan default value
      hari: "", // Tambahkan default value
      isFromDB: false,
    };
    setFormDataList([...formDataList, newRow]);
  };

  const handleDeleteRow = async (id) => {
    const row = formDataList.find((r) => r.id === id);

    if (row.isFromDB) {
      if (!confirm("Hapus template ini dari database?")) return;

      try {
        await apiService.deleteTemplate(id);
        setFormDataList(formDataList.filter((r) => r.id !== id));
        setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
      } catch (error) {
        alert("Gagal menghapus template: " + error.message);
      }
    } else {
      setFormDataList(formDataList.filter((r) => r.id !== id));
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    }
  };

  const handleUpdateRow = (id, field, value) => {
    setFormDataList(
      formDataList.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSaveTemplates = async () => {
    setIsSaving(true);
    try {
      const promises = formDataList.map(async (row) => {
        const formData = {
          tid: row.tid,
          kondisiCamera: row.kondisiCamera,
          kondisiNVR: row.kondisiNVR,
          nama: row.nama,
          perusahaan: row.perusahaan,
          noPegawai: row.noPegawai,
          namaLokasi: row.namaLokasi, // Tambahkan ini
          hari: row.hari, // Tambahkan ini
        };

        if (row.isFromDB) {
          return apiService.updateTemplate(row.id, formData);
        } else {
          return apiService.addTemplate(formData);
        }
      });

      await Promise.all(promises);

      setResult({
        success: true,
        message: "✅ Templates berhasil disimpan!",
      });

      await loadFormTemplates();
    } catch (error) {
      setResult({
        success: false,
        message: "❌ Gagal menyimpan templates: " + error.message,
      });
    } finally {
      setIsSaving(false);
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
        // Hapus field yang tidak ingin dikirim ke schedule batch
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📅 Upload Mingguan
          </h1>
          <p className="text-gray-600">
            Data form tersimpan otomatis. Tinggal pilih & jadwalkan kapan mau
            upload!
          </p>
        </div>

        {/* Result Alert */}
        {result && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              result.success
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{result.message}</span>
              <button
                onClick={() => setResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Form Data Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Data Form ({formDataList.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={18} />
                Tambah Row
              </button>
              <button
                onClick={handleSaveTemplates}
                disabled={isSaving || formDataList.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Simpan Templates
                  </>
                )}
              </button>
              {selectedRows.length > 0 && (
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Calendar size={18} />
                  Jadwalkan ({selectedRows.length})
                </button>
              )}
            </div>
          </div>

          <FormDataTable
            data={formDataList}
            selectedRows={selectedRows}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
            onUpdateRow={handleUpdateRow}
            onDeleteRow={handleDeleteRow}
          />
        </div>

        {/* Scheduled Jobs Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Scheduled Jobs ({scheduledJobs.length})
            </h2>
            <button
              onClick={loadScheduledJobs}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          <JobsTable
            jobs={scheduledJobs}
            onCancel={handleCancelJob}
            onDelete={handleDeleteJob}
          />
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
    </div>
  );
};

export default MingguanPage;
