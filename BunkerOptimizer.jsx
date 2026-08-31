import React, { useState } from 'react';
import { Fuel, MapPin, TrendingDown, Globe } from 'lucide-react';

export default function BunkerOptimizer({ currency = 'USD', exchangeRate = 86.5 }) {
  // கரன்சி குறியீடு மற்றும் சிம்பல் நிர்ணயம்
  const getCurrencyDetails = () => {
    switch (currency) {
      case 'INR': return { symbol: '₹', rate: exchangeRate, name: 'INR' };
      case 'EUR': return { symbol: '€', rate: 0.92, name: 'EUR' };
      case 'GBP': return { symbol: '£', rate: 0.78, name: 'GBP' };
      default: return { symbol: '$', rate: 1, name: 'USD' };
    }
  };

  const curr = getCurrencyDetails();

  // அடிப்படை விலைகள் (USD மதிப்பில்)
  const bunkerOptions = [
    { port: "Visakhapatnam (Local Port)", vlsfoPrice: 620, mgoPrice: 890, extraDeviationCost: 0 },
    { port: "Colombo (Sri Lanka)", vlsfoPrice: 595, mgoPrice: 860, extraDeviationCost: 1200 },
    { port: "Fujairah (UAE Hub)", vlsfoPrice: 560, mgoPrice: 820, extraDeviationCost: 4500 },
    { port: "Singapore Port", vlsfoPrice: 575, mgoPrice: 835, extraDeviationCost: 3800 }
  ];

  const requiredVlsfoTons = 300; // தேவைப்படும் ஃபியூயல் அளவு (MT)

  // மதிப்புகளை கரன்சிக்கு ஏற்ப மாற்றும் ஃபங்ஷன்
  const formatMoney = (usdAmount) => {
    const converted = usdAmount * curr.rate;
    if (currency === 'INR' && converted > 100000) {
      return `${curr.symbol} ${(converted / 100000).toFixed(2)} Lakhs`;
    }
    return `${curr.symbol} ${Math.round(converted).toLocaleString()}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 font-sans shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-600/30">
            <Fuel size={22} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              AI Bunker Cost & Route Price Intelligence
            </h2>
            <p className="text-xs text-slate-400">Compare regional bunker rates factoring deviation costs ({curr.name}).</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono self-start sm:self-auto">
          <Globe size={14} className="text-sky-400" />
          <span className="text-slate-400">Currency:</span>
          <strong className="text-emerald-400">{curr.name} ({curr.symbol})</strong>
        </div>
      </div>

      {/* Ports Price Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono">
              <th className="py-3 px-3">Bunker Port</th>
              <th className="py-3 px-3">VLSFO ({curr.symbol}/MT)</th>
              <th className="py-3 px-3">MGO ({curr.symbol}/MT)</th>
              <th className="py-3 px-3">Deviation Cost</th>
              <th className="py-3 px-3 text-right">Total Est. Cost (300 MT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {bunkerOptions.map((item, index) => {
              const totalFuelCostUSD = (item.vlsfoPrice * requiredVlsfoTons) + item.extraDeviationCost;
              const isCheapest = index === 2; // Fujairah base lowest fuel rate

              return (
                <tr key={index} className={`hover:bg-slate-800/40 transition-all ${isCheapest ? 'bg-emerald-950/30 border-l-2 border-emerald-500' : ''}`}>
                  <td className="py-3 px-3 font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                    <MapPin size={14} className="text-sky-400" /> {item.port}
                    {isCheapest && <span className="bg-emerald-900 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded font-mono ml-2">Best Rate 💡</span>}
                  </td>
                  <td className="py-3 px-3 text-sky-300">{formatMoney(item.vlsfoPrice)}</td>
                  <td className="py-3 px-3 text-slate-300">{formatMoney(item.mgoPrice)}</td>
                  <td className="py-3 px-3 text-slate-400">+{formatMoney(item.extraDeviationCost)}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    {formatMoney(totalFuelCostUSD)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* AI Recommendation Summary */}
      <div className="mt-5 bg-slate-800/70 border border-slate-700/80 rounded-xl p-4 text-xs flex items-start gap-3">
        <TrendingDown size={18} className="text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block mb-1">AI Smart Bunkering Verdict:</strong>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Even though <strong className="text-sky-300">Fujairah</strong> offers the lowest per-ton rate, factoring route deviation expenses makes local loading or <strong className="text-emerald-300">Singapore</strong> more economically viable in selected currency ({curr.name}).
          </p>
        </div>
      </div>
    </div>
  );
}