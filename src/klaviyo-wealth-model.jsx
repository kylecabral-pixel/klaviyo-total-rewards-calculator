import { useState, useMemo, useEffect, useRef, useLayoutEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

/* ─────────────────────────────────────────────────────────────────────────────
   KLAVIYO 2025 INTERIM BRAND TOKENS
   ───────────────────────────────────────────────────────────────────────────── */
const B = {
  poppy:     "#F96353",
  poppyDark: "#D94A3A",
  cotton:    "#FFFCF9",
  charcoal:  "#232121",
  stone:     "#23302C",
  eggplant:  "#744A6E",
  violet:    "#9176D1",
  lemon:     "#FCFC7E",
  pink:      "#F1C0F2",
  sky:       "#A6CFEB",
  orange:    "#FFA43E",
  border:    "#E8E4DF",
  mist:      "#F7F4F0",
  fog:       "#A09A95",
  slate:     "#5C5654",
};

/** Recruiter CTA on Total Rewards tab — edit for your team. */
const RECRUITER_CTA_CONFIG = {
  recruiterName: "Your Recruiting Team",
  recruiterEmail: "recruiting@klaviyo.com",
  /** Optional booking link (e.g. Calendly). Leave empty to hide the button. */
  calendarUrl: "",
};

const STOCK_SCENARIO_NOTES = {
  flat: "Stock price held flat — no modeled share price growth.",
  g1: "Illustrative rate — placeholder (e.g. conservative analyst-style estimate).",
  g2: "Illustrative rate — placeholder (e.g. based on Klaviyo’s historical growth since IPO; not a forecast).",
};

const BENEFIT_CATEGORIES_FINANCIAL_HEALTH = ["financial", "health"];
const BENEFIT_CATEGORIES_REST = ["protection", "timeoff", "lifestyle"];

/** Shown in a slim banner directly below the hero (fine print, high visibility). */
const TOP_ILLUSTRATIVE_DISCLAIMER =
  "This model is for illustrative purposes only and does not constitute an offer or guarantee of compensation. Stock projections are hypothetical. Refresh grants are discretionary. Final terms are in your offer letter.";

const LEGAL_DISCLAIMER = `The total compensation values presented in this tool are for illustrative and estimation purposes only. They are based on a set of assumptions and projections and do not constitute a promise, guarantee, or agreement of actual or future compensation.

All compensation components—base salary, bonus, and equity—are subject to change and may be influenced by various factors including company performance, individual performance, and future business needs.
 - Bonus: The bonus value shown represents a target amount only. Actual bonus payments are not guaranteed and will be determined based on company and individual performance, as well as other applicable factors.
 - Equity Compensation Value: The equity value provided is an estimate based on current assumptions, including projected future stock price. Equity awards are subject to vesting schedules and market conditions, and the future value of any equity compensation is inherently uncertain. There is no guarantee that the stock price will increase; it may decrease, resulting in lower realized value.
 - Equity Refresh Grants: Any projected equity refresh is for modeling purposes only and is contingent on performance and future grant decisions. There is no guarantee that a refresh grant will be awarded.

This tool is a modeling aid, not a compensation agreement. Your offer letter is the authoritative document. Final compensation details, including base salary, equity awards, and bonus eligibility, will be outlined in a formal offer letter or applicable agreement, if extended.

Nothing in this tool creates an employment contract or guarantees employment for any period.`;

const BONUS_TARGET_FOOTNOTE =
  "*Actual bonus determined by company and individual performance.";

const GOOGLE_FONT = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital,wght@0,400;0,500;0,600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: ${B.cotton}; }
input[type=range] { -webkit-appearance: none; appearance: none; }
input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; }
.k-input:focus { outline: none; border-color: ${B.charcoal} !important; box-shadow: 0 0 0 3px rgba(35,33,33,0.08); }
@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
.animate-in { animation: fadeUp 0.35s ease forwards; }
`;

/* ─── Regions & currency ────────────────────────────────────────────────────── */
const REGIONS = {
  US: { label: "United States", flag: "🇺🇸", currency: "USD", sym: "$",  locale: "en-US" },
  UK: { label: "United Kingdom", flag: "🇬🇧", currency: "GBP", sym: "£",  locale: "en-GB" },
  EU: { label: "Europe",         flag: "🇪🇺", currency: "EUR", sym: "€",  locale: "de-DE" },
  CA: { label: "Canada",         flag: "🇨🇦", currency: "CAD", sym: "C$", locale: "en-CA" },
  AU: { label: "Australia",      flag: "🇦🇺", currency: "AUD", sym: "A$", locale: "en-AU" },
};

/** Units of local currency per 1 USD (Frankfurter/ECB shape). Fallbacks until fetch succeeds. */
const DEFAULT_FX_FROM_USD = {
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.38,
  AUD: 1.56,
}

const FRANKFURTER_LATEST =
  "https://api.frankfurter.app/latest?from=USD&to=GBP,EUR,CAD,AUD";

const REGIONAL_BENEFITS = {
  US: null,
  UK: {
    note: "Benefits reflect Klaviyo's global programs. In the UK, statutory benefits (NHS, National Insurance, statutory parental leave) apply alongside Klaviyo's supplemental offerings. Pension contributions replace the US 401(k).",
    highlights: [
      { icon: "🏥", title: "NHS + Private Health",       body: "UK employees have access to the NHS. Klaviyo provides private medical insurance on top of statutory coverage." },
      { icon: "🏦", title: "Pension Contribution",       body: "Klaviyo contributes to your workplace pension per UK auto-enrolment requirements, plus additional employer contributions." },
      { icon: "👶", title: "Enhanced Parental Leave",    body: "Up to 22 weeks fully paid for birthing parents, 16 weeks for non-birthing. Exceeds UK statutory maternity/paternity pay." },
      { icon: "📈", title: "ESPP",                       body: "Purchase Klaviyo stock at a 15% discount via payroll deductions." },
      { icon: "✨", title: "K-Flex LSA + K-Pro Learn",  body: "£1,000 lifestyle stipend and £2,500 annual learning budget (or local currency equivalent)." },
      { icon: "🌴", title: "Flexible PTO",               body: "Unlimited flexible PTO. Klaviyo encourages 4+ weeks per year. Plus 11 paid holidays and 2 Recharge Days." },
      { icon: "🧠", title: "Modern Health",              body: "8 therapy + 8 coaching sessions per year at no cost. Household members included." },
      { icon: "🌍", title: "Global Sabbatical",          body: "4 weeks fully paid after 5 years of continuous service." },
    ],
  },
  EU: {
    note: "Benefits reflect Klaviyo's global programs. In Europe, statutory benefits vary by country and are provided alongside Klaviyo's supplemental offerings. Klaviyo complies with all local statutory requirements.",
    highlights: [
      { icon: "🏥", title: "Statutory Healthcare",       body: "Healthcare is provided via your country's statutory system. Klaviyo provides supplemental coverage where applicable." },
      { icon: "🏦", title: "Local Pension / Retirement", body: "Klaviyo contributes to local pension schemes in accordance with country-specific regulations." },
      { icon: "👶", title: "Enhanced Parental Leave",    body: "Up to 22 weeks fully paid for birthing parents. Exceeds statutory minimums across all EU jurisdictions." },
      { icon: "📈", title: "ESPP",                       body: "Purchase Klaviyo stock at a 15% discount via payroll deductions." },
      { icon: "✨", title: "K-Flex LSA + K-Pro Learn",  body: "€1,000 lifestyle stipend and €2,500 annual learning budget (or local currency equivalent)." },
      { icon: "🌴", title: "Flexible PTO",               body: "Unlimited flexible PTO. Klaviyo encourages 4+ weeks per year plus local statutory holidays." },
      { icon: "🧠", title: "Modern Health",              body: "8 therapy + 8 coaching sessions per year at no cost. Household members included." },
      { icon: "🌍", title: "Global Sabbatical",          body: "4 weeks fully paid after 5 years of continuous service." },
    ],
  },
  CA: {
    note: "Benefits reflect Klaviyo's global programs. In Canada, provincial healthcare and statutory leave programs apply. Klaviyo provides supplemental benefits on top of statutory requirements.",
    highlights: [
      { icon: "🏥", title: "Provincial Healthcare + Extended", body: "Provincial health plans cover core medical. Klaviyo provides extended health, dental, and vision benefits." },
      { icon: "🏦", title: "RRSP Matching",              body: "Klaviyo matches RRSP contributions to help you invest in your retirement, with 100% immediate vesting." },
      { icon: "👶", title: "Enhanced Parental Leave",    body: "Up to 22 weeks fully paid for birthing parents. Supplements EI parental benefits." },
      { icon: "📈", title: "ESPP",                       body: "Purchase Klaviyo stock at a 15% discount via payroll deductions." },
      { icon: "✨", title: "K-Flex LSA + K-Pro Learn",  body: "C$1,000 lifestyle stipend and C$2,500 annual learning budget." },
      { icon: "🌴", title: "Flexible PTO",               body: "Unlimited flexible PTO. Klaviyo encourages 4+ weeks per year plus statutory Canadian holidays." },
      { icon: "🧠", title: "Modern Health",              body: "8 therapy + 8 coaching sessions per year at no cost. Household members included." },
      { icon: "🌍", title: "Global Sabbatical",          body: "4 weeks fully paid after 5 years of continuous service." },
    ],
  },
  AU: {
    note: "Benefits reflect Klaviyo's global programs. In Australia, Medicare and statutory superannuation apply. Klaviyo contributes above the statutory superannuation guarantee.",
    highlights: [
      { icon: "🏥", title: "Medicare + Private Health",  body: "Medicare covers core healthcare. Klaviyo provides private health insurance contributions on top of statutory coverage." },
      { icon: "🏦", title: "Superannuation",             body: "Klaviyo contributes above the statutory Superannuation Guarantee rate to support your long-term financial well-being." },
      { icon: "👶", title: "Enhanced Parental Leave",    body: "Up to 22 weeks fully paid for birthing parents, 16 weeks for non-birthing — exceeds statutory paid parental leave." },
      { icon: "📈", title: "ESPP",                       body: "Purchase Klaviyo stock at a 15% discount via payroll deductions." },
      { icon: "✨", title: "K-Flex LSA + K-Pro Learn",  body: "A$1,000 lifestyle stipend and A$2,500 annual learning budget." },
      { icon: "🌴", title: "Flexible PTO",               body: "Unlimited flexible PTO. Klaviyo encourages 4+ weeks per year plus Australian public holidays." },
      { icon: "🧠", title: "Modern Health",              body: "8 therapy + 8 coaching sessions per year at no cost. Household members included." },
      { icon: "🌍", title: "Global Sabbatical",          body: "4 weeks fully paid after 5 years of continuous service." },
    ],
  },
};

/* ─── Formatters ────────────────────────────────────────────────────────────── */
const fmtMoney = (v, sym = "$") => {
  if (!v || v === 0) return "—";
  if (Math.abs(v) >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(2)}M`;
  return `${sym}${Math.round(v).toLocaleString()}`;
};
const fmt$ = (v) => fmtMoney(v, "$");
const fmtPct   = (v) => `${(v * 100).toFixed(0)}%`;
const fmtDate  = (d) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
const addMonths = (d, m) => { const r = new Date(d); r.setMonth(r.getMonth() + m); return r; };
/* ─── Vesting logic ─────────────────────────────────────────────────────────── */
function grantDateToVestStart(grantDate) {
  const yr = grantDate.getFullYear();
  const checkpoints = [
    new Date(yr, 1, 15), new Date(yr, 4, 15),
    new Date(yr, 7, 15), new Date(yr, 10, 15),
    new Date(yr + 1, 1, 15),
  ];
  for (const cp of checkpoints) if (grantDate <= cp) return cp;
  return checkpoints[4];
}
/** 12-mo cliff, then 25% + quarterly over 12 quarters (matches Wealth Creation Model template). */
function computeNewHireVesting(units, grantDate) {
  const firstVest = grantDateToVestStart(grantDate);
  const cliff     = addMonths(firstVest, 12);
  const vbd       = {};
  vbd[cliff.toISOString()] = units / 4;
  for (let i = 1; i <= 12; i++) {
    const d = addMonths(cliff, i * 3);
    vbd[d.toISOString()] = (vbd[d.toISOString()] || 0) + units / 16;
  }
  return vbd;
}

/** First May 15 on or after grant — refresh RSUs vest on a May-anchored schedule (not Feb/May/Aug/Nov from hire). */
function refreshGrantFirstVestDate(grantDate) {
  const y = grantDate.getFullYear();
  const mayThis = new Date(y, 4, 15);
  if (grantDate <= mayThis) return mayThis;
  return new Date(y + 1, 4, 15);
}

/** Same 12-mo cliff + 25% + quarterly /16 as new hire, but first checkpoint = next May 15 (see `refreshGrantFirstVestDate`). */
function computeRefreshVesting(units, grantDate) {
  const firstVest = refreshGrantFirstVestDate(grantDate);
  const cliff = addMonths(firstVest, 12);
  const vbd = {};
  vbd[cliff.toISOString()] = units / 4;
  for (let i = 1; i <= 12; i++) {
    const d = addMonths(cliff, i * 3);
    vbd[d.toISOString()] = (vbd[d.toISOString()] || 0) + units / 16;
  }
  return vbd;
}

