// Golden check: engine must reproduce the Excel blueprint sample (Self 80.5 / Dy Dir 74.3 / Final 74.3).
// Run: npx tsx scripts/golden.test.ts
import { sampleAppraisal, summarize, bandLookup, perfBand } from "../src/lib/scoring";
import { COMPONENTS } from "../src/lib/framework";

const s = summarize(sampleAppraisal(), "Assistant Professor");
const r = s.fpi.map((x) => Math.round(x * 10) / 10);
for (const c of COMPONENTS) console.log(c.id.padEnd(5), s.components[c.id].map((x) => x.toFixed(1)).join("  "));
console.log("FPI", r, perfBand(s.fpi[0]).code, perfBand(s.fpi[2]).code);

const checks: [string, boolean][] = [
  ["FPI self 80.5", r[0] === 80.5],
  ["FPI dd 74.3", r[1] === 74.3],
  ["FPI final 74.3", r[2] === 74.3],
  ["self band EE", perfBand(s.fpi[0]).code === "EE"],
  ["final band SME", perfBand(s.fpi[2]).code === "SME"],
  ["TEI 82% -> 80", bandLookup("Band_TEI", 0.82) === 80],
  ["7 admissions -> 40", bandLookup("Legacy_Admissions", 7) === 40],
];
let ok = true;
for (const [n, p] of checks) {
  console.log(p ? "PASS" : "FAIL", n);
  ok &&= p;
}
process.exit(ok ? 0 : 1);
