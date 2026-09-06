/**
 * IMOAuditReport — Real-Time PDF Compliance Report Generator
 * Sky Blue Light Theme · jsPDF + jspdf-autotable
 *
 * Generates a professional Maritime IMO Audit Certificate containing:
 *  - CII Carbon Intensity Rating (A→E)
 *  - STCW Crew Rest Hour compliance logs
 *  - Ballast Water Discharge Status (BWM Convention)
 *  - EEXI Engine Power Limit compliance
 *  - Port State Control inspection summary
 */
import { useState, useCallback } from "react";
import { FileText, Download, CheckCircle2, AlertTriangle, RefreshCw, Ship, Leaf, Anchor, Gauge } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Static audit data (mirrors MaritimeComplianceSuite values) ──────────────
const DEFAULT_CII = {
  rating:   "B",
  score:    8.42,
  limit:    10.0,
  year:     2026,
  status:   "COMPLIANT",
};

const CREW_REST_LOGS = [
  { name: "Capt. Rajesh Kumar",   rank: "Master",         restHrs: 11.5, required: 10, status: "OK"   },
  { name: "Ch. Officer Priya S",  rank: "Chief Officer",  restHrs: 9.8,  required: 10, status: "WARN" },
  { name: "2/O Arjun Nair",       rank: "2nd Officer",    restHrs: 10.2, required: 10, status: "OK"   },
  { name: "Ch. Eng. Suresh P",    rank: "Chief Engineer", restHrs: 11.0, required: 10, status: "OK"   },
  { name: "2/E Meena Devi",       rank: "2nd Engineer",   restHrs: 8.5,  required: 10, status: "FAIL" },
  { name: "Bosun Karim Ali",      rank: "Bosun",          restHrs: 10.5, required: 10, status: "OK"   },
];

const BALLAST_STATUS = {
  system:       "Ultraviolet + Electrochlorination",
  standard:     "IMO D-2",
  lastTest:     "2026-06-15",
  nextDue:      "2026-12-15",
  testResult:   "PASS",
  dischargePort:"Visakhapatnam",
  volume:       "14,200 m³",
  exchanged:    true,
};

const PSC_ITEMS = [
  { area: "Fire Safety",         items: 22, deficiencies: 0, status: "PASS"  },
  { area: "Life Saving Appliances", items: 18, deficiencies: 1, status: "MINOR" },
  { area: "Navigation Equipment", items: 14, deficiencies: 0, status: "PASS"  },
  { area: "MARPOL Compliance",   items: 16, deficiencies: 0, status: "PASS"  },
  { area: "ISM Code",            items: 12, deficiencies: 0, status: "PASS"  },
  { area: "STCW Certificates",   items: 26, deficiencies: 2, status: "MINOR" },
];

// ─── Colour helpers for PDF ───────────────────────────────────────────────────
const PASS_CLR  = [22, 163, 74];   // emerald-600
const FAIL_CLR  = [220, 38, 38];   // rose-600
const WARN_CLR  = [217, 119, 6];   // amber-600
const MINOR_CLR = [234, 179, 8];   // yellow-500
const HEADER_BG = [2, 132, 199];   // sky-600
const ALT_ROW   = [240, 249, 255]; // sky-50

function statusColor(s) {
  if (s === "PASS" || s === "OK" || s === "COMPLIANT") return PASS_CLR;
  if (s === "FAIL")   return FAIL_CLR;
  if (s === "MINOR")  return MINOR_CLR;
  return WARN_CLR;
}

