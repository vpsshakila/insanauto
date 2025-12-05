// hooks/useAlert.js
import { useState } from "react";

export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    confirmText: "OK",
    cancelText: "Batal",
    showCancel: false,
  });

  const showAlert = (config) => {
    setAlertState({
      isOpen: true,
      ...config,
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  const showSuccess = (message, title = "Sukses") => {
    showAlert({
      type: "success",
      title,
      message,
    });
  };

  const showError = (message, title = "Error") => {
    showAlert({
      type: "error",
      title,
      message,
    });
  };

  const showConfirm = (config) => {
    showAlert({
      type: "confirm",
      showCancel: true,
      ...config,
    });
  };

  const showDeleteConfirm = (config) => {
    showAlert({
      type: "delete",
      title: "Konfirmasi Hapus",
      message: "Apakah Anda yakin ingin menghapus data ini?",
      confirmText: "Hapus",
      showCancel: true,
      ...config,
    });
  };

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showConfirm,
    showDeleteConfirm,
  };
};