/** Jun–May equity years (UTC) — matches Wealth Creation Model date headers; avoids local TZ shifting May 31. */
function endOfMayUtc(year) {
  return new Date(Date.UTC(year, 4, 31, 23, 59, 59, 999));
}
function startOfJuneUtc(year) {
  return new Date(Date.UTC(year, 5, 1, 0, 0, 0, 0));
}

/** Four Jun–May windows; year 1 ends May of the calendar year of the first cliff vest. */
function equityYearWindows(startDate) {
  const nhGrant = grantDateToVestStart(startDate);
  const cliffDate = addMonths(nhGrant, 12);
  const cliffY = cliffDate.getUTCFullYear();
  return [
    { start: new Date(0), end: endOfMayUtc(cliffY) },
    { start: startOfJuneUtc(cliffY), end: endOfMayUtc(cliffY + 1) },
    { start: startOfJuneUtc(cliffY + 1), end: endOfMayUtc(cliffY + 2) },
    { start: startOfJuneUtc(cliffY + 2), end: endOfMayUtc(cliffY + 3) },
  ];
}

function unitsInWindow(vbd, start, end) {
  let t = 0;
  for (const [ds, u] of Object.entries(vbd)) {
    const d = new Date(ds);
    if (d > start && d <= end) t += u;
  }
  return t;
}

/** Vesting years = Jun–May; NH cliff = 12 mo from NH grant checkpoint; refresh = May-15 first checkpoint then same cliff/quarterly as NH (no synthetic tranche-to-year mapping). */
function computeModel({ startDate, salary, bonusPct, newHireGrant, annualRefresh, currentPrice, growth1, growth2, signOn }) {
  const oct2026  = new Date(2026, 9, 1);
  const mar2027  = new Date(2027, 2, 1);
  const nhGrant  = grantDateToVestStart(startDate);
  const nhUnits  = newHireGrant / currentPrice;
  const y1Prora  = startDate >= oct2026 ? 0
    : startDate < new Date(2025, 2, 1) ? 1
    : Math.max(0, Math.min(1, (mar2027 - startDate) / (365 * 86400000)));
  const refreshGrants = [
    { label: "Annual Refresh — Year 1", grantDate: new Date(2027, 1, 15), value: annualRefresh * y1Prora },
    { label: "Annual Refresh — Year 2", grantDate: new Date(2028, 1, 15), value: annualRefresh },
    { label: "Annual Refresh — Year 3", grantDate: new Date(2029, 1, 15), value: annualRefresh },
    { label: "Annual Refresh — Year 4", grantDate: new Date(2030, 1, 15), value: annualRefresh },
  ];
  const p1 = [1,2,3,4].map(yr => currentPrice * Math.pow(1+growth1, yr));
  const p2 = [1,2,3,4].map(yr => currentPrice * Math.pow(1+growth2, yr));
  const nhV = computeNewHireVesting(nhUnits, nhGrant);
  const eqWin = equityYearWindows(startDate);
  const rfV = refreshGrants.map((rg) => {
    const units = rg.value / currentPrice;
    return { ...rg, units, vbd: rg.value > 0 ? computeRefreshVesting(units, rg.grantDate) : {} };
  });
  const years = [1,2,3,4].map(yr => {
    const wi = yr - 1;
    const { start, end } = eqWin[wi];
    const nhU = unitsInWindow(nhV, start, end);
    const rfU = rfV.reduce((s, rv) => s + unitsInWindow(rv.vbd, start, end), 0);
    const total = nhU + rfU;
    const px1 = p1[yr - 1];
    const px2 = p2[yr - 1];
    const eqF_nh = nhU * currentPrice;
    const eqF_rf = rfU * currentPrice;
    const eqG1_nh = nhU * px1;
    const eqG1_rf = rfU * px1;
    const eqG2_nh = nhU * px2;
    const eqG2_rf = rfU * px2;
    const eqF = eqF_nh + eqF_rf;
    const eqG1 = eqG1_nh + eqG1_rf;
    const eqG2 = eqG2_nh + eqG2_rf;
    const bonus = startDate >= oct2026 ? 0
      : yr === 1 ? Math.max(0, (new Date(2027,0,1)-startDate)/(365*86400000)) * bonusPct * salary
      : bonusPct * salary;
    const sOn = yr===1 && startDate >= new Date(2026,0,1) ? signOn : 0;
    return {
      yr,
      total,
      eqF,
      eqG1,
      eqG2,
      eqF_nh,
      eqF_rf,
      eqG1_nh,
      eqG1_rf,
      eqG2_nh,
      eqG2_rf,
      salary,
      bonus,
      sOn,
      tdcF: salary + eqF + bonus + sOn,
      tdcG1: salary + eqG1 + bonus + sOn,
      tdcG2: salary + eqG2 + bonus + sOn,
    };
  });
  return { years, p1, p2, nhGrant, refreshGrants };
}

/* ─── Benefits data ─────────────────────────────────────────────────────────── */
const BENEFIT_CATEGORIES = [
  {
    id: "financial",
    label: "Financial",
    color: B.violet,
    icon: "💰",
    benefits: [
      { id: "401k",    label: "401(k) Match",              desc: "4% employer match, 100% immediately vested. Your retirement savings are yours from day one.",    dynamic: (s) => s * 0.04,  note: "Based on your salary" },
      { id: "espp",    label: "ESPP",                       desc: "Purchase Klaviyo stock at a 15% discount via payroll deductions. Invest in the company you're building.", value: null, note: "15% discount on stock purchases" },
      { id: "hsa",     label: "HSA Employer Contribution",  desc: "Klaviyo contributes to your HSA when you elect the HDHP plan.", dynamicCoverage: { individual: 1000, family: 2000 }, note: "HDHP plan only" },
    ],
  },
  {
    id: "health",
    label: "Health",
    color: B.sky,
    icon: "🏥",
    benefits: [
      { id: "medical",  label: "Medical",       desc: "3 BCBS plan options including PPO, HDHP (HSA-eligible), and HMO. Preventive care 100% covered.", value: null, note: "Klaviyo subsidizes the majority of your premium" },
      { id: "dental",   label: "Dental",        desc: "$1,500 annual max. 100% preventive, 80% basic, 50% major. Orthodontia up to $1,500 lifetime.", value: null, note: "$4.68 bi-weekly employee cost" },
      { id: "vision",   label: "Vision",        desc: "EyeMed: 100% exam coverage, $200 frame allowance, $150 contact lens allowance.", value: null, note: "$0.81 bi-weekly employee cost" },
      { id: "mhealth",  label: "Modern Health", desc: "8 therapy + 8 coaching sessions per year at no cost. Household members included.", value: null, note: "~$2,400 retail value" },
    ],
  },
  {
    id: "protection",
    label: "Protection",
    color: B.eggplant,
    icon: "🛡️",
    benefits: [
      { id: "life",  label: "Life & AD&D Insurance", desc: "1x annual salary up to $500K. Klaviyo pays 100% of premiums.", dynamic: (s) => s * 0.005, note: "Estimated premium value" },
      { id: "std",   label: "Short-Term Disability", desc: "60% of weekly earnings up to $2,500/week for up to 26 weeks. 100% employer paid.", dynamic: (s) => s * 0.006, note: "Estimated premium value" },
      { id: "ltd",   label: "Long-Term Disability",  desc: "60% of monthly earnings up to $12,500/month. 100% employer paid.", dynamic: (s) => s * 0.008, note: "Estimated premium value" },
    ],
  },
  {
    id: "timeoff",
    label: "Time Off",
    color: B.orange,
    icon: "🌴",
    benefits: [
      { id: "fpto",       label: "Flexible PTO",      desc: "Unlimited flexible PTO. Klaviyo encourages 4+ weeks per year.", value: null, note: "Unlimited" },
      { id: "holidays",   label: "Paid Holidays",     desc: "11 paid holidays + 2 Recharge Days annually.", value: null, note: "13 days/year" },
      { id: "parental",   label: "Parental Leave",    desc: "22 weeks fully paid for birthing parents. 16 weeks for non-birthing parents.", value: null, note: "Up to 22 weeks paid" },
      { id: "sabbatical", label: "Global Sabbatical", desc: "4 weeks of fully paid sabbatical after 5 years of continuous service.", value: null, note: "After 5 years · not included in estimated annual value (year 5+)" },
    ],
  },
  {
    id: "lifestyle",
    label: "Lifestyle & Perks",
    color: B.poppy,
    icon: "✨",
    benefits: [
      { id: "lsa",      label: "K-Flex LSA",        desc: "$250/quarter lifestyle spending account for wellness, fitness, personal growth.", value: 1000, note: "$1,000/year" },
      { id: "kpro",     label: "K-Pro Learn",       desc: "Up to $2,500/year reimbursement for professional learning and development.", value: 2500, note: "$2,500/year" },
      { id: "commuter", label: "Commuter Benefits", desc: "Up to $300/month tax-free for eligible transit and parking expenses.", value: 3600, note: "Up to $3,600/year" },
      { id: "rethink",  label: "RethinkCare",       desc: "325+ courses and 9,000+ sessions for well-being, parenting, and neurodiversity.", value: null, note: "Included" },
      { id: "libby",    label: "Libby Library",     desc: "Unlimited ebooks, audiobooks, and magazines via the Libby app.", value: null, note: "Included" },
    ],
  },
];

/** Candidate elections for US benefits modeling (illustrative $ — not payroll quotes). */
const DEFAULT_BENEFIT_ELECTIONS = {
  medicalPlan: "ppo",
  enrollDental: true,
  enrollVision: true,
  retirement401kParticipate: true,
  /** full_match = defer ≥4%; half_match = partial; none = $0 match */
  retirementDeferral: "full_match",
  esppParticipate: true,
  hsaTakeEmployerContribution: true,
  modernHealth: true,
  coreInsurance: true,
  lsa: true,
  kpro: true,
  commuter: true,
};

/** Estimated annual employer premium / subsidy share by medical tier (modeling only). */
const MEDICAL_EMPLOYER_SUBSIDY = {
  individual: { waive: 0, ppo: 9800, hdhp: 6400, hmo: 9200 },
  family: { waive: 0, ppo: 19200, hdhp: 12600, hmo: 18000 },
};

const DENTAL_EMPLOYER = { individual: 1100, family: 2600 };
const VISION_EMPLOYER = { individual: 150, family: 280 };

function compute401kMatch(salary, e) {
  if (!e.retirement401kParticipate) return 0;
  if (e.retirementDeferral === "full_match") return salary * 0.04;
  if (e.retirementDeferral === "half_match") return salary * 0.02;
  return 0;
}

/** Rough ESPP economic benefit: participation × discount on eligible purchase (model). */
function computeEsppEstimate(salary, participate) {
  if (!participate) return 0;
  const eligible = Math.min(salary * 0.15, 25000);
  return Math.round(eligible * 0.15 * 0.5);
}

function computeBenefitsValue(salary, coverageType, e = DEFAULT_BENEFIT_ELECTIONS) {
  const fam = coverageType === "family" ? "family" : "individual";
  const mp = e.medicalPlan in MEDICAL_EMPLOYER_SUBSIDY[fam] ? e.medicalPlan : "ppo";
  const medicalSubsidy = MEDICAL_EMPLOYER_SUBSIDY[fam][mp] ?? 0;
  const dentalSubsidy = e.enrollDental ? DENTAL_EMPLOYER[fam] : 0;
  const visionSubsidy = e.enrollVision ? VISION_EMPLOYER[fam] : 0;
  const match401k = compute401kMatch(salary, e);
  const hsa =
    mp === "hdhp" && e.hsaTakeEmployerContribution
      ? fam === "family"
        ? 2000
        : 1000
      : 0;
  const esppEst = computeEsppEstimate(salary, e.esppParticipate);
  const modernVal = e.modernHealth ? 2400 : 0;
  const protection = e.coreInsurance ? salary * (0.005 + 0.006 + 0.008) : 0;
  const lsa = e.lsa ? 1000 : 0;
  const kpro = e.kpro ? 2500 : 0;
  const commuter = e.commuter ? 3600 : 0;
  /** Global Sabbatical is intentionally omitted (eligibility year 5+; not an annual run-rate). */
  const quantifiable =
    medicalSubsidy +
    dentalSubsidy +
    visionSubsidy +
    match401k +
    hsa +
    esppEst +
    modernVal +
    protection +
    lsa +
    kpro +
    commuter;
  const summaryLines = [
    ["Medical (est. employer share)", medicalSubsidy],
    ["Dental", dentalSubsidy],
    ["Vision", visionSubsidy],
    ["401(k) match (modeled)", match401k],
    ["HSA employer (HDHP)", hsa],
    ["ESPP (est. value)", esppEst],
    ["Modern Health (est.)", modernVal],
    ["Life / STD / LTD (est.)", protection],
    ["K-Flex LSA", lsa],
    ["K-Pro Learn", kpro],
    ["Commuter", commuter],
  ];
  return {
    medicalSubsidy,
    dentalSubsidy,
    visionSubsidy,
    match401k,
    hsa,
    esppEst,
    modernHealthVal: modernVal,
    protection,
    lsa,
    kpro,
    commuter,
    quantifiable,
    summaryLines,
  };
}

/* ─── Shared UI primitives ──────────────────────────────────────────────────── */
const Label = ({ children, light }) => (
  <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:light?"rgba(255,255,255,0.45)":B.fog, marginBottom:5 }}>
    {children}
  </div>
);

