# LEAD Faculty Appraisal — Wave 0 demo

Clickable demo of the new appraisal platform. No sign-in: it opens on the Faculty dashboard; switch roles from the top-right menu.

## Run it

```
npm install        # first time only
npm run build
npm run start      # then open http://localhost:3000
```

For live editing use `npm run dev` instead.

## What's inside

- `src/data/framework.json`: the real KRA/KPI framework, exported from `../artifacts/tools/kra_kpi_master.py`
  (`python -I -c "exec(open('scripts/export_framework.py').read())"`).
- `src/lib/scoring.ts`: scoring engine ported from the Excel blueprint formulas.
  `npx tsx scripts/golden.test.ts` checks it reproduces the workbook (Self 80.5 / Dy Dir 74.3 / Final 74.3).
- `src/lib/mock.ts`: 24 illustrative faculty. The signed-in faculty carries the Excel sample values.
- Demo changes are kept in the browser (localStorage). "Reset demo data" in the sidebar restores the start state.

## Demo walk-through

1. **Faculty:** dashboard → My Appraisal (edit any KPI and watch the score move; each KPI shows whether evidence is Required, Optional or auto-verified) → Review & submit (blocked until required evidence is attached) → "Continue demo as Deputy Director".
2. **Deputy Director:** review queue → change a validated value, add a comment → Validate & forward.
3. **Director:** institution dashboard → Approvals → rate MOA → Approve (or bulk approve).
4. **Admin:** cycles and the New-cycle wizard, Users & Roles, Framework Studio → Edit weights (draft → 100% checks → impact preview → publish with Director approval; the new version applies from the next cycle, the running cycle is unchanged).
