"""Export the KRA/KPI blueprint (artifacts/tools/kra_kpi_master.py) to src/data/framework.json.

Run from the lead-appraisal folder:
    python -I -c "exec(open('scripts/export_framework.py').read())"
"""
import json
import os
import sys

HERE = os.path.abspath(os.getcwd())
TOOLS = os.path.join(HERE, "..", "artifacts", "tools")
sys.path.insert(0, TOOLS)
import kra_kpi_master as M  # noqa: E402


def node(n):
    out = {k: v for k, v in n.items() if k != "children"}
    if "sample" in out:
        out["sample"] = list(out["sample"])
    out["children"] = [node(c) for c in n.get("children", [])]
    return out


data = {
    "meta": M.META,
    "designations": M.DESIGNATIONS,
    "ratings": [{"label": l, "score": s} for l, s in M.RATING5],
    "perfBands": [{"min": a, "band": b, "code": c, "meaning": d} for a, b, c, d in M.PERF_BANDS],
    "bands": {k: {**v, "rows": [list(r) for r in v["rows"]], "rubric": M.band_rubric(k)} for k, v in M.BANDS.items()},
    "components": [
        {**{k: v for k, v in c.items() if k != "kpis"}, "kpis": [node(k) for k in c["kpis"]]}
        for c in M.COMPONENTS
    ],
    "designationWeights": M.DESIGNATION_WEIGHTS,
    "weightRationale": M.WEIGHT_RATIONALE,
    "sample": {
        "profile": M.SAMPLE_PROFILE,
        "courses": [dict(zip(["course", "batch", "semester", "teiF", "teiDD", "passF", "passDD"], c)) for c in M.SAMPLE_COURSES],
        "workflow": [dict(zip(["stage", "status", "date", "by"], w)) for w in M.SAMPLE_WORKFLOW],
    },
    "lists": M.LISTS,
}

out = os.path.join(HERE, "src", "data", "framework.json")
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
print("wrote", out, sum(len(c["kpis"]) for c in data["components"]), "KPIs")