function KInput({ label, value, onChange, type="number", prefix, suffix, min, max, step, hint, readOnly }) {
  const [f, setF] = useState(false);
  const ro = !!readOnly;
  return (
    <div style={{ marginBottom:13 }}>
      <Label>{label}</Label>
      <div style={{ display:"flex", alignItems:"center", background:ro?B.mist:"#fff", border:`1.5px solid ${f&&!ro?B.charcoal:B.border}`, borderRadius:6, overflow:"hidden", transition:"all 0.15s", boxShadow:f&&!ro?"0 0 0 3px rgba(35,33,33,0.07)":"none" }}>
        {prefix && <span style={{ padding:"0 10px", fontSize:12, color:B.fog, borderRight:`1px solid ${B.border}`, background:ro?B.mist:B.mist, fontFamily:"'IBM Plex Mono',monospace", lineHeight:"36px", whiteSpace:"nowrap" }}>{prefix}</span>}
        <input type={type} value={value} min={min} max={max} step={step} className="k-input" readOnly={ro}
          onFocus={()=>!ro&&setF(true)} onBlur={()=>setF(false)}
          onChange={e=>{
            if (ro) return;
            onChange(type==="number"?parseFloat(e.target.value)||0:e.target.value);
          }}
          style={{ flex:1, border:"none", outline:"none", padding:"0 10px", height:36, fontSize:13, fontFamily:"'IBM Plex Mono',monospace", background:"transparent", color:B.charcoal, width:"100%", cursor:ro?"default":"text" }}
        />
        {suffix && <span style={{ padding:"0 10px", fontSize:12, color:B.fog, borderLeft:`1px solid ${B.border}`, background:B.mist, fontFamily:"'IBM Plex Mono',monospace", lineHeight:"36px" }}>{suffix}</span>}
      </div>
      {hint && <div style={{ fontSize:10, color:B.fog, marginTop:3, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif" }}>{hint}</div>}
    </div>
  );
}

const Divider = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, margin:"18px 0 14px" }}>
    <span style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:10, fontWeight:800, color:B.slate, textTransform:"uppercase", letterSpacing:"0.1em", whiteSpace:"nowrap" }}>{label}</span>
    <div style={{ flex:1, height:1, background:B.border }} />
  </div>
);

/**
 * Wordmark + swallowtail flag on the “o” (Klaviyo primary logo treatment).
 * Serif: Instrument Serif as open high-contrast stand-in for brand serif; swap if marketing provides a font file.
 */
const KlaviyoWordmark = ({ color = "#fff", fontSize = 19 }) => (
  <span
    role="img"
    aria-label="Klaviyo"
    style={{
      display: "inline-flex",
      alignItems: "baseline",
      color,
      fontFamily: "'Instrument Serif', Georgia, 'Times New Roman', serif",
      fontSize,
      fontWeight: 500,
      letterSpacing: "-0.03em",
      lineHeight: 1,
      textTransform: "lowercase",
    }}
  >
    klaviy
    <span style={{ position: "relative", display: "inline-block" }}>
      o
      <svg
        aria-hidden
        viewBox="0 0 12 8"
        fill="none"
        style={{
          position: "absolute",
          left: "72%",
          bottom: "0.68em",
          width: "0.58em",
          height: "0.36em",
          display: "block",
        }}
      >
        {/* Horizontal flag, swallowtail / V point on the right */}
        <path
          fill={color}
          d="M0 1.25h7.35L11.25 4 7.35 6.75H0V1.25z"
        />
      </svg>
    </span>
  </span>
);

const Badge = ({ children, color, large }) => (
  <span
    style={{
      display: "inline-block",
      background: color || B.poppy,
      color: "#fff",
      fontSize: large ? 11 : 9,
      fontWeight: 800,
      letterSpacing: large ? "0.11em" : "0.1em",
      textTransform: "uppercase",
      padding: large ? "4px 10px" : "2px 7px",
      borderRadius: large ? 4 : 3,
      fontFamily: "'Instrument Sans',sans-serif",
    }}
  >
    {children}
  </span>
);

/** Line-level tooltip for year card rows — dark pill beside the row (flips left if viewport is tight). */
const LineTooltipRow = ({ tip, children }) => {
  const [show, setShow] = useState(false);
  const [placeLeft, setPlaceLeft] = useState(false);
  const wrapRef = useRef(null);
  const tipRef = useRef(null);

  // Measure tooltip width after mount to choose left vs right; sync update avoids flicker.
  useLayoutEffect(() => {
    if (!show || !wrapRef.current || !tipRef.current) return;
    const margin = 8;
    const tipEl = tipRef.current;
    const row = wrapRef.current.getBoundingClientRect();
    const tipW = tipEl.offsetWidth;
    const spaceRight = window.innerWidth - row.right - margin;
    const spaceLeft = row.left - margin;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- layout measurement after tooltip DOM exists
    setPlaceLeft(tipW > spaceRight && spaceLeft >= spaceRight);
  }, [show, tip]);

  return (
    <div
      ref={wrapRef}
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
        width: "100%",
        cursor: "pointer",
        transition: "opacity 0.12s ease",
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && tip && (
        <div
          ref={tipRef}
          role="tooltip"
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            ...(placeLeft
              ? { right: "100%", marginRight: 8, left: "auto" }
              : { left: "100%", marginLeft: 8, right: "auto" }),
            zIndex: 30,
            maxWidth: 280,
            padding: "8px 10px",
            background: B.charcoal,
            color: "#fff",
            fontSize: 10,
            lineHeight: 1.35,
            borderRadius: 8,
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
            fontFamily: "'Instrument Sans',sans-serif",
            pointerEvents: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            textAlign: "left",
          }}
        >
          {tip}
        </div>
      )}
    </div>
  );
};

/* ─── Year card ─────────────────────────────────────────────────────────────── */
const YearCard = ({ data, scenario, growth1, growth2, currentPrice, active, onSelect, fmtC = fmt$, sym, fxMult }) => {
  const eqNh = scenario==="flat"?data.eqF_nh:scenario==="g1"?data.eqG1_nh:data.eqG2_nh;
  const eqRf = scenario==="flat"?data.eqF_rf:scenario==="g1"?data.eqG1_rf:data.eqG2_rf;
  const eq  = eqNh + eqRf;
  const tdc = scenario==="flat"?data.tdcF:scenario==="g1"?data.tdcG1:data.tdcG2;
  const px  = scenario==="flat"?currentPrice:scenario==="g1"?currentPrice*Math.pow(1+growth1,data.yr):currentPrice*Math.pow(1+growth2,data.yr);
  const eqShare = tdc>0?Math.min(1,eq/tdc):0;
  const nhRsus = px > 0 ? Math.round(eqNh / px) : 0;
  const nhTip = `${nhRsus.toLocaleString()} RSUs × ${sym}${(px * (fxMult ?? 1)).toFixed(2)} projected stock price`;
  const rows = [
    { l:"Salary", v:fmtC(data.salary), hi:false, tip: "Annual base salary" },
    { l:"Bonus*",  v:fmtC(data.bonus),  hi:false, dim:!data.bonus, tip: "On-target bonus · determined by company and individual performance" },
    ...(data.sOn?[{ l:"Sign-On", v:fmtC(data.sOn), hi:true, valColor:B.poppy, tip: "One-time sign-on bonus · Year 1 only" }]:[]),
    { l:"NH Grant", v:fmtC(eqNh), hi:true, valColor:B.poppy, tip: nhTip },
    { l:"Refresh", v:fmtC(eqRf), hi:true, valColor:B.eggplant, dim:!eqRf, tip: "Performance-based annual refresh grant · not guaranteed" },
  ];
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{
        flex: "1 1 148px",
        minWidth: 140,
        background: active ? B.charcoal : "#fff",
        border: `1.5px solid ${active ? B.charcoal : B.border}`,
        borderRadius: 10,
        padding: "16px 15px 14px",
        position: "relative",
        overflow: "visible",
        transition: "background 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease",
        cursor: "pointer",
        boxShadow: active ? "0 4px 14px rgba(35,33,33,0.12)" : "none",
      }}
    >
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:active?B.poppy:B.border, transition:"background 0.12s ease" }} />
      <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:10, fontWeight:800, color:active?"rgba(255,255,255,0.4)":B.fog, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:11, marginTop:4, transition:"color 0.12s ease" }}>Year {data.yr}</div>
      {rows.map(r=>(
        <LineTooltipRow key={r.l} tip={r.tip}>
          <span style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:11, color:active?(r.dim?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.55)"):(r.dim?B.fog:B.slate), transition:"color 0.12s ease" }}>{r.l}</span>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:600, color:r.hi?(r.valColor||B.poppy):active?"rgba(255,255,255,0.8)":B.charcoal, transition:"color 0.12s ease" }}>{r.v}</span>
        </LineTooltipRow>
      ))}
      <div style={{ height:2, background:active?"rgba(255,255,255,0.1)":B.border, borderRadius:1, margin:"10px 0", display:"flex", overflow:"hidden", transition:"all 0.5s ease" }}>
        {eqShare > 0 && (
          <>
            {eqNh > 0 && <div style={{ flexGrow: eqNh, flexBasis: 0, minWidth: 1, height:"100%", background: B.poppy }} />}
            {eqRf > 0 && <div style={{ flexGrow: eqRf, flexBasis: 0, minWidth: 1, height:"100%", background: B.eggplant }} />}
          </>
        )}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
        <span style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:active?"rgba(255,255,255,0.35)":B.fog, transition:"color 0.12s ease" }}>Total</span>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:16, fontWeight:700, color:active?"#fff":B.charcoal, letterSpacing:"-0.03em", transition:"color 0.12s ease" }}>{fmtC(tdc)}</span>
      </div>
      {data.total>0&&<div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:9, color:active?"rgba(255,255,255,0.25)":B.fog, marginTop:2, textAlign:"right", transition:"color 0.12s ease" }}>{Math.round(data.total).toLocaleString()} RSUs @ {sym}{(px * (fxMult ?? 1)).toFixed(2)}</div>}
    </div>
  );
};

/* ─── Chart tooltip ─────────────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label, fmtC = fmt$ }) => {
  if (!active||!payload?.length) return null;
  const total = payload.reduce((s,p)=>s+p.value,0);
  return (
    <div style={{ background:B.charcoal, borderRadius:8, padding:"12px 16px", fontSize:12, fontFamily:"'Instrument Sans',sans-serif", color:"#fff", boxShadow:"0 8px 32px rgba(0,0,0,0.25)", minWidth:190 }}>
      <div style={{ fontWeight:800, marginBottom:8, color:B.poppy, fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase" }}>{label}</div>
      {payload.map(p=>(
        <div key={p.name} style={{ display:"flex", justifyContent:"space-between", gap:16, marginBottom:3 }}>
          <span style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>{p.name}</span>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:600 }}>{fmtC(p.value)}</span>
        </div>
      ))}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", marginTop:8, paddingTop:8, display:"flex", justifyContent:"space-between" }}>
        <span style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>Total</span>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontWeight:800, color:B.poppy }}>{fmtC(total)}</span>
      </div>
    </div>
  );
};

/* ─── Benefit card ──────────────────────────────────────────────────────────── */
const BenefitCard = ({ benefit, salary, coverageType, accentColor, fmtC = fmt$ }) => {
  let displayValue = null;
  if (benefit.value) displayValue = fmtC(benefit.value);
  else if (benefit.dynamic) displayValue = fmtC(benefit.dynamic(salary));
  else if (benefit.dynamicCoverage) displayValue = fmtC(benefit.dynamicCoverage[coverageType]);

  return (
    <div style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:8, padding:"12px 14px", display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
        <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:12, fontWeight:700, color:B.charcoal, lineHeight:1.3 }}>{benefit.label}</div>
        {displayValue && (
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:700, color:accentColor||B.poppy, whiteSpace:"nowrap" }}>{displayValue}</div>
        )}
      </div>
      <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:11, color:B.slate, lineHeight:1.5 }}>{benefit.desc}</div>
      <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:10, color:B.fog, marginTop:2 }}>{benefit.note}</div>
    </div>
  );
};

/** Default scenario inputs (edit here or in the sidebar). No offer API. */
const DEFAULT_INPUTS = {
  name: "Kyle Cabral",
  role: "Director of Software Engineering — L5",
  startDate: "2026-04-01",
  salary: 305000,
  bonusPct: 0.2,
  signOn: 10000,
  newHireGrant: 750000,
  annualRefresh: 250000,
  relo: 0,
};

/** Shared demo links (?offer=…) use these tokens: sidebar stays editable like playground mode. */
const DEMO_OFFER_TOKENS = new Set(['klaviyo-hackathon-demo-offer-token']);

/**
 * When GET /api/offer is missing (e.g. static-only deploy) or returns non-JSON, we still
 * hydrate the demo link from this payload. Keep in sync with server/data/offers.json.
 */
const DEMO_OFFER_FALLBACK = {
  ok: true,
  name: 'Kyle Cabral',
  role: 'Director of Software Engineering — L5',
  startDate: '2026-04-01',
  region: 'US',
  coverageType: 'individual',
  salary: 305000,
  bonusPct: 0.2,
  signOn: 10000,
  relo: 0,
  newHireGrant: 750000,
  annualRefresh: 250000,
  currentPrice: 25,
  growth1: 0.1,
  growth2: 0.15,
  showSignOn: true,
  showRelocation: false,
}

