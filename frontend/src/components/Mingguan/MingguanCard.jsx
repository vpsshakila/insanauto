import React, { useState, useRef, useEffect } from "react";
import {
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  Camera,
  Monitor,
  User,
  Building2,
  CreditCard,
  MapPin,
  Calendar,
  ChevronDown,
  CheckCircle,
  XCircle,
  Terminal,
} from "lucide-react";

const MingguanCard = ({
  data,
  isSelected,
  selectionMode,
  onEdit,
  onDelete,
  onPressStart,
  onPressEnd,
  onClick,
  showDeleteConfirm, // Tambahkan prop untuk konfirmasi delete
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isVerticalScrollRef = useRef(false);

  const SWIPE_THRESHOLD = 60;
  const MAX_SWIPE = 80;

  // Check if device is touch capable
  const isTouchDevice = () => {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  };

  const getStatusIcon = (status) => {
    if (status === "Baik" || status === "Merekam") {
      return <CheckCircle size={16} className="text-green-500" />;
    }
    return <XCircle size={16} className="text-red-500" />;
  };

  const handleTouchStart = (e) => {
    if (e.target.closest("button") || selectionMode) return;

    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isVerticalScrollRef.current = false;
    setIsDragging(true);
    onPressStart?.();
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isVerticalScrollRef.current || selectionMode) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startXRef.current;
    const diffY = Math.abs(currentY - startYRef.current);

    // Check if it's vertical scrolling
    if (diffY > 10 && diffY > Math.abs(diffX)) {
      isVerticalScrollRef.current = true;
      setIsDragging(false);
      setDragX(0);
      return;
    }

    // Prevent vertical scrolling while swiping horizontally
    e.preventDefault();

    const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX));
    setDragX(limitedDiff);
  };

  const handleDeleteClick = () => {
    showDeleteConfirm({
      onConfirm: () => onDelete(data.id),
      message: `Apakah Anda yakin ingin menghapus template TID ${data.tid}?`,
    });
  };

  const handleTouchEnd = () => {
    if (isVerticalScrollRef.current || selectionMode) {
      setIsDragging(false);
      setDragX(0);
      onPressEnd?.();
      return;
    }

    setIsDragging(false);

    if (dragX > SWIPE_THRESHOLD) {
      onEdit();
      setTimeout(() => setDragX(0), 300);
    } else if (dragX < -SWIPE_THRESHOLD) {
      handleDeleteClick(); // Ganti confirm dengan showDeleteConfirm
      setTimeout(() => setDragX(0), 300);
    } else {
      setDragX(0);
    }

    onPressEnd?.();
  };

  // Desktop mouse handlers for swipe
  const handleMouseDown = (e) => {
    if (e.target.closest("button") || !isTouchDevice() || selectionMode) return;

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isVerticalScrollRef.current = false;
    setIsDragging(true);
    onPressStart?.();
  };

  const handleMouseMove = (e) => {
    if (
      !isDragging ||
      !isTouchDevice() ||
      isVerticalScrollRef.current ||
      selectionMode
    )
      return;

    const currentX = e.clientX;
    const diffX = currentX - startXRef.current;

    const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX));
    setDragX(limitedDiff);
  };

  const handleMouseUp = () => {
    if (!isDragging || !isTouchDevice() || selectionMode) return;

    if (dragX > SWIPE_THRESHOLD) {
      onEdit();
      setTimeout(() => setDragX(0), 300);
    } else if (dragX < -SWIPE_THRESHOLD) {
      if (confirm("Hapus template ini?")) {
        onDelete(data.id);
      }
      setTimeout(() => setDragX(0), 300);
    } else {
      setDragX(0);
    }

    setIsDragging(false);
    onPressEnd?.();
  };

  // Handle click on card body
  const handleCardClick = (e) => {
    // Only handle if clicking on card body (not buttons or icons)
    if (
      e.target.closest("button") ||
      e.target.closest("svg") ||
      e.target.closest("path")
    ) {
      return;
    }

    onClick?.(e);
  };

  useEffect(() => {
    if (isDragging && isTouchDevice() && !selectionMode) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragX, selectionMode]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background Actions (only show on touch devices when not in selection mode) */}
      {!isTouchDevice() && !selectionMode && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onEdit()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
          >
            <Edit2 size={12} />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDeleteClick} // Ganti dengan handleDeleteClick
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
          >
            <Trash2 size={12} />
            <span>Hapus</span>
          </button>
        </div>
      )}

      {/* Card Content */}
      <div
        ref={cardRef}
        onClick={handleCardClick}
        onTouchStart={
          isTouchDevice() && !selectionMode ? handleTouchStart : undefined
        }
        onTouchMove={
          isTouchDevice() && !selectionMode ? handleTouchMove : undefined
        }
        onTouchEnd={
          isTouchDevice() && !selectionMode ? handleTouchEnd : undefined
        }
        onMouseDown={
          isTouchDevice() && !selectionMode ? handleMouseDown : undefined
        }
        className={`relative bg-white rounded-xl transition-all duration-200 select-none ${
          isSelected ? "ring-2 ring-[#43172F] shadow-lg" : "shadow"
        } ${
          isDragging && isTouchDevice() && !selectionMode
            ? "cursor-grabbing"
            : "cursor-pointer"
        }
        ${selectionMode && isSelected ? "bg-[#43172F]/5" : ""}`}
        style={{
          transform:
            isTouchDevice() && !selectionMode
              ? `translateX(${dragX}px)`
              : "none",
          transition:
            isDragging && isTouchDevice() && !selectionMode
              ? "none"
              : "transform 0.2s ease-out",
        }}
      >
        {/* Header - TID + Lokasi & Hari dalam satu baris */}
        <div className="flex items-center justify-between p-3 bg-linear-to-r from-[#43172F] to-[#5A1F40] ">
          {/* Kiri: TID dengan icon dan checkbox (saat selection mode) */}
          <div className="flex items-center gap-2">
            {/* Selection Checkbox */}
            {selectionMode && (
              <div className="mr-1">
                {isSelected ? (
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                    <CheckSquare size={14} className="text-[#43172F]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center border border-white/30">
                    <Square size={14} className="text-white" />
                  </div>
                )}
              </div>
            )}

            {/* TID Icon & Value */}
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white/20 rounded">
                <Terminal size={12} className="text-white" />
              </div>
              <div className="text-md font-bold text-white">{data.tid}</div>
            </div>
          </div>

          {/* Kanan: Lokasi & Hari dalam satu baris */}
          <div className="flex items-center ">
            {data.hari && (
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Calendar size={12} className="text-[#F0C7A0]" />
                <span className="text-xs text-white font-medium">
                  {data.hari}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Expandable Button */}
        <div className="px-2 py-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Detail</span>
            </div>
            <div className="flex gap-3 items-center">
              {data.namaLokasi && (
                <div className="flex items-center gap-1 bg-[#43172F] backdrop-blur-sm px-2 py-1 rounded-lg">
                  <MapPin size={12} className="text-[#F0C7A0]" />
                  <span className="text-xs text-white   truncate">
                    {data.namaLokasi}
                  </span>
                </div>
              )}

              <ChevronDown
                size={14}
                className={`text-gray-500 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Expanded Content */}
          <div
            className={`overflow-hidden transition-all duration-200 ${
              isExpanded ? "max-h-96 mt-2" : "max-h-0"
            }`}
          >
            <div className="space-y-3">
              {/* Camera & NVR Status */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Camera size={14} className="text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">
                      Camera
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.kondisiCamera)}
                    <span
                      className={`text-xs font-medium ${
                        data.kondisiCamera === "Baik" ||
                        data.kondisiCamera === "Merekam"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {data.kondisiCamera}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Monitor size={14} className="text-gray-600" />
                    <span className="text-xs font-medium text-gray-700">
                      NVR
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(data.kondisiNVR)}
                    <span
                      className={`text-xs font-medium ${
                        data.kondisiNVR === "Baik" ||
                        data.kondisiNVR === "Merekam"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {data.kondisiNVR}
                    </span>
                  </div>
                </div>
              </div>

              {/* Petugas Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <User size={14} className="text-blue-500" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Nama</div>
                    <div className="text-sm font-medium text-gray-800">
                      {data.nama}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Building2 size={14} className="text-purple-500" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">Perusahaan</div>
                    <div className="text-sm font-medium text-gray-800">
                      {data.perusahaan}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <CreditCard size={14} className="text-amber-500" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500">No Pegawai</div>
                    <div className="text-sm font-medium text-gray-800">
                      {data.noPegawai}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Desktop & Non-Selection Mode) */}
              {!isTouchDevice() && !selectionMode && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onEdit()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Hapus template ini?")) {
                        onDelete(data.id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-500 text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Trash2 size={12} />
                    <span>Hapus</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MingguanCard;
