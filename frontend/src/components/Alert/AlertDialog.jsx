// components/Alert/AlertDialog.jsx

import React, { useEffect } from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";

// Komponen Alert Dialog yang Reusable
const AlertDialog = ({
  isOpen,
  onClose,
  onConfirm,
  type = "info",
  title,
  message,
  confirmText = "OK",
  cancelText = "Batal",
  showCancel = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const alertStyles = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
      borderColor: "border-green-200",
      btnColor: "bg-green-500 hover:bg-green-600",
      ringColor: "ring-green-200",
    },
    error: {
      icon: AlertCircle,
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
      borderColor: "border-red-200",
      btnColor: "bg-red-500 hover:bg-red-600",
      ringColor: "ring-red-200",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-500",
      borderColor: "border-yellow-200",
      btnColor: "bg-yellow-500 hover:bg-yellow-600",
      ringColor: "ring-yellow-200",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
      borderColor: "border-blue-200",
      btnColor: "bg-blue-500 hover:bg-blue-600",
      ringColor: "ring-blue-200",
    },
    delete: {
      icon: Trash2,
      bgColor: "bg-red-50",
      iconColor: "text-red-500",
      borderColor: "border-red-200",
      btnColor: "bg-red-500 hover:bg-red-600",
      ringColor: "ring-red-200",
    },
    confirm: {
      icon: HelpCircle,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-500",
      borderColor: "border-purple-200",
      btnColor: "bg-purple-500 hover:bg-purple-600",
      ringColor: "ring-purple-200",
    },
  };

  const style = alertStyles[type];
  const IconComponent = style.icon;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes iconPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes iconRotate {
          0% {
            transform: rotate(-180deg);
            opacity: 0;
          }
          100% {
            transform: rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes pulseRing {
          0% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.2;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.5;
          }
        }

        @keyframes pingSlow {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-icon-pop {
          animation: iconPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards;
        }

        .animate-icon-rotate {
          animation: iconRotate 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards;
        }

        .animate-pulse-ring {
          animation: pulseRing 2s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-slide-up {
          animation: slideUp 0.4s ease-out 0.3s backwards;
        }

        .animate-slide-up-delay {
          animation: slideUp 0.4s ease-out 0.4s backwards;
        }

        .animate-slide-up-delay-2 {
          animation: slideUp 0.4s ease-out 0.5s backwards;
        }
      `}</style>

      <div
        className="fixed inset-0 z-100 flex items-center justify-center p-4 animate-fadeIn"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 "></div>

        {/* Dialog */}
        <div
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 duration-300"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="p-6 pt-8">
            {/* Icon with animated ring */}
            <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
              {/* Animated rings */}
              <div
                className={`absolute inset-0 ${style.bgColor} rounded-full animate-ping-slow opacity-75`}
              ></div>
              <div
                className={`absolute inset-0 ${style.bgColor} rounded-full animate-pulse-ring`}
              ></div>

              {/* Icon container */}
              <div
                className={`relative w-16 h-16 ${style.bgColor} ${style.borderColor} border-4 rounded-full flex items-center justify-center animate-icon-pop`}
              >
                <IconComponent
                  className={`${style.iconColor} animate-icon-rotate`}
                  size={32}
                  strokeWidth={2.5}
                />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center text-gray-800 mb-2 animate-slide-up">
              {title}
            </h3>

            {/* Message */}
            <p className="text-center text-gray-600 mb-6 animate-slide-up-delay">
              {message}
            </p>

            {/* Buttons */}
            <div className="flex gap-3 animate-slide-up-delay-2">
              {showCancel && (
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className={`flex-1 px-4 py-3 ${style.btnColor} text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AlertDialog;
