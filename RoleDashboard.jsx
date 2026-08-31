import React, { useState, useEffect } from 'react';
import { ShieldCheck, Ship, UserCheck, RefreshCw } from 'lucide-react';

export default function RoleDashboard() {
  const [currentRole, setCurrentRole] = useState('Chartering Manager');

  // Load role from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('user_role');
    if (savedRole) {
      setCurrentRole(savedRole);
    }
  }, []);

  // Function to switch role for testing/demo purposes
  const handleRoleSwitch = (role) => {
    setCurrentRole(role);
    localStorage.setItem('user_role', role);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-sm font-mono">
      {/* Role Switcher Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 mb-4 border-b border-sky-100">
        <div className="flex items-center gap-2">
          <UserCheck size={16} className="text-sky-600" />
          <span className="text-xs font-bold text-sky-900">
            Active User Role: <span className="text-blue-600 underline">{currentRole}</span>
          </span>
        </div>
        
        <div className="flex gap-1.5 bg-sky-50 p-1 rounded-xl border border-sky-200">
          <button
            onClick={() => handleRoleSwitch('Chartering Manager')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
              currentRole === 'Chartering Manager'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-sky-800 hover:bg-sky-100'
            }`}
          >
            Chartering Manager
          </button>
          <button
            onClick={() => handleRoleSwitch('Port Captain')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
              currentRole === 'Port Captain'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-sky-800 hover:bg-sky-100'
            }`}
          >
            Port Captain
          </button>
        </div>
      </div>

      {/* Dynamic View Content Based on Role */}
      {currentRole === 'Port Captain' ? (
        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <ShieldCheck size={16} className="text-amber-600" />
            <span>Port Captain Safety & Berthing Clearance Panel</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Safety compliance mode active. You have priority clearance to verify vessel draft limits (e.g., Haldia 8.5m max), monitor weather swells, and authorize berth arrivals.
          </p>
          <div className="flex gap-2 pt-1">
            <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded border border-amber-300 text-[10px] font-bold">
              Draft Limit Check: Verified
            </span>
            <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded border border-amber-300 text-[10px] font-bold">
              Pilotage Clearance: Enabled
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-blue-900 font-bold">
            <Ship size={16} className="text-blue-600" />
            <span>Chartering Manager Freight & Optimization Panel</span>
          </div>
          <p className="text-blue-800 leading-relaxed">
            Commercial optimization mode active. Focus on freight cost minimization, demurrage calculations, multi-currency tracking, and contract agreement structures.
          </p>
          <div className="flex gap-2 pt-1">
            <span className="bg-blue-100 text-blue-900 px-2 py-1 rounded border border-blue-300 text-[10px] font-bold">
              Cost Analyzer: Active
            </span>
            <span className="bg-blue-100 text-blue-900 px-2 py-1 rounded border border-blue-300 text-[10px] fixed-none text-[10px] font-bold">
              ESG Tracking: Online
            </span>
          </div>
        </div>
      )}
    </div>
  );
}