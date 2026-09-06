import React, { useState, useRef } from 'react';
import {
  FileText, ShieldCheck, Upload, Download, CheckCircle2,
  AlertCircle, Clock, Eye, QrCode, Anchor, Leaf, Waves,
  ShieldAlert, Users, X, ChevronRight
} from 'lucide-react';

// ─── Initial document catalogue ───────────────────────────────────────────────
const INITIAL_DOCS = [
  {
    id: 'vessel-reg',
    category: 'Vessel Registration & Boat Proof',
    icon: Anchor,
    iconBg: 'bg-sky-100 text-sky-700',
    items: [
      { id: 'vr-1', name: 'Official Registry Certificate', ref: 'IND-VSL-2024-77421', status: 'VALID',    expiry: '2026-12-31', file: null },
      { id: 'vr-2', name: 'Flag State Certificate',        ref: 'FLAG-IN-9934B',      status: 'VALID',    expiry: '2027-03-15', file: null },
      { id: 'vr-3', name: 'Hull & Call Sign Declaration',  ref: 'CALL-VUNX4',         status: 'EXPIRING', expiry: '2025-11-20', file: null },
    ],
  },
  {
    id: 'co2',
    category: 'IMO 2026 CO₂ Emission Permit & CII Certificate',
    icon: Leaf,
    iconBg: 'bg-emerald-100 text-emerald-700',
    items: [
      { id: 'co2-1', name: 'CII Carbon Intensity Certificate (Grade A)', ref: 'CII-2025-A-4491',    status: 'VALID',   expiry: '2026-01-01', file: null },
      { id: 'co2-2', name: 'IMO MEPC.339(76) Emission Permit',           ref: 'MEPC-2025-77332',   status: 'VALID',   expiry: '2026-06-30', file: null },
      { id: 'co2-3', name: 'EEOI Green Benchmark Report',                ref: 'EEOI-Q2-2025',      status: 'PENDING', expiry: '2025-07-01', file: null },
    ],
  },
  {
    id: 'ballast',
    category: 'IMO Ballast Water Management Compliance',
    icon: Waves,
    iconBg: 'bg-blue-100 text-blue-700',
    items: [
      { id: 'bwm-1', name: 'BWM D-2 Standard Certificate',   ref: 'BWM-D2-2024-INV9',  status: 'VALID',    expiry: '2027-08-10', file: null },
      { id: 'bwm-2', name: 'Ballast Treatment System Report', ref: 'BTS-UV-2025-002',    status: 'VALID',    expiry: '2026-08-10', file: null },
      { id: 'bwm-3', name: 'IOPP Certificate (Annex I)',      ref: 'IOPP-AX1-22411',    status: 'EXPIRING', expiry: '2025-10-05', file: null },
    ],
  },
  {
    id: 'insurance',
    category: 'Maritime Insurance & P&I Club Coverage',
    icon: ShieldAlert,
    iconBg: 'bg-purple-100 text-purple-700',
    items: [
      { id: 'ins-1', name: 'P&I Club Entry Certificate',      ref: 'PNI-2025-UK-88812', status: 'VALID',    expiry: '2026-02-20', file: null },
      { id: 'ins-2', name: 'Hull & Machinery Policy',         ref: 'HM-IN-44291-B',     status: 'VALID',    expiry: '2026-02-20', file: null },
      { id: 'ins-3', name: 'War Risk Extension Certificate',  ref: 'WRX-2025-44AB',     status: 'PENDING',  expiry: '2025-09-01', file: null },
    ],
  },
  {
    id: 'crew',
    category: 'Crew STCW Fitness & Duty Rotation Logs',
    icon: Users,
    iconBg: 'bg-amber-100 text-amber-700',
    items: [
      { id: 'cr-1', name: 'Master STCW Certificate',          ref: 'STCW-MST-2024-7712', status: 'VALID',   expiry: '2027-04-15', file: null },
      { id: 'cr-2', name: 'Chief Officer STCW Certificate',   ref: 'STCW-CHO-2024-3301', status: 'VALID',   expiry: '2027-04-15', file: null },
      { id: 'cr-3', name: 'Medical Fitness — All Crew',       ref: 'MED-2025-BULK-009',  status: 'EXPIRING',expiry: '2025-12-01', file: null },
      { id: 'cr-4', name: 'Crew Duty Rotation Log (Q2 2025)', ref: 'ROT-Q2-2025-NAVI',   status: 'VALID',   expiry: '2025-12-31', file: null },
    ],
  },
];

const STATUS_STYLE = {
  VALID:    { pill: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2, label: 'VALID / VERIFIED' },
  EXPIRING: { pill: 'bg-amber-100 text-amber-800 border-amber-200',      icon: Clock,        label: 'EXPIRING SOON'   },
  PENDING:  { pill: 'bg-red-100 text-red-800 border-red-200',            icon: AlertCircle,  label: 'PENDING RENEWAL' },
};

// ─── QR Code — SVG data-URI via google chart (no external JS dep) ─────────────
function QRModal({ text, onClose }) {
  const encoded = encodeURIComponent(text);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-200 p-7 flex flex-col items-center gap-4 max-w-xs w-full" onClick={e => e.stopPropagation()}>
        <h3 className="font-black text-slate-900 text-base">Port Customs QR Code</h3>
        <img src={qrUrl} alt="QR Code" className="w-48 h-48 rounded-lg border border-sky-100" />
        <p className="text-[10px] text-slate-500 font-mono text-center break-all">{text}</p>
        <button onClick={onClose} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all cursor-pointer">Close</button>
      </div>
    </div>
  );
}

