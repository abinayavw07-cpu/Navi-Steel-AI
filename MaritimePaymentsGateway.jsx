import React, { useState, useMemo } from 'react';
import {
  CreditCard, Fuel, ShieldCheck, CheckCircle2, AlertCircle,
  RefreshCw, ChevronDown, Lock, Banknote, Coins, Wallet
} from 'lucide-react';

// ─── Static config ────────────────────────────────────────────────────────────
const FUEL_TYPES = [
  { key: 'VLSFO', label: 'VLSFO — Very Low Sulphur Fuel Oil', usdPerMt: 610 },
  { key: 'LSMGO', label: 'LSMGO — Low Sulphur Marine Gas Oil', usdPerMt: 740 },
  { key: 'HSFO',  label: 'HSFO — High Sulphur Fuel Oil',      usdPerMt: 480 },
];

const PAYMENT_METHODS = [
  { key: 'lc',     label: 'Maritime Letter of Credit (L/C)',   icon: Banknote },
  { key: 'crypto', label: 'Crypto Escrow (USDT / USDC)',       icon: Coins    },
  { key: 'card',   label: 'Credit / Debit Card',               icon: CreditCard },
  { key: 'upi',    label: 'UPI / NetBanking (Port Dues)',      icon: Wallet   },
];

const CARBON_RATE_USD_PER_MT = 28;   // USD per MT CO₂ offset credit
const TAX_PCT = 0.05;                // 5% maritime service tax

