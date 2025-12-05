// components/BottomNav.jsx
import React, { useState, useRef, useEffect } from "react";
import { Home, Calendar, FileText, BarChart3, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const BottomNav = () => {
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const navRef = useRef(null);
  const activeButtonRef = useRef(null);

  const navItems = [
    {
      id: "/",
      label: "Beranda",
      icon: Home,
    },
    {
      id: "/mingguan",
      label: "Mingguan",
      icon: Calendar,
    },
    {
      id: "/laporan",
      label: "Laporan",
      icon: FileText,
    },
    {
      id: "/analisis",
      label: "Analisis",
      icon: BarChart3,
    },
    {
      id: "/profil",
      label: "Profil",
      icon: User,
    },
  ];

  const updateIndicator = (buttonElement) => {
    if (!buttonElement || !navRef.current) return;

    const navRect = navRef.current.getBoundingClientRect();
    const buttonRect = buttonElement.getBoundingClientRect();

    const left = buttonRect.left - navRect.left;
    const width = buttonRect.width;

    setIndicatorStyle({
      left: `${left}px`,
      width: `${width}px`,
      opacity: 1,
    });
  };

  // Update indicator ketika halaman pertama kali load
  useEffect(() => {
    const activeElement = document.querySelector(".bottom-nav-link.active");
    if (activeElement) {
      activeButtonRef.current = activeElement;
      updateIndicator(activeElement);
    }
  }, []);

  const handleMouseEnter = (buttonElement) => {
    if (!buttonElement.classList.contains("active")) {
      const navRect = navRef.current.getBoundingClientRect();
      const buttonRect = buttonElement.getBoundingClientRect();

      const left = buttonRect.left - navRect.left;
      const width = buttonRect.width;

      setIndicatorStyle((prev) => ({
        ...prev,
        left: `${left}px`,
        width: `${width}px`,
        opacity: 0.7, // Opacity lebih rendah untuk hover
      }));
    }
  };

  const handleMouseLeave = () => {
    if (activeButtonRef.current) {
      updateIndicator(activeButtonRef.current);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
      {/* Background dengan warna gelap #43172F */}
      <div className="bg-[#43172F] border-t border-[#F0C7A0]/20">
        <div
          ref={navRef}
          className="relative flex items-center justify-around px-1 py-1.5"
        >
          {/* Animated Underline Indicator - warna terang #F0C7A0 */}
          <div
            className="absolute bottom-0.5 h-[3px] bg-[#F0C7A0] rounded-full transition-all duration-300 ease-out"
            style={indicatorStyle}
          />

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.id}
                className={({ isActive }) => {
                  const baseClasses =
                    "bottom-nav-link relative flex flex-col items-center justify-center w-14 h-11 rounded-lg transition-all duration-200";
                  return isActive
                    ? `${baseClasses} text-[#F0C7A0]`
                    : `${baseClasses} text-[#F0C7A0]/80 hover:text-[#F0C7A0]`;
                }}
                end
                ref={(element) => {
                  if (element && element.classList.contains("active")) {
                    activeButtonRef.current = element;
                  }
                }}
                onMouseEnter={(e) => handleMouseEnter(e.currentTarget)}
                onMouseLeave={handleMouseLeave}
                onClick={(e) => {
                  activeButtonRef.current = e.currentTarget;
                  updateIndicator(e.currentTarget);
                }}
              >
                {({ isActive }) => (
                  <>
                    {/* Icon */}
                    <Icon
                      size={19}
                      className={`transition-transform duration-200 ${
                        isActive ? "scale-110" : "scale-100"
                      }`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />

                    {/* Label */}
                    <span className="text-[8px] font-semibold mt-0.5 transition-all duration-200">
                      {item.label}
                    </span>

                    {/* Active state - hidden dot untuk aksesibilitas */}
                    {isActive && <div className="sr-only">Aktif</div>}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Safe area untuk iPhone - DIPERKECIL */}
      <div className="h-2 bg-[#43172F] safe-area-bottom" />
    </div>
  );
};

export default BottomNav;