// ─── PDF generation function ──────────────────────────────────────────────────
function generatePDF({ vessel, originPort, destPort, tonnage, distanceNm, cii, language }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW  = doc.internal.pageSize.getWidth();
  const PH  = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  const certNo  = `IMO-AUD-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(Math.floor(Math.random()*9000+1000))}`;

  // ── Page background ──
  doc.setFillColor(240, 249, 255);
  doc.rect(0, 0, PW, PH, "F");
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(8, 8, PW - 16, PH - 16, 4, 4, "F");

  // ── Header band ──
  doc.setFillColor(...HEADER_BG);
  doc.rect(8, 8, PW - 16, 28, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("MARITIME IMO AUDIT CERTIFICATE", PW / 2, 20, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("NAVI-STEEL AI · Bulk Freight Intelligence Platform · Issued under IMO Resolution A.1111(30)", PW / 2, 27, { align: "center" });
  doc.text(`Certificate No: ${certNo}   ·   Issued: ${dateStr}`, PW / 2, 33, { align: "center" });

  // ── Vessel Info box ──
  let y = 46;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, y, PW - 20, 22, 3, 3, "F");
  doc.setDrawColor(...HEADER_BG);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, PW - 20, 22, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(2, 132, 199);
  doc.text("VESSEL PARTICULARS", 15, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const col1x = 15, col2x = 75, col3x = 135;
  doc.text(`Vessel Name: ${vessel}`,          col1x, y + 12);
  doc.text(`IMO Number: 9876543`,             col2x, y + 12);
  doc.text(`Flag State: India`,               col3x, y + 12);
  doc.text(`Route: ${originPort} → ${destPort}`, col1x, y + 18);
  doc.text(`Cargo: ${tonnage.toLocaleString()} MT Bulk Steel`, col2x, y + 18);
  doc.text(`Distance: ${distanceNm} NM`,      col3x, y + 18);

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 1: CII Carbon Intensity Rating
  // ─────────────────────────────────────────────────────────────────────────
  y += 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(2, 132, 199);
  doc.text("1. CII CARBON INTENSITY INDICATOR — IMO MEPC.354(78)", 10, y);
  doc.setLineWidth(0.3);
  doc.setDrawColor(186, 230, 253);
  doc.line(10, y + 2, PW - 10, y + 2);

  y += 6;
  const activeCii = cii ?? DEFAULT_CII;
  const ciiColor  = statusColor(activeCii.status);

  autoTable(doc, {
    startY: y,
    head: [["Parameter", "Value", "Limit", "Rating", "Status"]],
    body: [
      ["AER (gCO₂/t·NM)", activeCii.score.toFixed(2), `≤ ${activeCii.limit.toFixed(2)}`, activeCii.rating, activeCii.status],
      ["EEXI Compliance", "Engine Power Limited", "IMO MEPC.328(76)", "—", "COMPLIANT"],
      ["Fuel Type",       "VLSFO 0.5% S",         "MARPOL Annex VI",  "—", "PASS"],
    ],
    headStyles:   { fillColor: HEADER_BG, textColor: 255, fontSize: 8, fontStyle: "bold" },
    alternateRowStyles: { fillColor: ALT_ROW },
    bodyStyles:   { fontSize: 8, textColor: [51, 65, 85] },
    columnStyles: { 4: { fontStyle: "bold" } },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 4) {
        const s = data.cell.text[0];
        data.cell.styles.textColor = statusColor(s);
      }
      if (data.section === "body" && data.column.index === 3 && data.row.index === 0) {
        data.cell.styles.fillColor = [...ciiColor, 30];
        data.cell.styles.textColor = ciiColor;
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 10, right: 10 },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 2: STCW Crew Rest Hours
  // ─────────────────────────────────────────────────────────────────────────
  y = doc.lastAutoTable.finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(2, 132, 199);
  doc.text("2. STCW REST HOUR COMPLIANCE — MLC 2006 / STCW CHAPTER VIII", 10, y);
  doc.setLineWidth(0.3);
  doc.setDrawColor(186, 230, 253);
  doc.line(10, y + 2, PW - 10, y + 2);

  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Officer / Crew", "Rank", "Rest Hrs (24h)", "Required", "Compliance"]],
    body: CREW_REST_LOGS.map((c) => [c.name, c.rank, `${c.restHrs}h`, `≥ ${c.required}h`, c.status]),
    headStyles:   { fillColor: HEADER_BG, textColor: 255, fontSize: 8, fontStyle: "bold" },
    alternateRowStyles: { fillColor: ALT_ROW },
    bodyStyles:   { fontSize: 8, textColor: [51, 65, 85] },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 4) {
        data.cell.styles.textColor = statusColor(data.cell.text[0]);
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 10, right: 10 },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 3: Ballast Water Discharge Status
  // ─────────────────────────────────────────────────────────────────────────
  y = doc.lastAutoTable.finalY + 8;
  if (y > PH - 80) { doc.addPage(); doc.setFillColor(255,255,255); doc.rect(0,0,PW,PH,"F"); y = 15; }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(2, 132, 199);
  doc.text("3. BALLAST WATER DISCHARGE STATUS — BWM CONVENTION (D-2)", 10, y);
  doc.setLineWidth(0.3);
  doc.setDrawColor(186, 230, 253);
  doc.line(10, y + 2, PW - 10, y + 2);

  y += 6;
  const bw = BALLAST_STATUS;
  autoTable(doc, {
    startY: y,
    head: [["Parameter", "Detail", "Status"]],
    body: [
      ["Treatment System",    bw.system,         "APPROVED"],
      ["Standard Applied",    bw.standard,       "COMPLIANT"],
      ["Last BWMS Test",      bw.lastTest,       "PASS"],
      ["Next Survey Due",     bw.nextDue,        "SCHEDULED"],
      ["Discharge Port",      bw.dischargePort,  "AUTHORISED"],
      ["Volume Exchanged",    bw.volume,         "LOGGED"],
      ["Mid-Ocean Exchange",  bw.exchanged ? "Completed" : "N/A", bw.exchanged ? "OK" : "PENDING"],
    ],
    headStyles:   { fillColor: HEADER_BG, textColor: 255, fontSize: 8, fontStyle: "bold" },
    alternateRowStyles: { fillColor: ALT_ROW },
    bodyStyles:   { fontSize: 8, textColor: [51, 65, 85] },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 2) {
        data.cell.styles.textColor = statusColor(data.cell.text[0]);
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 10, right: 10 },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION 4: Port State Control Inspection
  // ─────────────────────────────────────────────────────────────────────────
  y = doc.lastAutoTable.finalY + 8;
  if (y > PH - 70) { doc.addPage(); doc.setFillColor(255,255,255); doc.rect(0,0,PW,PH,"F"); y = 15; }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(2, 132, 199);
  doc.text("4. PORT STATE CONTROL INSPECTION SUMMARY", 10, y);
  doc.setLineWidth(0.3);
  doc.setDrawColor(186, 230, 253);
  doc.line(10, y + 2, PW - 10, y + 2);

  y += 6;
  autoTable(doc, {
    startY: y,
    head: [["Inspection Area", "Items Checked", "Deficiencies", "Result"]],
    body: PSC_ITEMS.map((p) => [p.area, p.items, p.deficiencies, p.status]),
    headStyles:   { fillColor: HEADER_BG, textColor: 255, fontSize: 8, fontStyle: "bold" },
    alternateRowStyles: { fillColor: ALT_ROW },
    bodyStyles:   { fontSize: 8, textColor: [51, 65, 85] },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 3) {
        data.cell.styles.textColor = statusColor(data.cell.text[0]);
        data.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: 10, right: 10 },
  });

  // ── Signature block ──
  y = doc.lastAutoTable.finalY + 10;
  if (y > PH - 40) { doc.addPage(); doc.setFillColor(255,255,255); doc.rect(0,0,PW,PH,"F"); y = 15; }

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, y, PW - 20, 28, 3, 3, "F");
  doc.setDrawColor(...HEADER_BG);
  doc.setLineWidth(0.4);
  doc.roundedRect(10, y, PW - 20, 28, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(2, 132, 199);
  doc.text("CERTIFICATION", 15, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `This audit report was automatically generated by NAVI-STEEL AI on ${dateStr}. All data reflects the current operational`,
    15, y + 13
  );
  doc.text(
    "status of the vessel at time of generation. This document does not replace statutory certificates issued by the Flag State or",
    15, y + 18
  );
  doc.text(
    "Recognised Organisation. Reference: IMO MARPOL Annex VI, STCW Convention, BWM Convention, ISM Code, MLC 2006.",
    15, y + 23
  );

  // ── Footer on every page ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`NAVI-STEEL AI · IMO Audit Certificate · ${certNo} · Page ${p} of ${totalPages}`, PW / 2, PH - 8, { align: "center" });
  }

  doc.save(`IMO_Audit_${vessel.replace(/\s+/g, "_")}_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}.pdf`);
}

// ─── Status badge component ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    COMPLIANT: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PASS:      "bg-emerald-50 text-emerald-700 border-emerald-200",
    OK:        "bg-emerald-50 text-emerald-700 border-emerald-200",
    WARN:      "bg-amber-50   text-amber-700   border-amber-200",
    MINOR:     "bg-amber-50   text-amber-700   border-amber-200",
    FAIL:      "bg-rose-50    text-rose-700    border-rose-200",
    PENDING:   "bg-slate-50   text-slate-600   border-slate-200",
  };
  return (
    <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full border ${map[status] ?? map.PENDING}`}>
      {status}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IMOAuditReport({
  vessel       = "MV Navi Steel",
  originPort   = "Newcastle",
  destPort     = "Visakhapatnam",
  tonnage      = 75000,
  distanceNm   = 4820,
  cii          = null,
}) {
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState(false);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setGenerated(false);
    // Short artificial delay so the UI state is visible before the PDF triggers download
    setTimeout(() => {
      try {
        generatePDF({ vessel, originPort, destPort, tonnage, distanceNm, cii });
        setGenerated(true);
      } catch (err) {
        console.error("PDF generation error:", err);
      } finally {
        setGenerating(false);
      }
    }, 600);
  }, [vessel, originPort, destPort, tonnage, distanceNm, cii]);

  const activeCii = cii ?? DEFAULT_CII;

  return (
    <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-sky-100 bg-sky-50/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-100 rounded-xl">
            <FileText size={15} className="text-sky-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">IMO Audit Certificate Generator</h2>
            <p className="text-[11px] font-mono text-slate-400">
              jsPDF · CII Carbon Rating · STCW Rest Logs · Ballast Discharge
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-sky-300/30 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating
            ? <><RefreshCw size={13} className="animate-spin" /> Generating…</>
            : <><Download size={13} /> Export PDF</>
          }
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">

        {/* ── Voyage summary ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Ship,   label: "Vessel",    value: vessel,              color: "text-sky-600",     bg: "bg-sky-50 border-sky-200"    },
            { icon: Anchor, label: "Route",     value: `${originPort} → ${destPort}`, color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
            { icon: Gauge,  label: "Cargo",     value: `${tonnage.toLocaleString()} MT`, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
            { icon: Leaf,   label: "CII Rating", value: activeCii.rating,   color: activeCii.status === "COMPLIANT" ? "text-emerald-600" : "text-rose-600", bg: "bg-emerald-50 border-emerald-200" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className={`rounded-xl p-3 border ${bg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} className={color} />
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">{label}</span>
              </div>
              <p className={`text-xs font-black font-mono ${color} truncate`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Report sections preview ──────────────────────────────────────── */}
        <div className="space-y-2">
          {/* Section 1: CII */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 bg-sky-50/60 rounded-xl border border-sky-100">
            <Leaf size={14} className="text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-800">
                CII Carbon Intensity Indicator — {activeCii.year}
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                AER Score: <span className="text-emerald-700 font-bold">{activeCii.score} gCO₂/t·NM</span>
                {" "}· Limit: {activeCii.limit} · IMO MEPC.354(78)
              </p>
            </div>
            <StatusBadge status={activeCii.status} />
          </div>

          {/* Section 2: STCW Crew Rest */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 bg-sky-50/60 rounded-xl border border-sky-100">
            <Ship size={14} className="text-sky-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-800">
                STCW Rest Hour Compliance — {CREW_REST_LOGS.length} Officers/Crew
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                <span className="text-emerald-700 font-bold">{CREW_REST_LOGS.filter(c=>c.status==="OK").length} OK</span>
                {" "}·{" "}
                <span className="text-amber-600 font-bold">{CREW_REST_LOGS.filter(c=>c.status==="WARN").length} Warn</span>
                {" "}·{" "}
                <span className="text-rose-600 font-bold">{CREW_REST_LOGS.filter(c=>c.status==="FAIL").length} Fail</span>
                {" "}— STCW Chapter VIII / MLC 2006
              </p>
            </div>
            <StatusBadge status={CREW_REST_LOGS.some(c=>c.status==="FAIL") ? "FAIL" : "PASS"} />
          </div>

          {/* Section 3: Ballast */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 bg-sky-50/60 rounded-xl border border-sky-100">
            <CheckCircle2 size={14} className="text-violet-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-800">
                Ballast Water Discharge — BWM Convention D-2
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                {BALLAST_STATUS.system} · {BALLAST_STATUS.volume} exchanged
                {" "}· Port: {BALLAST_STATUS.dischargePort}
              </p>
            </div>
            <StatusBadge status={BALLAST_STATUS.testResult} />
          </div>

          {/* Section 4: PSC */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 bg-sky-50/60 rounded-xl border border-sky-100">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-800">
                Port State Control Inspection — {PSC_ITEMS.length} Areas
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                <span className="text-emerald-700 font-bold">{PSC_ITEMS.filter(p=>p.status==="PASS").length} Clear</span>
                {" "}·{" "}
                <span className="text-amber-600 font-bold">{PSC_ITEMS.filter(p=>p.status==="MINOR").length} Minor</span>
                {" "}deficiencies — SOLAS / MARPOL
              </p>
            </div>
            <StatusBadge status={PSC_ITEMS.some(p=>p.status==="FAIL") ? "FAIL" : "PASS"} />
          </div>
        </div>

        {/* ── Post-generation message ─────────────────────────────────────── */}
        {generated && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-mono text-emerald-800">
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span>
              PDF downloaded successfully — <strong>4-section IMO Audit Certificate</strong> with CII, STCW, Ballast & PSC data.
            </span>
          </div>
        )}

        {/* ── Footer note ─────────────────────────────────────────────────── */}
        <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
          Report generated via <span className="text-sky-600 font-bold">jsPDF + jspdf-autotable</span>.
          Covers IMO MARPOL Annex VI · BWM Convention · STCW Chapter VIII · MLC 2006 · ISM Code.
          Certificate number auto-generated per voyage.
        </p>
      </div>
    </div>
  );
}