export default function MaritimePaymentsGateway({ currency = 'INR', curSymbol = '₹', convertRate }) {
  const [fuelType, setFuelType]       = useState('VLSFO');
  const [volumeMt, setVolumeMt]       = useState(500);
  const [payMethod, setPayMethod]     = useState('lc');
  const [includeCarbon, setIncludeCarbon] = useState(true);
  const [payState, setPayState]       = useState('idle'); // idle | processing | verified | error
  const [escrowKey, setEscrowKey]     = useState('');
  const [showModal, setShowModal]     = useState(false);

  const selected = FUEL_TYPES.find(f => f.key === fuelType);

  const calc = useMemo(() => {
    const baseUsd   = selected.usdPerMt * volumeMt;
    const carbonUsd = includeCarbon ? CARBON_RATE_USD_PER_MT * (volumeMt * 0.015) : 0;
    const taxUsd    = (baseUsd + carbonUsd) * TAX_PCT;
    const totalUsd  = baseUsd + carbonUsd + taxUsd;

    const fmt = (usd) => {
      const raw = convertRate ? convertRate(usd) : usd * 83.5;
      const num = typeof raw === 'string' ? parseFloat(raw) : raw;
      return `${curSymbol}${isNaN(num) ? '0' : num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    };

    return { baseUsd, carbonUsd, taxUsd, totalUsd, fmt };
  }, [fuelType, volumeMt, includeCarbon, curSymbol, convertRate, selected]); // eslint-disable-line

  const handlePay = () => {
    setPayState('processing');
    setTimeout(() => {
      const key = `ESC-${Date.now().toString(36).toUpperCase()}-NAVIST`;
      setEscrowKey(key);
      setPayState('verified');
      setShowModal(true);
    }, 1800);
  };

  const reset = () => {
    setPayState('idle');
    setEscrowKey('');
    setShowModal(false);
  };

  return (
    <>
      <div className="bg-white border border-sky-200 shadow-sm rounded-2xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-emerald-50 text-emerald-900 border-b border-emerald-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <CreditCard size={18} />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">Maritime Digital Payments & Fuel Escrow</h2>
              <p className="text-[11px] text-emerald-700/70 font-mono mt-0.5">Bunker Fuel · Port Tariffs · Carbon Offset Credits · Emergency Services</p>
            </div>
          </div>
          {payState === 'verified' && (
            <span className="flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-bold font-mono px-3 py-1 rounded-full animate-pulse">
              <CheckCircle2 size={12} /> ESCROW LOCKED
            </span>
          )}
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT — Invoice Builder */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-sky-900/70 uppercase tracking-wider font-mono">Fuel Invoice Builder</p>

            {/* Fuel type */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 font-mono uppercase tracking-wider block mb-1">Fuel Type</label>
              <div className="relative">
                <Fuel size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500 pointer-events-none" />
                <select
                  value={fuelType}
                  onChange={e => setFuelType(e.target.value)}
                  className="w-full bg-sky-50/50 border border-sky-200 rounded-xl pl-9 pr-9 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/20 cursor-pointer appearance-none"
                >
                  {FUEL_TYPES.map(f => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Volume */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 font-mono uppercase tracking-wider block mb-1">Volume (Metric Tons)</label>
              <input
                type="number"
                min={1}
                value={volumeMt}
                onChange={e => setVolumeMt(Math.max(1, Number(e.target.value)))}
                className="w-full bg-sky-50/50 border border-sky-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-sky-400/20"
              />
            </div>

            {/* Carbon offset toggle */}
            <label className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeCarbon}
                onChange={e => setIncludeCarbon(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-emerald-800">Include IMO Carbon Offset Credit</span>
                <span className="block text-[10px] text-emerald-600 font-mono">${CARBON_RATE_USD_PER_MT}/MT CO₂e · CORSIA Standard</span>
              </div>
            </label>

            {/* Payment method */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 font-mono uppercase tracking-wider block mb-1.5">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPayMethod(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                      payMethod === key
                        ? 'bg-sky-600 border-sky-700 text-white shadow-md shadow-sky-300/30'
                        : 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
                    }`}
                  >
                    <Icon size={13} className="shrink-0" />
                    <span className="leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Invoice Summary + Pay */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-sky-900/70 uppercase tracking-wider font-mono mb-3">Invoice Summary</p>
              <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl overflow-hidden">
                {[
                  { label: `${selected.label} Base Cost`, value: calc.fmt(calc.baseUsd) },
                  ...(includeCarbon ? [{ label: 'IMO Carbon Offset (CORSIA)', value: calc.fmt(calc.carbonUsd) }] : []),
                  { label: 'Maritime Service Tax (5%)', value: calc.fmt(calc.taxUsd) },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center justify-between px-4 py-2.5 text-xs font-mono ${i % 2 === 0 ? 'bg-white/60' : ''}`}>
                    <span className="text-slate-600">{row.label}</span>
                    <span className="font-bold text-slate-800">{row.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 bg-sky-600 text-white">
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">Total Payable</span>
                  <span className="text-base font-black font-mono">{calc.fmt(calc.totalUsd)}</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <Lock size={11} className="text-emerald-500" />
                Secured via TLS 1.3 · IMO Financial Regulation Compliant · Escrow Protected
              </div>
            </div>

            {/* Pay button */}
            <div className="space-y-2">
              {payState === 'idle' && (
                <button
                  type="button"
                  onClick={handlePay}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                  style={{ boxShadow: '0 0 18px 2px rgba(16,185,129,0.25)' }}
                >
                  <CreditCard size={16} /> Pay Bunker Fuel Invoice / Generate Escrow Key
                </button>
              )}
              {payState === 'processing' && (
                <button type="button" disabled className="w-full bg-emerald-400 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 opacity-80 cursor-wait">
                  <RefreshCw size={15} className="animate-spin" /> Processing Secure Payment…
                </button>
              )}
              {payState === 'verified' && (
                <div className="space-y-2">
                  <div className="w-full bg-emerald-50 border-2 border-emerald-400 rounded-xl px-4 py-3 flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-emerald-800 uppercase tracking-wide">PAYMENT VERIFIED — ESCROW LOCKED</p>
                      <p className="text-[10px] font-mono text-emerald-600 mt-0.5">Key: <span className="font-bold">{escrowKey}</span></p>
                    </div>
                  </div>
                  <button type="button" onClick={reset} className="w-full bg-sky-50 border border-sky-200 text-sky-700 font-bold py-2 rounded-xl text-xs hover:bg-sky-100 transition-all cursor-pointer">
                    New Payment
                  </button>
                </div>
              )}
              {payState === 'error' && (
                <div className="w-full bg-rose-50 border border-rose-300 rounded-xl px-4 py-3 flex items-center gap-2 text-xs text-rose-700 font-mono">
                  <AlertCircle size={15} className="shrink-0" /> Payment gateway error. Please retry.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 max-w-sm w-full p-7" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-emerald-100 rounded-full">
                <ShieldCheck size={32} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Transaction Complete</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">Maritime Fuel Escrow Gateway</p>
              </div>
              <div className="w-full bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-left space-y-1.5 font-mono text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Fuel Type</span><span className="font-bold text-slate-800">{fuelType}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Volume</span><span className="font-bold text-slate-800">{volumeMt} MT</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Total Paid</span><span className="font-bold text-emerald-700">{calc.fmt(calc.totalUsd)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Method</span><span className="font-bold text-slate-800">{PAYMENT_METHODS.find(p => p.key === payMethod)?.label}</span></div>
                <div className="flex justify-between items-start gap-2"><span className="text-slate-500 shrink-0">Escrow Key</span><span className="font-bold text-sky-700 break-all text-right">{escrowKey}</span></div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Funds held in IMO-regulated maritime escrow. Release upon delivery confirmation.</p>
              <button onClick={() => setShowModal(false)} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
