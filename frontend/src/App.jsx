// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import MingguanPage from "./pages/MingguanPage";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-900">
                    📋 Form Scheduler
                  </h1>
                </Link>
                <div className="flex gap-2">
                  <Link
                    to="/mingguan"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    Mingguan
                  </Link>
                  {/* Add more routes here later */}
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                v2.0
              </span>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Navigate to="/mingguan" replace />} />
          <Route path="/mingguan" element={<MingguanPage />} />
          <Route path="*" element={<Navigate to="/mingguan" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