// ─── Doc View Modal ───────────────────────────────────────────────────────────
function DocViewModal({ doc, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-200 max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-sky-50 border-b border-sky-100 px-6 py-4 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-sm">{doc.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-3 font-mono text-xs">
          {[
            ['Document Name', doc.name],
            ['Reference No.', doc.ref],
            ['Status', doc.status],
            ['Expiry Date', doc.expiry],
            ['Uploaded File', doc.file ? doc.file.name : 'No file attached — click Upload'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="text-slate-500 w-36 shrink-0">{k}</span>
              <span className="font-bold text-slate-800 break-all">{v}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DocumentsVault() {
  const [docs, setDocs]         = useState(INITIAL_DOCS);
  const [qrTarget, setQrTarget] = useState(null);   // { text }
  const [viewDoc, setViewDoc]   = useState(null);   // doc item
  const [dragOver, setDragOver] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInputRef = useRef(null);

  // ── Attach a file to a document item ────────────────────────────────────
  const attachFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext)) {
      setUploadMsg('⚠ Only .pdf, .png, .jpg files are accepted.');
      return;
    }
    // Attach to first PENDING or EXPIRING doc item as a demo
    let attached = false;
    const updated = docs.map(cat => ({
      ...cat,
      items: cat.items.map(item => {
        if (!attached && (!item.file) && (item.status === 'PENDING' || item.status === 'EXPIRING')) {
          attached = true;
          return { ...item, file, status: 'VALID' };
        }
        return item;
      }),
    }));
    setDocs(updated);
    setUploadMsg(`✅ "${file.name}" attached and document marked VALID.`);
    setTimeout(() => setUploadMsg(''), 4000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    attachFile(file);
  };

  const handleFileInput = (e) => {
    attachFile(e.target.files[0]);
    e.target.value = '';
  };

  // ── Summary counts ────────────────────────────────────────────────────────
  const allItems = docs.flatMap(c => c.items);
  const counts = {
    VALID:    allItems.filter(i => i.status === 'VALID').length,
    EXPIRING: allItems.filter(i => i.status === 'EXPIRING').length,
    PENDING:  allItems.filter(i => i.status === 'PENDING').length,
  };

  return (
    <>
      <div className="bg-white border border-sky-200 shadow-sm rounded-2xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-sky-50 text-sky-900 border-b border-sky-100 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 rounded-xl text-sky-700">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">Digital Maritime Documents Vault</h2>
              <p className="text-[11px] text-sky-700/70 font-mono mt-0.5">Vessel Certificates · IMO Compliance · Insurance · Crew STCW · Ballast</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">{counts.VALID} Valid</span>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">{counts.EXPIRING} Expiring</span>
            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">{counts.PENDING} Pending</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl px-6 py-5 flex flex-col items-center gap-2 cursor-pointer transition-all select-none ${
              dragOver ? 'border-sky-500 bg-sky-50' : 'border-sky-200 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-400'
            }`}
          >
            <Upload size={22} className="text-sky-500" />
            <p className="text-sm font-bold text-sky-800">Drop certificate here or click to browse</p>
            <p className="text-[11px] text-slate-500 font-mono">Accepted: .pdf · .png · .jpg — auto-attached to first pending document</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {uploadMsg && (
            <p className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">
              {uploadMsg}
            </p>
          )}

          {/* Document Categories */}
          <div className="space-y-5">
            {docs.map(cat => {
              const CatIcon = cat.icon;
              return (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className={`p-1.5 rounded-lg ${cat.iconBg}`}>
                      <CatIcon size={14} />
                    </div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">{cat.category}</h3>
                  </div>

                  <div className="space-y-1.5">
                    {cat.items.map(item => {
                      const { pill, icon: StatusIcon, label: statusLabel } = STATUS_STYLE[item.status];
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-sky-100 hover:border-sky-200 rounded-xl px-4 py-2.5 transition-all group"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <FileText size={14} className="text-sky-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">Ref: {item.ref} · Expires: {item.expiry}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Status pill */}
                            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono ${pill}`}>
                              <StatusIcon size={10} /> {statusLabel}
                            </span>

                            {/* Action buttons */}
                            <button
                              title="View Document"
                              onClick={() => setViewDoc(item)}
                              className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 transition-all cursor-pointer"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              title="Generate QR for Port Customs"
                              onClick={() => setQrTarget({ text: `NAVI-STEEL | ${item.name} | REF:${item.ref} | EXP:${item.expiry} | STATUS:${item.status}` })}
                              className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 transition-all cursor-pointer"
                            >
                              <QrCode size={13} />
                            </button>
                            <button
                              title="Download / Trigger PDF"
                              onClick={() => {
                                const blob = new Blob(
                                  [`NAVI-STEEL AI — Maritime Certificate\n\nDocument: ${item.name}\nReference: ${item.ref}\nStatus: ${item.status}\nExpiry: ${item.expiry}\n\nGenerated: ${new Date().toUTCString()}`],
                                  { type: 'text/plain' }
                                );
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${item.ref}.txt`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 transition-all cursor-pointer"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer legend */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-sky-100 text-[10px] font-mono font-bold">
            {Object.entries(STATUS_STYLE).map(([key, { pill, label }]) => (
              <span key={key} className={`px-2.5 py-1 rounded-full border ${pill}`}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {qrTarget && <QRModal text={qrTarget.text} onClose={() => setQrTarget(null)} />}
      {viewDoc   && <DocViewModal doc={viewDoc} onClose={() => setViewDoc(null)} />}
    </>
  );
}