function tryParseJsonResponseText(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/* ─── Main component ────────────────────────────────────────────────────────── */
export default function KlaviyoWealthModel() {
  const [name,          setName]         = useState(DEFAULT_INPUTS.name);
  const [role,          setRole]         = useState(DEFAULT_INPUTS.role);
  const [startDate,     setStartDate]    = useState(DEFAULT_INPUTS.startDate);
  const [salary,        setSalary]       = useState(DEFAULT_INPUTS.salary);
  const [bonusPct,      setBonusPct]     = useState(DEFAULT_INPUTS.bonusPct);
  const [newHireGrant,  setNewHireGrant] = useState(DEFAULT_INPUTS.newHireGrant);
  const [annualRefresh, setAnnualRefresh]= useState(DEFAULT_INPUTS.annualRefresh);
  const [currentPrice,  setCurrentPrice] = useState(25);
  const [growth1,       setGrowth1]      = useState(0.10);
  const [growth2,       setGrowth2]      = useState(0.15);
  const [signOn,        setSignOn]       = useState(DEFAULT_INPUTS.signOn);
  const [relo,          setRelo]         = useState(DEFAULT_INPUTS.relo);
  const [offerMode,     setOfferMode]    = useState(false);
  const [loadedOfferToken, setLoadedOfferToken] = useState(null);
  const [showSignOnPublic, setShowSignOnPublic] = useState(true);
  const [showReloPublic, setShowReloPublic] = useState(true);
  const [scenario,      setScenario]     = useState("g1");
  const [recruiterName, setRecruiterName] = useState(RECRUITER_CTA_CONFIG.recruiterName);
  const [recruiterEmail, setRecruiterEmail] = useState(RECRUITER_CTA_CONFIG.recruiterEmail);
  const [coverageType,  setCoverageType] = useState("individual");
  const [region,        setRegion]       = useState("US");
  const [activeTab,     setActiveTab]    = useState("comp");
  /** Selected year card (0–3) drives the left Total Rewards Snapshot donut. */
  const [snapshotYearIndex, setSnapshotYearIndex] = useState(0);
  const [copied,        setCopied]       = useState(false);
  /** Timestamp when this session loaded the model (footer “Model generated”). */
  const [modelGeneratedAt] = useState(() => new Date());
  /** US benefits: metadata from API; PDF is download-only (not rendered inline). */
  const [usBenefitsMeta, setUsBenefitsMeta] = useState(null);
  const [fxFromUsd, setFxFromUsd] = useState(() => ({ ...DEFAULT_FX_FROM_USD }));
  const [fxAsOf, setFxAsOf] = useState(null);
  const [fxLive, setFxLive] = useState(false);
  /** USD — optional “current job” total comp for comparison (null = not set). */
  const [currentAnnualCompUsd, setCurrentAnnualCompUsd] = useState(() => {
    if (typeof window === "undefined") return null;
    const c = new URLSearchParams(window.location.search).get("currentComp");
    if (c == null || String(c).trim() === "") return null;
    const n = parseFloat(String(c));
    return Number.isFinite(n) && n > 0 ? n : null;
  });

  const urlOfferToken = useMemo(() => {
    if (typeof window === "undefined") return "";
    const p = new URLSearchParams(window.location.search);
    return (p.get("offer") || p.get("token") || "").trim();
  }, []);

  useEffect(() => {
    if (region !== "US") {
      queueMicrotask(() => setUsBenefitsMeta(null));
      return;
    }
    let cancelled = false;
    fetch("/api/benefits/us", { credentials: "include" })
      .then((r) => r.text())
      .then((text) => tryParseJsonResponseText(text))
      .then((data) => {
        if (!cancelled && data && data.ok) setUsBenefitsMeta(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [region]);

  useEffect(() => {
    let cancelled = false;
    fetch(FRANKFURTER_LATEST)
      .then((r) => r.text())
      .then((text) => tryParseJsonResponseText(text))
      .then((data) => {
        if (cancelled || !data?.rates || typeof data.rates !== "object") return;
        setFxFromUsd((prev) => ({ ...prev, ...data.rates }));
        if (typeof data.date === "string") setFxAsOf(data.date);
        setFxLive(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("offer") || params.get("token");
    if (!raw) return;
    const t = raw.trim();
    if (!t) return;
    let cancelled = false;

    const applyOfferPayload = (data) => {
      if (cancelled || !data || data.ok === false) return;
      queueMicrotask(() => {
        if (cancelled) return;
        setOfferMode(true);
        setLoadedOfferToken(t);
        if (typeof data.showSignOn === "boolean") setShowSignOnPublic(data.showSignOn);
        if (typeof data.showRelocation === "boolean") setShowReloPublic(data.showRelocation);
        if (data.name != null) setName(String(data.name));
        if (data.role != null) setRole(String(data.role));
        if (data.startDate != null) setStartDate(String(data.startDate));
        if (data.region != null) setRegion(String(data.region));
        if (data.coverageType != null) setCoverageType(String(data.coverageType));
        if (data.salary != null) setSalary(Number(data.salary));
        if (data.bonusPct != null) setBonusPct(Number(data.bonusPct));
        if (data.signOn != null) setSignOn(Number(data.signOn));
        if (data.relo != null) setRelo(Number(data.relo));
        if (data.newHireGrant != null) setNewHireGrant(Number(data.newHireGrant));
        if (data.annualRefresh != null) setAnnualRefresh(Number(data.annualRefresh));
        if (data.currentPrice != null) setCurrentPrice(Number(data.currentPrice));
        if (data.growth1 != null) setGrowth1(Number(data.growth1));
        if (data.growth2 != null) setGrowth2(Number(data.growth2));
      });
    };

    if (DEMO_OFFER_TOKENS.has(t)) {
      applyOfferPayload(DEMO_OFFER_FALLBACK);
      // Do not fetch /api/offer for demo tokens: a successful response would re-run
      // applyOfferPayload and overwrite DEMO_OFFER_FALLBACK (e.g. older offers.json on server).
      return () => {
        cancelled = true;
      };
    }

    fetch(`/api/offer?token=${encodeURIComponent(t)}`, {
      credentials: "include",
    })
      .then((r) => r.text())
      .then((text) => tryParseJsonResponseText(text))
      .then((data) => applyOfferPayload(data))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isDemoOfferLink =
    (urlOfferToken && DEMO_OFFER_TOKENS.has(urlOfferToken)) ||
    (loadedOfferToken && DEMO_OFFER_TOKENS.has(loadedOfferToken));
  const offerSidebarLocked = offerMode && !isDemoOfferLink;

  const effectiveSignOn = offerMode && !showSignOnPublic ? 0 : signOn;
  const effectiveRelo = offerMode && !showReloPublic ? 0 : relo;

  const inputs = useMemo(() => {
    const parsed = new Date(`${startDate}T12:00:00`);
    const safeStart =
      Number.isNaN(parsed.getTime()) ? new Date("2026-05-15T12:00:00") : parsed;
    const safePrice = Math.max(0.01, Number(currentPrice) || 0);
    return {
      startDate: safeStart,
      salary,
      bonusPct,
      newHireGrant,
      annualRefresh,
      currentPrice: safePrice,
      growth1,
      growth2,
      signOn: effectiveSignOn,
    };
  }, [
    startDate,
    salary,
    bonusPct,
    newHireGrant,
    annualRefresh,
    currentPrice,
    growth1,
    growth2,
    effectiveSignOn,
  ]);

  const { years, p1, p2, nhGrant, refreshGrants } = useMemo(()=>computeModel(inputs),[inputs]);

  const bv = useMemo(()=>computeBenefitsValue(salary, coverageType),[salary, coverageType]);

  // Currency: state is always USD; display uses ECB/Frankfurter (or defaults) vs selected region.
  const { sym, currency, label: regionLabel } = REGIONS[region] ?? REGIONS.US;
  const fxMult = region === "US" ? 1 : Number(fxFromUsd[currency]) || 1;
  const invFx = fxMult > 0 ? 1 / fxMult : 1;
  const fmtC = (v) => fmtMoney((Number(v) || 0) * fxMult, sym);
  const makeTip = (props) => <ChartTip {...props} fmtC={fmtC} />;

  const tdcKey = scenario==="flat"?"tdcF":scenario==="g1"?"tdcG1":"tdcG2";
  const eqNhKey = scenario==="flat"?"eqF_nh":scenario==="g1"?"eqG1_nh":"eqG2_nh";
  const eqRfKey = scenario==="flat"?"eqF_rf":scenario==="g1"?"eqG1_rf":"eqG2_rf";

  const activeScenarioLabel = useMemo(() => {
    if (scenario === "flat") return "Viewing: Base Case (Flat Stock)";
    if (scenario === "g1") return `Viewing: +${fmtPct(growth1)}/yr · Assumption 1`;
    return `Viewing: +${fmtPct(growth2)}/yr · Assumption 2`;
  }, [scenario, growth1, growth2]);
  const total4 = years.reduce((s,y)=>s+y[tdcKey],0);
  const annualBenefits = bv.quantifiable;
  const total4WithBenefits = total4 + (annualBenefits * 4);

  const currentCompBaseline =
    currentAnnualCompUsd != null &&
    Number.isFinite(Number(currentAnnualCompUsd)) &&
    Number(currentAnnualCompUsd) > 0
      ? Number(currentAnnualCompUsd)
      : null;

  const firstYearExceedsCurrentComp = useMemo(() => {
    if (currentCompBaseline == null) return null;
    for (const y of years) {
      if (y[tdcKey] + annualBenefits >= currentCompBaseline) return y.yr;
    }
    return null;
  }, [years, tdcKey, annualBenefits, currentCompBaseline]);

  const cumulativeFourYearVsFourCurrent = useMemo(() => {
    if (currentCompBaseline == null) return null;
    return total4WithBenefits - 4 * currentCompBaseline;
  }, [total4WithBenefits, currentCompBaseline]);

  // Pie chart data
  const PIE_COLORS = {
    base:     "#C8C3BE",
    equityNh: B.poppy,
    equityRf: B.eggplant,
    bonus:    B.orange,
    signOn:   B.sky,
    relo:     B.violet,
    benefits: B.lemon,
  };

  const buildPieData = (baseSal, eqNh, eqRf, bon, sOn, reloAmt, ben) => {
    const items = [
      { name: "Base Salary",      value: Math.round(baseSal), color: PIE_COLORS.base },
      { name: "NH Grant (RSUs)",  value: Math.round(eqNh),    color: PIE_COLORS.equityNh },
      { name: "Refresh grants",   value: Math.round(eqRf),    color: PIE_COLORS.equityRf },
      { name: "Bonus Target*",  value: Math.round(bon),     color: PIE_COLORS.bonus },
      { name: "Sign-On",          value: Math.round(sOn),     color: PIE_COLORS.signOn },
      { name: "Relocation",       value: Math.round(reloAmt), color: PIE_COLORS.relo },
      { name: "Benefits Value",   value: Math.round(ben),     color: PIE_COLORS.benefits },
    ];
    return items.filter(d => d.value > 0);
  };

  const snapIdx = Math.min(snapshotYearIndex, Math.max(0, years.length - 1));
  const yrSnap = years[snapIdx] ?? years[0];
  const reloForSnapPie = yrSnap.yr === 1 ? effectiveRelo : 0;
  const pieYearSnap = buildPieData(
    yrSnap.salary,
    yrSnap[eqNhKey],
    yrSnap[eqRfKey],
    yrSnap.bonus,
    yrSnap.sOn,
    reloForSnapPie,
    annualBenefits,
  );

  const avgEqNh = years.reduce((s, y) => s + y[eqNhKey], 0) / 4;
  const avgEqRf = years.reduce((s, y) => s + y[eqRfKey], 0) / 4;
  const avgBonus  = years.reduce((s,y)=>s+y.bonus,0) / 4;
  const avgSignOn = effectiveSignOn / 4;
  const avgRelo   = effectiveRelo / 4;
  const pieAvg = buildPieData(salary, avgEqNh, avgEqRf, avgBonus, avgSignOn, avgRelo, annualBenefits);

  const barData = years.map((y) => ({
    name: `Yr ${y.yr}`,
    Cash: Math.round(y.salary + y.bonus + y.sOn),
    "NH Grant (RSUs)": Math.round(y[eqNhKey]),
    "Refresh grants": Math.round(y[eqRfKey]),
    Benefits: Math.round(annualBenefits),
  }));

  /** Same Y-axis max for flat / g1 / g2 so bars grow upward when switching scenarios, not rescale. */
  const barChartYMax = useMemo(() => {
    const ben = Math.round(annualBenefits);
    let m = 0;
    for (const y of years) {
      const cash = Math.round(y.salary + y.bonus + y.sOn);
      for (const [nh, rf] of [
        ["eqF_nh", "eqF_rf"],
        ["eqG1_nh", "eqG1_rf"],
        ["eqG2_nh", "eqG2_rf"],
      ]) {
        m = Math.max(m, cash + Math.round(y[nh]) + Math.round(y[rf]) + ben);
      }
    }
    return m > 0 ? m : 1;
  }, [years, annualBenefits]);

  const hideSignOnRow = offerMode && !showSignOnPublic;
  const tableRows = [
    { label:"RSUs Vesting",                                vals:years.map(y=>y.total>0?Math.round(y.total).toLocaleString():"—"), mono:true },
    { label:"Equity — Base Case (Flat Stock)",             vals:years.map(y=>fmtC(y.eqF)),   hl:scenario==="flat", sep:true },
    { label:`Equity — Assum. 1 (+${fmtPct(growth1)}/yr)`, vals:years.map(y=>fmtC(y.eqG1)),  hl:scenario==="g1" },
    { label:`Equity — Assum. 2 (+${fmtPct(growth2)}/yr)`, vals:years.map(y=>fmtC(y.eqG2)),  hl:scenario==="g2" },
    { label:"Base Salary",   vals:years.map(y=>fmtC(y.salary)), sep:true },
    { label:"Bonus Target*",  vals:years.map(y=>fmtC(y.bonus)) },
    ...(!hideSignOnRow ? [{ label:"Sign-On Bonus", vals:years.map(y=>fmtC(y.sOn)) }] : []),
    ...(currentCompBaseline != null
      ? [{
          label: `Δ vs. current comp (${fmtC(currentCompBaseline)}/yr)`,
          vals: years.map((y) =>
            fmtC(y[tdcKey] + annualBenefits - currentCompBaseline),
          ),
          /** Raw USD deltas for per-cell positive / negative styling */
          deltaRaw: years.map(
            (y) => y[tdcKey] + annualBenefits - currentCompBaseline,
          ),
          sep: true,
        }]
      : []),
    { label:"Total — Base Case (Flat Stock)",              vals:years.map(y=>fmtC(y.tdcF)),  hl:scenario==="flat", bold:true, sep:true },
    { label:`Total — Assum. 1 (+${fmtPct(growth1)}/yr)`,  vals:years.map(y=>fmtC(y.tdcG1)), hl:scenario==="g1",  bold:true },
    { label:`Total — Assum. 2 (+${fmtPct(growth2)}/yr)`,  vals:years.map(y=>fmtC(y.tdcG2)), hl:scenario==="g2",  bold:true },
  ];

  const handleShare = () => {
    const p = new URLSearchParams({
      name,
      role,
      start: startDate,
      salary,
      bonus: bonusPct * 100,
      grant: newHireGrant,
      refresh: annualRefresh,
      price: currentPrice,
      g1: growth1 * 100,
      g2: growth2 * 100,
      signOn,
      relo,
      region,
    });
    if (currentAnnualCompUsd != null && currentAnnualCompUsd > 0) {
      p.set("currentComp", String(currentAnnualCompUsd));
    }
    navigator.clipboard
      .writeText(
        `${window.location.origin}${window.location.pathname}?${p}`,
      )
      .catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const tabStyle = (id) => ({
    flex:1, padding:"9px 8px", border:`1.5px solid ${activeTab===id?B.charcoal:B.border}`,
    borderRadius:7, background:activeTab===id?B.charcoal:"#fff",
    color:activeTab===id?"#fff":B.slate,
    fontSize:11, fontWeight:700, fontFamily:"'Instrument Sans',sans-serif",
    cursor:"pointer", transition:"all 0.15s", letterSpacing:"0.03em",
  });

  const regionalBenefits = REGIONAL_BENEFITS[region];

  return (
    <>
      <style>{GOOGLE_FONT}</style>
      <div style={{ fontFamily:"'Instrument Sans','Helvetica Neue',sans-serif", background:B.cotton, minHeight:"100vh", color:B.charcoal }}>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <header style={{ background:B.charcoal, position:"sticky", top:0, zIndex:100, borderBottom:`3px solid ${B.poppy}` }}>
          <div style={{ maxWidth:1300, margin:"0 auto", padding:"0 28px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <KlaviyoWordmark color="#fff" fontSize={19} />
              <span style={{ color:"rgba(255,255,255,0.18)", margin:"0 2px", fontSize:15 }}>|</span>
              <span style={{ color:"rgba(255,255,255,0.45)", fontSize:12, fontWeight:500, letterSpacing:"0.01em" }}>Total Rewards Model</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.02em", color:"rgba(255,255,255,0.38)", maxWidth:280, textAlign:"right", lineHeight:1.35, fontFamily:"'Instrument Sans',sans-serif" }}>
                Prepared for {name?.trim() ? name.trim() : "you"} · Do not distribute
              </span>
              <button onClick={handleShare} style={{ display:"flex", alignItems:"center", gap:6, background:copied?B.sky:B.poppy, color:copied?B.charcoal:"#fff", border:"none", borderRadius:6, padding:"7px 15px", fontSize:12, fontWeight:700, cursor:"pointer", transition:"background 0.2s", letterSpacing:"0.02em", fontFamily:"'Instrument Sans',sans-serif" }}>
                {copied
                  ? <><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke={B.charcoal} strokeWidth="2.2" strokeLinecap="round"/></svg> Copied!</>
                  : <><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10 1H6a1 1 0 00-1 1v9a1 1 0 001 1h6a1 1 0 001-1V4l-3-3z" stroke="#fff" strokeWidth="1.4"/><path d="M10 1v3h3M3 5H2a1 1 0 00-1 1v7a1 1 0 001 1h6a1 1 0 001-1v-1" stroke="#fff" strokeWidth="1.4"/></svg> Share Link</>
                }
              </button>
            </div>
          </div>
        </header>

        {/* ══ HERO BANNER ═════════════════════════════════════════════════════ */}
        <div style={{ background:B.charcoal, borderBottom:`1px solid rgba(255,255,255,0.06)` }}>
          <div style={{ maxWidth:1300, margin:"0 auto", padding:"32px 28px 28px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:20 }}>
            <div className="animate-in">
              {(name||role)&&(
                <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:14 }}>
                  <Badge large>Prepared for</Badge>
                  <span style={{ fontSize:15, color:"rgba(255,255,255,0.68)", fontWeight:600, lineHeight:1.35, letterSpacing:"0.01em" }}>{[name,role].filter(Boolean).join(" · ")}</span>
                </div>
              )}
              <h1 style={{ fontSize:32, fontWeight:800, color:"#fff", letterSpacing:"-0.035em", lineHeight:1.1, margin:0 }}>
                This is what ownership looks like<br/>
                <span style={{ color:B.poppy }}>at Klaviyo.</span>
              </h1>
              <p style={{ marginTop:12, fontSize:14, color:"rgba(255,255,255,0.45)", fontWeight:400, lineHeight:1.55 }}>
                First RSU vest: {fmtDate(nhGrant)} · New hire grant: {Math.round(newHireGrant/currentPrice).toLocaleString()} RSUs
              </p>
            </div>
            <div
              className="animate-in"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 14,
                flex: "1 1 300px",
                minWidth: 0,
                maxWidth: 720,
                marginLeft: "auto",
              }}
            >
              {/* Currency on its own row so it doesn’t sit beside the metrics and leave a void beside the headline */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, width:"100%" }}>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end" }}>
                  {Object.entries(REGIONS).map(([key, r]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { if (!offerSidebarLocked) setRegion(key); }}
                      style={{
                        padding:"4px 10px", border:`1.5px solid ${region===key?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.1)"}`,
                        borderRadius:5, background:region===key?"rgba(255,255,255,0.12)":"transparent",
                        color:region===key?"#fff":"rgba(255,255,255,0.35)", fontSize:11, fontWeight:700,
                        cursor: "pointer", opacity: 1,
                        fontFamily:"'Instrument Sans',sans-serif", transition:"all 0.15s",
                      }}
                    >
                      {r.flag} {r.currency}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", fontFamily:"'Instrument Sans',sans-serif", lineHeight:1.4, textAlign:"right" }}>
                  <div>All amounts in {currency} · {regionLabel}</div>
                  {region !== "US" && (
                    <>
                      <div style={{ marginTop:3, color:"rgba(255,255,255,0.14)" }}>
                        1 USD = {fxMult.toLocaleString(undefined, { maximumFractionDigits: 4 })} {currency}
                        {fxLive && fxAsOf ? ` · ECB Frankfurter (${fxAsOf})` : " · approx. rates"}
                      </div>
                      <div style={{ marginTop:4, color:"rgba(255,255,255,0.22)" }}>
                        Converted at current exchange rates for reference only. Compensation is paid in USD.
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap", justifyContent:"flex-end", alignItems:"flex-start", width:"100%", borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:14 }}>
                <div style={{ flex:"1 1 200px", maxWidth:320, minWidth:160 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"rgba(255,255,255,0.3)", marginBottom:6 }}>4-Year Cash + Equity</div>
                  <div style={{ fontSize:36, fontWeight:800, color:B.poppy, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:"-0.05em", lineHeight:1 }}>{fmtC(total4)}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.42)", marginTop:6, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif", maxWidth:280 }}>
                    {scenario==="flat"
                      ? "4-year sum of salary, bonus, sign-on, and equity (base case — flat stock)."
                      : scenario==="g1"
                      ? `4-year sum of salary, bonus, sign-on, and equity valued at +${fmtPct(growth1)}/yr stock growth (Assumption 1).`
                      : `4-year sum of salary, bonus, sign-on, and equity valued at +${fmtPct(growth2)}/yr stock growth (Assumption 2).`}
                  </div>
                </div>
                <div style={{ borderLeft:"1px solid rgba(255,255,255,0.1)", paddingLeft:20, flex:"1 1 200px", maxWidth:320, minWidth:160 }}>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"rgba(255,255,255,0.3)", marginBottom:6 }}>4-Year Total Rewards</div>
                  <div style={{ fontSize:36, fontWeight:800, color:B.lemon, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:"-0.05em", lineHeight:1 }}>{fmtC(total4WithBenefits)}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.42)", marginTop:6, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif", maxWidth:280 }}>
                    {`Same window as cash + equity, plus ~${fmtC(annualBenefits)}/yr in estimated employer benefits (quantifiable).`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slim illustrative disclaimer — below hero, above inputs */}
        <div style={{ background:"#1a1a1a", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth:1300, margin:"0 auto", padding:"12px 28px" }}>
            <p
              style={{
                fontFamily:"'Instrument Sans',sans-serif",
                fontSize:10,
                lineHeight:1.55,
                color:"rgba(255,255,255,0.42)",
                fontWeight:400,
                margin:0,
                letterSpacing:"0.01em",
              }}
            >
              {TOP_ILLUSTRATIVE_DISCLAIMER}
            </p>
          </div>
        </div>

        {/* ══ BODY LAYOUT ═════════════════════════════════════════════════════ */}
        <div style={{ maxWidth:1300, margin:"0 auto", padding:"28px 28px 80px", display:"flex", gap:22, alignItems:"flex-start" }}>

          {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
          <aside style={{ width:268, flexShrink:0, background:"#fff", borderRadius:10, border:`1.5px solid ${B.border}`, padding:"20px 18px", position:"sticky", top:78, maxHeight:"calc(100vh - 100px)", overflowY:"auto" }}>
            <Divider label="Candidate" />
            <KInput label="Candidate Name"  value={name}      onChange={setName}     type="text" hint="Appears in the header" readOnly={offerSidebarLocked} />
            <KInput label="Role / Level"    value={role}      onChange={setRole}     type="text" hint="e.g. Director, Engineering — L5" readOnly={offerSidebarLocked} />
            <Divider label="Recruiter" />
            <KInput label="Recruiter Name" value={recruiterName} onChange={setRecruiterName} type="text" hint="Shown in the Total Rewards CTA" readOnly={offerSidebarLocked} />
            <KInput label="Recruiter Email" value={recruiterEmail} onChange={setRecruiterEmail} type="email" hint="Contact link in the Total Rewards CTA" readOnly={offerSidebarLocked} />
            <Divider label="Display currency" />
            <div style={{ marginBottom:8 }}>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {Object.entries(REGIONS).map(([key, r]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { if (!offerSidebarLocked) setRegion(key); }}
                    style={{
                      padding:"4px 8px", border:`1.5px solid ${region===key?B.charcoal:B.border}`,
                      borderRadius:5, background:region===key?B.charcoal:"#fff",
                      color:region===key?"#fff":B.slate, fontSize:10, fontWeight:700,
                      cursor:"pointer", fontFamily:"'Instrument Sans',sans-serif", transition:"all 0.15s",
                    }}
                  >
                    {r.flag} {r.currency}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:10, color:B.fog, marginTop:6, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif" }}>
                All amounts in {currency} · {regionLabel}
              </div>
              {region !== "US" && (
                <div style={{ fontSize:10, color:B.slate, marginTop:8, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif", padding:"8px 10px", background:B.mist, borderRadius:6, border:`1px solid ${B.border}` }}>
                  <div style={{ color:B.fog, fontSize:9, marginBottom:4 }}>
                    1 USD = {fxMult.toLocaleString(undefined, { maximumFractionDigits: 4 })} {currency}
                    {fxLive && fxAsOf ? ` · ECB Frankfurter (${fxAsOf})` : " · approx. rates"}
                  </div>
                  Converted at current exchange rates for reference only. Compensation is paid in USD.
                </div>
              )}
            </div>
            <Divider label="Compensation" />
            <KInput label="Projected Start Date" value={startDate} onChange={setStartDate} type="date" hint="Drives vesting schedule & bonus proration" readOnly={offerSidebarLocked} />
            <KInput label="Base Salary"     value={Math.round(salary * fxMult)}    onChange={(v)=>setSalary(Math.max(0, Math.round(v * invFx)))}   prefix={sym} min={0} step={Math.max(1000, Math.round(10000 * fxMult))} hint={`Annual base · stored in USD`} readOnly={offerSidebarLocked} />
            <KInput label="Bonus Target*"    value={bonusPct*100} onChange={v=>setBonusPct(v/100)} suffix="%" min={0} max={100} step={5} hint="% of base; prorated in Year 1 · not guaranteed" readOnly={offerSidebarLocked} />
            {(!offerMode || showSignOnPublic) && (
            <KInput label="Sign-On Bonus"   value={Math.round(signOn * fxMult)}    onChange={(v)=>setSignOn(Math.max(0, Math.round(v * invFx)))}   prefix={sym} min={0} step={Math.max(500, Math.round(5000 * fxMult))} hint="Year 1 only in model · stored in USD" readOnly={offerSidebarLocked} />
            )}
            {(!offerMode || showReloPublic) && (
            <KInput label="Relocation"      value={Math.round(relo * fxMult)}      onChange={(v)=>setRelo(Math.max(0, Math.round(v * invFx)))}     prefix={sym} min={0} step={Math.max(500, Math.round(5000 * fxMult))} hint="One-time · stored in USD" readOnly={offerSidebarLocked} />
            )}
            <Divider label="Equity" />
            <KInput label="New Hire RSU Grant"    value={Math.round(newHireGrant * fxMult)}  onChange={(v)=>setNewHireGrant(Math.max(0, Math.round(v * invFx)))}  prefix={sym} min={0} step={Math.max(5000, Math.round(50000 * fxMult))}  hint="Grant value at hire · stored in USD" readOnly={offerSidebarLocked} />
            <KInput label="Target Annual Refresh" value={Math.round(annualRefresh * fxMult)} onChange={(v)=>setAnnualRefresh(Math.max(0, Math.round(v * invFx)))} prefix={sym} min={0} step={Math.max(1000, Math.round(10000 * fxMult))}  hint="Modeled refresh · stored in USD" readOnly={offerSidebarLocked} />
            <Divider label="Stock Assumptions" />
            <KInput label="Current Stock Price"          value={Number((currentPrice * fxMult).toFixed(2))} onChange={(v)=>setCurrentPrice(Math.max(0.01, Number((v * invFx).toFixed(4))))} prefix={sym} min={0.01} step={Math.max(0.01, Number((0.5 * fxMult).toFixed(2)))} hint="USD listing · shown in local currency" readOnly={offerSidebarLocked} />
            <KInput label="Assumption 1 — Annual Growth" value={growth1*100} onChange={v=>setGrowth1(v/100)} suffix="%" min={0} max={200} step={5} readOnly={offerSidebarLocked} />
            <KInput label="Assumption 2 — Annual Growth" value={growth2*100} onChange={v=>setGrowth2(v/100)} suffix="%" min={0} max={200} step={5} readOnly={offerSidebarLocked} />
            {/* Stock price table */}
            <div style={{ background:B.mist, borderRadius:8, padding:"11px 12px", marginTop:14, border:`1px solid ${B.border}` }}>
              <Label>Projected Stock Price</Label>
              <table style={{ width:"100%", fontSize:11, borderCollapse:"collapse" }}>
                <thead>
                  <tr>{["","Assum. 1","Assum. 2"].map(h=>(
                    <th key={h} style={{ textAlign:h===""?"left":"right", color:B.fog, fontWeight:700, paddingBottom:6, fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {[0,1,2,3].map(i=>(
                    <tr key={i} style={{ borderTop:`1px solid ${B.border}` }}>
                      <td style={{ color:B.slate, padding:"3px 0", fontFamily:"'Instrument Sans',sans-serif" }}>Yr {i+1}</td>
                      <td style={{ textAlign:"right", fontFamily:"'IBM Plex Mono',monospace", color:B.charcoal, padding:"3px 0" }}>{sym}{(p1[i] * fxMult).toFixed(2)}</td>
                      <td style={{ textAlign:"right", fontFamily:"'IBM Plex Mono',monospace", color:B.charcoal, padding:"3px 0" }}>{sym}{(p2[i] * fxMult).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize:9, color:B.fog, marginTop:10, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif" }}>
                Projected prices are hypothetical scenarios, not forecasts. Stock may increase or decrease.
              </div>
            </div>
            <Divider label="Benefits Coverage" />
            <div style={{ marginBottom:8 }}>
              <Label>Coverage Type</Label>
              <div style={{ display:"flex", gap:6 }}>
                {[["individual","Individual"],["family","Family"]].map(([val,lbl])=>(
                  <button key={val} type="button" onClick={() => { if (!offerSidebarLocked) setCoverageType(val); }} style={{ flex:1, padding:"7px 0", border:`1.5px solid ${coverageType===val?B.charcoal:B.border}`, borderRadius:6, background:coverageType===val?B.charcoal:"#fff", color:coverageType===val?"#fff":B.slate, fontSize:11, fontWeight:700, fontFamily:"'Instrument Sans',sans-serif", cursor: "pointer", opacity: 1, transition:"all 0.15s" }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:10, color:B.fog, marginTop:4, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif" }}>Affects HSA and benefits estimates</div>
            </div>
            <Divider label="Benefits overview" />
            <div style={{ background:B.mist, borderRadius:8, padding:"11px 12px", marginTop:4, border:`1px solid ${B.border}` }}>
              <Label>Est. Annual Benefits Value</Label>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:20, fontWeight:700, color:B.violet, marginBottom:6 }}>{fmtC(annualBenefits)}</div>
              {bv.summaryLines.map(([label, amt]) => (
                <div
                  key={label}
                  style={{ display:"flex", justifyContent:"space-between", borderTop:`1px solid ${B.border}`, padding:"3px 0", alignItems:"flex-start", gap:8 }}
                >
                  <span
                    title={label.startsWith("ESPP") ? "ESPP value assumes 15% discount and participation at max contribution. Actual value depends on stock price and your participation elections." : undefined}
                    style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:10, color:B.slate, paddingRight:8 }}
                  >
                    {label.startsWith("ESPP")
                      ? `${label} — voluntary, market-dependent`
                      : label}
                  </span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:B.charcoal, whiteSpace:"nowrap" }}>{fmtC(amt)}</span>
                </div>
              ))}
              <div style={{ fontSize:9, color:B.fog, marginTop:6, lineHeight:1.4, fontFamily:"'Instrument Sans',sans-serif" }}>
                Illustrative employer-side estimates (not payroll quotes). Includes modeled medical/dental/vision employer share, ESPP & HSA where elected. Excludes Global Sabbatical (5+ yrs) and other qualitative benefits.
              </div>
            </div>
            <Divider label="Compare to Current Comp (optional)" />
            <KInput
              label="Current Total Annual Comp"
              type="number"
              value={currentAnnualCompUsd == null ? "" : Math.round(currentAnnualCompUsd * fxMult)}
              onChange={(v) => {
                if (v === "" || v === null || Number.isNaN(Number(v))) setCurrentAnnualCompUsd(null);
                else setCurrentAnnualCompUsd(Math.max(0, Math.round(Number(v) * invFx)));
              }}
              prefix={sym}
              min={0}
              step={Math.max(1000, Math.round(5000 * fxMult))}
              hint="Optional — total comp at your current role (stored in USD). Clear to hide comparison rows."
              readOnly={offerSidebarLocked}
            />
          </aside>

          {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
          <main style={{ flex:1, minWidth:0 }}>

            {/* ── PIE CHART SNAPSHOT ──────────────────────────────────────── */}
            <div style={{ background:B.charcoal, borderRadius:10, padding:"22px 24px 18px", marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"#fff", letterSpacing:"-0.02em" }}>Total Rewards Snapshot</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.42)", marginTop:2 }}>How your package is composed · {scenario==="flat"?"Base case (flat stock)":scenario==="g1"?`+${fmtPct(growth1)}/yr`:` +${fmtPct(growth2)}/yr`}</div>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px" }}>
                  {[
                    ["Base Salary", PIE_COLORS.base],
                    ["NH Grant", PIE_COLORS.equityNh],
                    ["Refresh", PIE_COLORS.equityRf],
                    ["Bonus Target*", PIE_COLORS.bonus],
                    ...(!offerMode || showSignOnPublic ? [["Sign-On", PIE_COLORS.signOn]] : []),
                    ...(!offerMode ? (relo > 0 ? [["Relocation", PIE_COLORS.relo]] : []) : (showReloPublic && effectiveRelo > 0 ? [["Relocation", PIE_COLORS.relo]] : [])),
                    ["Benefits", PIE_COLORS.benefits],
                  ].map(([lbl, clr]) => (
                    <div key={lbl} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:clr, flexShrink:0 }} />
                      <span style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:10, color:"rgba(255,255,255,0.5)" }}>{lbl}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.32)", marginBottom:14, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif" }}>
                {BONUS_TARGET_FOOTNOTE}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {[
                  { title:`Year ${yrSnap.yr} Breakdown`, sub:`Total: ${fmtC(pieYearSnap.reduce((s,d)=>s+d.value,0))}`, data:pieYearSnap },
                  { title:"4-Year Average",   sub:`4-yr avg: ${fmtC(pieAvg.reduce((s,d)=>s+d.value,0))}`, data:pieAvg },
                ].map(({ title, sub, data }) => (
                  <div key={title}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8 }}>
                      <span style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{title}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:700, color:B.poppy }}>{sub}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                      <PieChart width={140} height={140}>
                        <Pie data={data} cx={65} cy={65} innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value" strokeWidth={0}>
                          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip
                          formatter={(v, n) => [fmtC(v), n]}
                          contentStyle={{ background:B.charcoal, border:`1px solid rgba(255,255,255,0.1)`, borderRadius:6, fontFamily:"'Instrument Sans',sans-serif", fontSize:11, color:"#fff" }}
                          itemStyle={{ color:"rgba(255,255,255,0.8)" }}
                        />
                      </PieChart>
                      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
                        {data.map(d => {
                          const tot = data.reduce((s,x)=>s+x.value,0);
                          const pct = tot > 0 ? Math.round((d.value/tot)*100) : 0;
                          return (
                            <div key={d.name} style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <div style={{ width:6, height:6, borderRadius:"50%", background:d.color, flexShrink:0 }} />
                              <div style={{ flex:1, fontFamily:"'Instrument Sans',sans-serif", fontSize:10, color:"rgba(255,255,255,0.55)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{d.name}</div>
                              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.8)", whiteSpace:"nowrap" }}>{fmtC(d.value)}</div>
                              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.3)", width:28, textAlign:"right" }}>{pct}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:14 }}>
              <span style={{ fontSize:10, fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:B.fog, fontFamily:"'Instrument Sans',sans-serif" }}>Active assumption</span>
              <span style={{ display:"inline-block", background:B.mist, border:`1px solid ${B.border}`, borderRadius:7, padding:"7px 12px", fontSize:12, fontWeight:700, color:B.charcoal, fontFamily:"'Instrument Sans',sans-serif", letterSpacing:"0.01em" }}>
                {activeScenarioLabel}
              </span>
            </div>

            {/* View tabs */}
            <div style={{ display:"flex", gap:6, marginBottom:20 }}>
              <button style={tabStyle("comp")}     onClick={()=>setActiveTab("comp")}>    💼 Compensation</button>
              <button style={tabStyle("benefits")} onClick={()=>setActiveTab("benefits")}>🎁 Benefits & Perks</button>
              <button style={tabStyle("total")}    onClick={()=>setActiveTab("total")}>   ⭐ Total Rewards</button>
            </div>

            {/* ── COMP TAB ─────────────────────────────────────────────── */}
            {activeTab==="comp" && <>
              <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
                {[
                  { key:"flat", label:"Base Case (Flat Stock)", note: STOCK_SCENARIO_NOTES.flat },
                  { key:"g1",   label:`+${fmtPct(growth1)}/yr · Assumption 1`, note: STOCK_SCENARIO_NOTES.g1 },
                  { key:"g2",   label:`+${fmtPct(growth2)}/yr · Assumption 2`, note: STOCK_SCENARIO_NOTES.g2 },
                ].map((s)=>(
                  <div key={s.key} style={{ flex:"1 1 140px", minWidth:120, display:"flex", flexDirection:"column", gap:0, alignItems:"stretch" }}>
                    <button type="button" onClick={()=>setScenario(s.key)} style={{
                      width:"100%", padding:"9px 10px", border:`1.5px solid ${scenario===s.key?B.charcoal:B.border}`,
                      borderRadius:7, background:scenario===s.key?B.charcoal:"#fff",
                      color:scenario===s.key?"#fff":B.slate,
                      fontSize:11, fontWeight:700, fontFamily:"'Instrument Sans',sans-serif",
                      cursor:"pointer", transition:"all 0.15s", letterSpacing:"0.03em",
                      textAlign:"center",
                    }}>
                      <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, flexWrap:"wrap", textAlign:"center", width:"100%", boxSizing:"border-box" }}>
                        {s.label}
                        {scenario===s.key&&<span style={{ display:"inline-block", width:5, height:5, borderRadius:"50%", background:B.poppy, flexShrink:0 }} />}
                      </span>
                    </button>
                    <div style={{ fontSize:9, color:B.fog, marginTop:6, lineHeight:1.4, fontFamily:"'Instrument Sans',sans-serif", textAlign:"center", padding:"0 4px" }}>
                      {s.note}
                    </div>
                  </div>
                ))}
              </div>

              {/* Year cards */}
              <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap", overflow:"visible" }}>
                {years.map((y,i)=>(
                  <YearCard
                    key={y.yr}
                    data={y}
                    scenario={scenario}
                    growth1={growth1}
                    growth2={growth2}
                    currentPrice={currentPrice}
                    active={i===snapIdx}
                    onSelect={() => { if (i !== snapIdx) setSnapshotYearIndex(i); }}
                    fmtC={fmtC}
                    sym={sym}
                    fxMult={fxMult}
                  />
                ))}
              </div>

              {/* Bar chart */}
              <div style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"20px 20px 10px", marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:800, color:B.charcoal, letterSpacing:"-0.02em" }}>Annual Total Compensation</div>
                    <div style={{ fontSize:11, color:B.fog, marginTop:2 }}>
                      {scenario==="flat"?"Base case (flat stock)":scenario==="g1"?`Assumption 1 · stock +${fmtPct(growth1)}/yr`:`Assumption 2 · stock +${fmtPct(growth2)}/yr`}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:14 }}>
                    {[["Cash",B.border],["NH Grant (RSUs)",B.poppy],["Refresh grants",B.eggplant],["Benefits",B.violet]].map(([lbl,bg])=>(
                      <div key={lbl} style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <div style={{ width:10, height:10, borderRadius:2, background:bg, border:`1px solid ${B.border}` }} />
                        <span style={{ fontSize:11, color:B.fog, fontFamily:"'Instrument Sans',sans-serif" }}>{lbl}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} barCategoryGap="38%" margin={{ top:0, right:0, left:0, bottom:0 }}>
                    <CartesianGrid vertical={false} stroke={B.border} />
                    <XAxis dataKey="name" tick={{ fontSize:11, fill:B.fog, fontFamily:"'Instrument Sans',sans-serif" }} axisLine={false} tickLine={false} />
                    <YAxis
                      domain={[0, barChartYMax]}
                      allowDecimals={false}
                      tick={{ fontSize:10, fill:B.fog, fontFamily:"'IBM Plex Mono',monospace" }}
                      tickFormatter={(v) => {
                        const w = v * fxMult;
                        return w >= 1_000_000
                          ? `${sym}${(w / 1_000_000).toFixed(1)}M`
                          : `${sym}${(w / 1000).toFixed(0)}K`;
                      }}
                      axisLine={false} tickLine={false} width={55}
                    />
                    <Tooltip content={makeTip} cursor={{ fill:"rgba(35,33,33,0.03)" }} />
                    <Bar dataKey="Cash" stackId="a" fill={B.border} name="Cash" />
                    <Bar dataKey="NH Grant (RSUs)" stackId="a" fill={B.poppy} name="NH Grant (RSUs)" />
                    <Bar dataKey="Refresh grants" stackId="a" fill={B.eggplant} name="Refresh grants" />
                    <Bar dataKey="Benefits" stackId="a" fill={B.violet} name="Benefits" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detail table */}
              <div style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"20px", marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:800, color:B.charcoal, letterSpacing:"-0.02em", marginBottom:16 }}>Full Compensation Detail</div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse", minWidth:480 }}>
                    <thead>
                      <tr style={{ borderBottom:`2px solid ${B.border}` }}>
                        <th style={{ textAlign:"left", padding:"0 12px 10px 0", color:B.fog, fontWeight:700, fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em" }}></th>
                        {["Year 1","Year 2","Year 3","Year 4"].map(h=>(
                          <th key={h} style={{ textAlign:"right", padding:"0 0 10px", color:B.charcoal, fontWeight:800, fontSize:12, fontFamily:"'Instrument Sans',sans-serif" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row,i)=>(
                        <tr
                          key={i}
                          style={{
                            borderTop: row.sep ? `2px solid ${B.border}` : `1px solid ${B.mist}`,
                            background: row.deltaRaw
                              ? "rgba(35,33,33,0.03)"
                              : row.hl
                                ? "rgba(249,99,83,0.04)"
                                : "transparent",
                          }}
                        >
                          <td
                            style={{
                              padding:"7px 12px 7px 0",
                              color: row.bold ? B.charcoal : B.slate,
                              fontWeight: row.deltaRaw ? 700 : row.bold ? 700 : 400,
                              fontSize: 12,
                              whiteSpace: "nowrap",
                              fontFamily: "'Instrument Sans',sans-serif",
                              borderLeft: row.deltaRaw ? `3px solid ${B.charcoal}` : undefined,
                              paddingLeft: row.deltaRaw ? 9 : undefined,
                            }}
                          >
                            {row.label}
                          </td>
                          {row.vals.map((v, j) => {
                            const n = row.deltaRaw?.[j];
                            const isDelta = row.deltaRaw != null && n !== undefined;
                            const pos = isDelta && n > 0;
                            const neg = isDelta && n < 0;
                            return (
                              <td
                                key={j}
                                style={{
                                  textAlign: "right",
                                  padding: "7px 8px",
                                  fontFamily: "'IBM Plex Mono',monospace",
                                  fontSize: 12,
                                  fontWeight: isDelta ? 700 : row.bold ? 700 : 500,
                                  opacity: row.hl ? 1 : row.bold ? 1 : 0.85,
                                  ...(isDelta
                                    ? {
                                        background: pos
                                          ? "rgba(22, 163, 74, 0.14)"
                                          : neg
                                            ? "rgba(220, 38, 38, 0.12)"
                                            : "rgba(100, 116, 139, 0.1)",
                                        color: pos
                                          ? "#166534"
                                          : neg
                                            ? "#991b1b"
                                            : B.slate,
                                        borderRadius: 4,
                                      }
                                    : {
                                        color: row.hl ? B.poppy : B.charcoal,
                                      }),
                                }}
                              >
                                {v}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grant schedule */}
              <div style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"18px 20px", marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:800, color:B.charcoal, letterSpacing:"-0.01em", marginBottom:14 }}>Grant Schedule</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  {[
                    { label:"New Hire Grant", sub:`${fmtDate(nhGrant)} first vest · ${Math.round(newHireGrant/currentPrice).toLocaleString()} RSUs`, value:fmtC(newHireGrant), accent:true, committed:true },
                    ...refreshGrants.filter(rg=>rg.value>0).map(rg=>({ label:rg.label, sub:`${fmtDate(rg.grantDate)} · ${Math.round(rg.value/currentPrice).toLocaleString()} RSUs`, value:fmtC(rg.value), accent:false, committed:false })),
                  ].map((g,i)=>(
                    <div key={i} style={{ flex:"1 1 150px", background:B.mist, borderRadius:8, padding:"12px 14px", border:`1.5px solid ${g.accent?B.poppy:B.border}` }}>
                      <div style={{ marginBottom:8 }}>
                        {g.committed ? (
                          <Badge color={B.poppy}>Committed</Badge>
                        ) : (
                          <span
                            title="Refresh grants are subject to performance and future board approval."
                            style={{
                              display:"inline-block",
                              fontSize:8,
                              fontWeight:800,
                              letterSpacing:"0.06em",
                              textTransform:"uppercase",
                              color:B.fog,
                              background:"rgba(35,33,33,0.05)",
                              padding:"3px 8px",
                              borderRadius:4,
                              fontFamily:"'Instrument Sans',sans-serif",
                              border:`1px solid ${B.border}`,
                              cursor:"help",
                            }}
                          >
                            PERFORMANCE-BASED
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:9, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:g.accent?B.poppy:B.fog, marginBottom:5 }}>{g.label}</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:15, fontWeight:700, color:B.charcoal }}>{g.value}</div>
                      <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:10, color:B.fog, marginTop:3 }}>{g.sub}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:10, color:B.fog, marginTop:12, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif" }}>
                  Refresh grants are subject to performance and future board approval.
                </div>
              </div>
            </>}

            {/* ── BENEFITS TAB ──────────────────────────────────────────── */}
            {activeTab==="benefits" && <>
              {/* Benefits hero */}
              <div style={{ background:B.charcoal, borderRadius:10, padding:"24px 28px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"rgba(255,255,255,0.35)" }}>Estimated Annual Benefits Value</div>
                    <span style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.25)", fontFamily:"'Instrument Sans',sans-serif" }}>· {REGIONS[region].flag} {REGIONS[region].label}</span>
                  </div>
                  <div style={{ fontSize:42, fontWeight:800, color:B.violet, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:"-0.04em", lineHeight:1 }}>{fmtC(annualBenefits)}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:5 }}>Quantifiable employer contributions · excludes medical premiums, Global Sabbatical (5+ yrs), & qualitative benefits</div>
                </div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  {[
                    ["401(k) Match", fmtC(bv.match401k), B.lemon],
                    ["K-Flex LSA",   fmtC(1000),          B.sky],
                    ["K-Pro Learn",  fmtC(2500),          B.orange],
                    ["Commuter",     fmtC(3600),          B.pink],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{ background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"10px 14px", textAlign:"center", minWidth:90 }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:15, fontWeight:700, color:c }}>{v}</div>
                      <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:3 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Itemized dollar breakdown — leads category cards */}
              <div style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"18px 20px", marginBottom: 16 }}>
                <div style={{ fontSize:13, fontWeight:800, color:B.charcoal, letterSpacing:"-0.01em", marginBottom:12 }}>Estimated annual benefits — itemized</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:22, fontWeight:700, color:B.violet, marginBottom:10 }}>{fmtC(annualBenefits)}</div>
                {bv.summaryLines.map(([label, amt]) => (
                  <div
                    key={label}
                    style={{ display:"flex", justifyContent:"space-between", borderTop:`1px solid ${B.border}`, padding:"6px 0", alignItems:"flex-start", gap:8 }}
                  >
                    <span
                      title={label.startsWith("ESPP") ? "ESPP value assumes 15% discount and participation at max contribution. Actual value depends on stock price and your participation elections." : undefined}
                      style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:12, color:B.slate, paddingRight:8 }}
                    >
                      {label.startsWith("ESPP")
                        ? `${label} — voluntary, market-dependent`
                        : label}
                    </span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:B.charcoal, whiteSpace:"nowrap" }}>{fmtC(amt)}</span>
                  </div>
                ))}
                <div style={{ fontSize:10, color:B.fog, marginTop:8, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif" }}>
                  Illustrative employer-side estimates (not payroll quotes). Includes modeled medical/dental/vision employer share, ESPP & HSA where elected. Excludes Global Sabbatical (5+ yrs) and other qualitative benefits.
                </div>
              </div>

              {/* Regional note banner for non-US */}
              {regionalBenefits && (
                <div style={{ background:`${B.orange}18`, border:`1.5px solid ${B.orange}40`, borderRadius:10, padding:"14px 18px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{REGIONS[region].flag}</span>
                  <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:12, color:B.slate, lineHeight:1.6 }}>
                    <strong style={{ color:B.charcoal }}>{REGIONS[region].label} Benefits Note: </strong>
                    {regionalBenefits.note}
                  </div>
                </div>
              )}

              {regionalBenefits && (
                <div style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"18px 20px", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                    <span style={{ fontSize:18 }}>🌍</span>
                    <span style={{ fontSize:14, fontWeight:800, color:B.charcoal, letterSpacing:"-0.01em" }}>Benefits Highlights — {REGIONS[region].label}</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:10 }}>
                    {regionalBenefits.highlights.map((h,i)=>(
                      <div key={i} style={{ background:B.mist, border:`1.5px solid ${B.border}`, borderRadius:8, padding:"14px 16px" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:6 }}>
                          <span style={{ fontSize:18 }}>{h.icon}</span>
                          <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:12, fontWeight:700, color:B.charcoal, lineHeight:1.3 }}>{h.title}</div>
                        </div>
                        <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:11, color:B.slate, lineHeight:1.55 }}>{h.body}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* US: official PDF is downloadable only — not pasted inline */}
              {!regionalBenefits && usBenefitsMeta?.ok && (
                <div style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"18px 20px", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:14, fontWeight:800, color:B.charcoal }}>{usBenefitsMeta.title || "US benefits"}</span>
                    <Badge color={B.sky}>{usBenefitsMeta.pdfAvailable ? "PDF" : "Reference"}</Badge>
                  </div>
                  <p style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:12, color:B.slate, lineHeight:1.55, marginBottom:14 }}>
                    Full plan details are in Klaviyo’s official US benefits document. Download the PDF below — we don’t reproduce the full text here.
                  </p>
                  {usBenefitsMeta.pdfAvailable ? (
                    <a
                      href="/api/benefits/us/pdf"
                      download="Klaviyo-US-Benefits-At-a-Glance.pdf"
                      style={{
                        display:"inline-flex",
                        alignItems:"center",
                        gap:8,
                        padding:"9px 16px",
                        borderRadius:6,
                        background:B.charcoal,
                        color:"#fff",
                        fontSize:12,
                        fontWeight:700,
                        fontFamily:"'Instrument Sans',sans-serif",
                        textDecoration:"none",
                        letterSpacing:"0.02em",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M8 3v7.5M5.5 8.5L8 11l2.5-2.5M4 14h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Download US benefits PDF
                    </a>
                  ) : (
                    <span style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:11, color:B.fog }}>PDF is not bundled in this environment; use the reference data in the repo.</span>
                  )}
                </div>
              )}

              {/* US: benefit category cards — Financial & Health, then Protection, Time Off, Lifestyle */}
              {!regionalBenefits && BENEFIT_CATEGORIES.filter((c) => BENEFIT_CATEGORIES_FINANCIAL_HEALTH.includes(c.id)).map(cat=>(
                <div key={cat.id} style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"18px 20px", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                    <span style={{ fontSize:18 }}>{cat.icon}</span>
                    <span style={{ fontSize:14, fontWeight:800, color:B.charcoal, letterSpacing:"-0.01em" }}>{cat.label}</span>
                    <div style={{ flex:1, height:1, background:B.border }} />
                    <Badge color={cat.color}>{cat.benefits.length} benefits</Badge>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:10 }}>
                    {cat.benefits.map(b=>(
                      <BenefitCard key={b.id} benefit={b} salary={salary} coverageType={coverageType} accentColor={cat.color} fmtC={fmtC} />
                    ))}
                  </div>
                </div>
              ))}
              {!regionalBenefits && BENEFIT_CATEGORIES.filter((c) => BENEFIT_CATEGORIES_REST.includes(c.id)).map(cat=>(
                <div key={cat.id} style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"18px 20px", marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                    <span style={{ fontSize:18 }}>{cat.icon}</span>
                    <span style={{ fontSize:14, fontWeight:800, color:B.charcoal, letterSpacing:"-0.01em" }}>{cat.label}</span>
                    <div style={{ flex:1, height:1, background:B.border }} />
                    <Badge color={cat.color}>{cat.benefits.length} benefits</Badge>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:10 }}>
                    {cat.benefits.map(b=>(
                      <BenefitCard key={b.id} benefit={b} salary={salary} coverageType={coverageType} accentColor={cat.color} fmtC={fmtC} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Global programs always shown */}
              <div style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"18px 20px", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                  <span style={{ fontSize:18 }}>🌐</span>
                  <span style={{ fontSize:14, fontWeight:800, color:B.charcoal, letterSpacing:"-0.01em" }}>Global Programs</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))", gap:10 }}>
                  {[
                    { icon:"🧠", label:"Modern Health",    desc:"8 therapy + 8 coaching sessions per year at no cost. Household members included. Available globally.", note:"~$2,400 retail value" },
                    { icon:"📈", label:"ESPP",              desc:"Purchase Klaviyo stock at a 15% discount via payroll deductions. Invest in the company you're building.", note:"15% discount" },
                    { icon:"🌍", label:"Global Sabbatical", desc:"4 weeks fully paid after 5 years of continuous service. Recharge and pursue passion projects.", note:"After 5 yrs · not in annual total" },
                    { icon:"✨", label:"K-Flex LSA",        desc:"Lifestyle spending account for wellness, fitness, and personal growth.", note:fmtC(1000)+"/year" },
                    { icon:"🎓", label:"K-Pro Learn",       desc:"Annual reimbursement for professional learning, certifications, and development.", note:fmtC(2500)+"/year" },
                  ].map(g=>(
                    <div key={g.label} style={{ background:B.mist, border:`1px solid ${B.border}`, borderRadius:8, padding:"12px 14px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ fontSize:15 }}>{g.icon}</span>
                          <span style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:12, fontWeight:700, color:B.charcoal }}>{g.label}</span>
                        </div>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, color:B.poppy, whiteSpace:"nowrap" }}>{g.note}</span>
                      </div>
                      <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:11, color:B.slate, lineHeight:1.5 }}>{g.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>}

            {/* ── TOTAL REWARDS TAB ────────────────────────────────────── */}
            {activeTab==="total" && <>
              {/* Big number */}
              <div style={{ background:B.charcoal, borderRadius:10, padding:"28px 32px", marginBottom:20, textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.14em", color:"rgba(255,255,255,0.3)", marginBottom:8 }}>4-Year Total Rewards Value</div>
                <div style={{ fontSize:56, fontWeight:800, color:B.lemon, fontFamily:"'IBM Plex Mono',monospace", letterSpacing:"-0.05em", lineHeight:1 }}>{fmtC(total4WithBenefits)}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.42)", marginTop:8, lineHeight:1.45 }}>
                  Cash + equity + estimated benefits · {scenario==="flat"?"base case (flat stock)":scenario==="g1"?`+${fmtPct(growth1)}/yr`:`+${fmtPct(growth2)}/yr`}
                </div>
              </div>

              {/* Breakdown cards */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:14, marginBottom:20 }}>
                {[
                  { label:"4-Year Cash",       value:years.reduce((s,y)=>s+y.salary+y.bonus+((offerMode && !showSignOnPublic)?0:y.sOn),0), color:B.charcoal, sub: offerMode && !showSignOnPublic ? "Salary + Bonus" : "Salary + Bonus + Sign-On" },
                  { label:"4-Year NH Grant",   value:years.reduce((s,y)=>s+y[eqNhKey],0),               color:B.poppy,    sub:scenario==="flat"?"Base case (flat stock)":scenario==="g1"?`+${fmtPct(growth1)}/yr`:`+${fmtPct(growth2)}/yr` },
                  { label:"4-Year Refresh",    value:years.reduce((s,y)=>s+y[eqRfKey],0),               color:B.eggplant, sub:"Modeled annual refresh" },
                  { label:"4-Year Benefits",   value:annualBenefits*4,                                  color:B.violet,   sub:"Est. quantifiable value" },
                ].map(c=>(
                  <div key={c.label} style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"20px", textAlign:"center" }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:B.fog, marginBottom:8 }}>{c.label}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:28, fontWeight:800, color:c.color, letterSpacing:"-0.04em", lineHeight:1 }}>{fmtC(c.value)}</div>
                    <div style={{ fontSize:10, color:B.fog, marginTop:6, fontFamily:"'Instrument Sans',sans-serif" }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Year-by-year total rewards table */}
              <div style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"20px", marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:800, color:B.charcoal, letterSpacing:"-0.02em", marginBottom:16 }}>Year-by-Year Total Rewards</div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", fontSize:12, borderCollapse:"collapse", minWidth:480 }}>
                    <thead>
                      <tr style={{ borderBottom:`2px solid ${B.border}` }}>
                        <th style={{ textAlign:"left", padding:"0 12px 10px 0", color:B.fog, fontWeight:700, fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em" }}></th>
                        {["Year 1","Year 2","Year 3","Year 4"].map(h=>(
                          <th key={h} style={{ textAlign:"right", padding:"0 0 10px", color:B.charcoal, fontWeight:800, fontSize:12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label:"Base Salary",       vals:years.map(y=>fmtC(y.salary)),             color:B.charcoal },
                        ...(offerMode && !showSignOnPublic
                          ? [{ label:"Bonus*", vals:years.map(y=>fmtC(y.bonus)), color:B.charcoal }]
                          : [{ label:"Bonus (target, not guaranteed) + Sign-On", vals:years.map(y=>fmtC(y.bonus+y.sOn)), color:B.charcoal }]),
                        { label:"NH Grant (RSUs)",   vals:years.map(y=>fmtC(y[eqNhKey])),           color:B.poppy, bold:true },
                        { label:"Refresh grants",    vals:years.map(y=>fmtC(y[eqRfKey])),           color:B.eggplant, bold:true },
                        { label:"Est. Benefits Value", vals:years.map(()=>fmtC(annualBenefits)),    color:B.violet },
                      ].map((row,i)=>(
                        <tr key={i} style={{ borderTop:`1px solid ${B.mist}` }}>
                          <td style={{ padding:"7px 12px 7px 0", color:row.bold?B.charcoal:B.slate, fontWeight:row.bold?700:400, fontSize:12, whiteSpace:"nowrap", fontFamily:"'Instrument Sans',sans-serif" }}>{row.label}</td>
                          {row.vals.map((v,j)=>(
                            <td key={j} style={{ textAlign:"right", padding:"7px 0", fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:row.color, fontWeight:row.bold?700:500 }}>{v}</td>
                          ))}
                        </tr>
                      ))}
                      <tr style={{ borderTop:`2px solid ${B.border}`, background:B.charcoal }}>
                        <td style={{ padding:"10px 12px 10px 0", color:B.cotton, fontWeight:800, fontSize:12, fontFamily:"'Instrument Sans',sans-serif" }}>Total Rewards</td>
                        {years.map((y,j)=>(
                          <td key={j} style={{ textAlign:"right", padding:"10px 0", fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color:B.lemon, fontWeight:800 }}>
                            {fmtC(y[tdcKey]+annualBenefits)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ fontSize:10, color:B.fog, marginTop:10, lineHeight:1.45, fontFamily:"'Instrument Sans',sans-serif" }}>
                  {BONUS_TARGET_FOOTNOTE}
                </div>
              </div>

              {currentCompBaseline != null && (
                <div style={{ background:B.charcoal, borderRadius:10, padding:"22px 26px", marginBottom:16, border:"1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ fontSize:12, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em", color:"rgba(255,255,255,0.35)", marginBottom:10 }}>Current comp comparison</div>
                  <div style={{ fontSize:14, color:"rgba(255,255,255,0.88)", lineHeight:1.55, fontFamily:"'Instrument Sans',sans-serif" }}>
                    {firstYearExceedsCurrentComp != null ? (
                      <>
                        You first exceed your entered current annual comp ({fmtC(currentCompBaseline)}) in{" "}
                        <span style={{ color:B.lemon, fontWeight:800 }}>Year {firstYearExceedsCurrentComp}</span>
                        {" "}(modeled total rewards per year, selected appreciation scenario).
                      </>
                    ) : (
                      <>
                        Modeled annual total rewards stay below your entered current comp ({fmtC(currentCompBaseline)}) in Years 1–4.
                      </>
                    )}
                  </div>
                  {cumulativeFourYearVsFourCurrent != null && (
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", marginTop:12, lineHeight:1.5 }}>
                      4-year cumulative total rewards vs. 4× current comp:{" "}
                      {cumulativeFourYearVsFourCurrent >= 0 ? "+" : "−"}
                      {fmtC(Math.abs(cumulativeFourYearVsFourCurrent))}.
                    </div>
                  )}
                </div>
              )}

              {/* What makes Klaviyo different */}
              <div style={{ background:"#fff", border:`1.5px solid ${B.border}`, borderRadius:10, padding:"20px", marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:800, color:B.charcoal, marginBottom:16 }}>What Makes Klaviyo Different</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:12 }}>
                  {[
                    { icon:"👶", title:"Industry-Leading Parental Leave",     body:"22 weeks fully paid for birthing parents. 16 weeks for non-birthing parents." },
                    { icon:"🏦", title:"401(k) — 100% Vested Day 1",         body:"4% employer match with immediate 100% vesting. Your retirement savings are yours from day one." },
                    { icon:"🌍", title:"Global Sabbatical",                   body:"4 weeks fully paid after 5 years. Recharge, explore, pursue passion projects." },
                    { icon:"🧠", title:"Modern Health — Free Therapy",        body:"8 therapy + 8 coaching sessions per year at no cost. Household members included." },
                    { icon:"🎓", title:fmtC(2500)+" Learning Budget",         body:"Annual K-Pro Learn stipend to invest in skills, certifications, and courses." },
                    { icon:"📈", title:"ESPP — 15% Discount",                body:"Buy Klaviyo stock at a 15% discount via payroll deductions. Invest in the company you're building." },
                  ].map(c=>(
                    <div key={c.title} style={{ background:B.mist, borderRadius:8, padding:"14px 16px", border:`1px solid ${B.border}` }}>
                      <div style={{ fontSize:20, marginBottom:8 }}>{c.icon}</div>
                      <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:12, fontWeight:700, color:B.charcoal, marginBottom:4 }}>{c.title}</div>
                      <div style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:11, color:B.slate, lineHeight:1.5 }}>{c.body}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background:B.charcoal, borderRadius:10, padding:"26px 28px", marginBottom:16, border:"1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize:17, fontWeight:800, color:"#fff", letterSpacing:"-0.02em", marginBottom:8 }}>Ready to talk through your offer?</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginBottom:18, lineHeight:1.55, fontFamily:"'Instrument Sans',sans-serif" }}>
                  Connect with {(recruiterName || "").trim() || RECRUITER_CTA_CONFIG.recruiterName} for questions about your package and next steps.
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:14, alignItems:"center" }}>
                  <a
                    href={`mailto:${(recruiterEmail || "").trim() || RECRUITER_CTA_CONFIG.recruiterEmail}`}
                    style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:600, color:B.lemon, textDecoration:"none", borderBottom:"1px solid rgba(252,252,126,0.4)" }}
                  >
                    {(recruiterEmail || "").trim() || RECRUITER_CTA_CONFIG.recruiterEmail}
                  </a>
                  {RECRUITER_CTA_CONFIG.calendarUrl ? (
                    <a
                      href={RECRUITER_CTA_CONFIG.calendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display:"inline-flex",
                        alignItems:"center",
                        padding:"8px 14px",
                        borderRadius:6,
                        background:B.poppy,
                        color:"#fff",
                        fontSize:12,
                        fontWeight:700,
                        fontFamily:"'Instrument Sans',sans-serif",
                        textDecoration:"none",
                      }}
                    >
                      Schedule time
                    </a>
                  ) : null}
                </div>
              </div>
            </>}

          </main>
        </div>

        <footer
          role="contentinfo"
          aria-label="Legal disclaimer"
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            padding: "24px 28px 40px",
            borderTop: `1px solid ${B.border}`,
            background: B.cotton,
          }}
        >
          <div
            style={{
              fontFamily: "'Instrument Sans',sans-serif",
              fontSize: 11,
              lineHeight: 1.65,
              color: "#C41E3A",
              fontWeight: 500,
              whiteSpace: "pre-line",
            }}
          >
            {LEGAL_DISCLAIMER}
            {"\n\n"}
            Model generated:{" "}
            {modelGeneratedAt.toLocaleString("en-US", {
              dateStyle: "long",
              timeStyle: "short",
            })}
            . Reflects compensation information as of this date.
          </div>
        </footer>
      </div>
    </>
  );
}