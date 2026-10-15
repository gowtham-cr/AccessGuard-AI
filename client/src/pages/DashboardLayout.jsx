import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.jsx';
import { Sidebar } from '../components/Sidebar.jsx';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Top Header */}
      <Navbar />

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
