import { useState, useEffect } from "react";
import { Ship, RefreshCw, Anchor } from "lucide-react";

const API_BASE = "http://localhost:5000";

export default function VesselFleetView() {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/fleet`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch fleet data");
        return res.json();
      })
      .then((data) => {
        setFleet(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white/80 border border-sky-200/80 rounded-2xl p-6 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-500/10 border border-sky-200/60 rounded-xl text-sky-600 shadow-xs">
            <Ship size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Active Vessel Fleet Overview
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time monitoring of chartered and spot vessels
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
          {fleet.length} Vessels Tracked
        </span>
      </div>

      {loading ? (
        <div className="h-32 bg-sky-50/50 rounded-xl animate-pulse flex items-center justify-center text-xs text-sky-600 font-mono">
          <RefreshCw size={16} className="animate-spin mr-2" /> Loading active fleet...
        </div>
      ) : error ? (
        <p className="text-xs text-rose-600 font-mono bg-rose-50 p-3 rounded-xl border border-rose-200">
          Error loading fleet: {error}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-sky-100 text-sky-900/60 uppercase">
                <th className="pb-2.5 font-bold">Vessel Name</th>
                <th className="pb-2.5 font-bold">Tonnage (MT)</th>
                <th className="pb-2.5 font-bold">Current Port</th>
                <th className="pb-2.5 font-bold">Status</th>
                <th className="pb-2.5 font-bold text-right">Freight Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {fleet.map((v) => (
                <tr key={v.id} className="hover:bg-sky-50/40 transition-colors">
                  <td className="py-3 font-semibold text-slate-900 flex items-center gap-1.5">
                    <Anchor size={13} className="text-sky-500" /> {v.vesselName}
                  </td>
                  <td className="py-3 text-slate-700">{v.tonnage.toLocaleString()} MT</td>
                  <td className="py-3 text-slate-700">{v.port}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        v.status === "Active"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : v.status === "Loading"
                          ? "bg-sky-100 text-sky-800 border border-sky-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900">
                    ${v.freightRate.toFixed(2)}/MT
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}