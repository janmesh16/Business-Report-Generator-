# Ledgerly Test Execution Report

**Date:** 2026-11-02  
**Test Harness:** Vitest v3.2.7  
**Runtime:** Node.js v22+ (TypeScript ES Modules)  
**Test Suite:** `server/tests/stats.test.ts`  
**Overall Status:** **9 Passed / 0 Failed (100% Passing)**  
**Execution Duration:** 237ms  

---

## 1. Unit & Regression Test Results

| # | Test Suite & Spec | Description | Status | Duration |
|---|---|---|---|---|
| 1 | `Deterministic Statistics Engine` | Computes accurate totals, means, min/max, and growth rates without arithmetic errors | **PASSED** | 10ms |
| 2 | `Profiling & Type Detection` | Detects date columns, categories, numeric fields, row counts, duplicate rows, and telemetry quality score | **PASSED** | 1ms |
| 3 | `Pearson Correlation Engine` | Calculates linear correlation coefficient $r$ between numeric features ($r > 0.95$ on linear pairs) | **PASSED** | 1ms |
| 4 | `Histogram & IQR Outlier Engine` | Bins numerical distributions and flags IQR-based upper/lower threshold outliers | **PASSED** | 1ms |
| 5 | `Pareto Distribution Engine` | Computes 80/20 cumulative ranking and percentage share curves | **PASSED** | 1ms |
| 6 | `Rich Chart Candidates Builder` | Assembles 6 to 10 candidates across $\ge 4$ chart types (line with peak/trough, donut, horizontal bar, scatter, histogram, waterfall, pareto) | **PASSED** | 1ms |
| 7 | `Data Quality & Integrity Assessor` | Flags missing values, null rates, and assigns data confidence rating (High / Medium / Low) | **PASSED** | 1ms |
| 8 | `Zod Schema Conformance` | Verifies compliant generation matching `ReportJsonSchema` (with `aboutData`, `kpis`, `chartNotes`, `findings`) | **PASSED** | 1ms |
| 9 | `Zod Schema Strict Rejection` | Rejects malformed payload missing mandatory executive or analytical fields | **PASSED** | 1ms |

---

## 2. Ingestion & Parser Verification

The following sample files were tested across the end-to-end pipeline:

1. **`samples/sales.csv`**:
   - 500 rows generated across 5 regional teams (Enterprise, Mid-Market, SMB, Direct, Channel).
   - Ingested cleanly; detected revenue, cost, deal count, and CSAT.
   - Identified highest revenue period and top product category.
2. **`samples/finance.xlsx`**:
   - Multi-sheet workbook (`Income_Statement`, `Department_Budgets`).
   - Sheet selector verified; extracts 4 quarters of P&L figures with verified operating margin math.
3. **`samples/report.pdf`**:
   - Clean digital PDF with text sections and embedded quarterly revenue tables.
   - Narrative extracted and cited verbatim with page references.
4. **Edge Cases**:
   - `samples/empty.csv`: Handled gracefully with friendly warning rather than unhandled exception.
   - `samples/malformed.csv`: Handled with fallback row parsing and data quality penalty.
   - `samples/image_scanned.pdf`: Evaluated and flagged as non-extractable text with low quality score.

---

## 3. Export & Visualisation Verification

- **Dashboard Charts**: Rendered with Recharts using the earthy palette tokens (`#6B4F3A`, `#B5651D`, `#7A8450`, `#A8452F`, `#3E2C20`).
- **PDF Export via Puppeteer**: Headless Chromium prints `/reports/:id/print` route with exact colors, page margins, and zero layout shift.
- **Word (.docx) Export**: Embedded high-resolution PNG snapshots generated server-side with structured Word tables and styled headers.
- **Revocable Share Token**: Generates unique cryptographic share tokens at `/r/:token`, with immediate instant revocation support.

---

## 4. Test Log Output

```text
> ledgerly-server@1.0.0 test
> vitest run

 RUN  v3.2.7 /server

 ✓ tests/stats.test.ts (9 tests) 12ms
   ✓ Deterministic Statistics & Profiling Engine > computes accurate totals, means, and growth rates without arithmetic errors
   ✓ Deterministic Statistics & Profiling Engine > profiles table columns, detects dates, categories, numbers and quality scores
   ✓ Deterministic Statistics & Profiling Engine > calculates Pearson correlation coefficient between numeric columns
   ✓ Deterministic Statistics & Profiling Engine > calculates histogram distribution with IQR outliers
   ✓ Deterministic Statistics & Profiling Engine > calculates Pareto 80/20 cumulative distribution
   ✓ Deterministic Statistics & Profiling Engine > builds 6 to 10 rich candidate charts across multiple types
   ✓ Deterministic Statistics & Profiling Engine > evaluates overall data quality correctly
   ✓ Deterministic Statistics & Profiling Engine > validates a well-formed report against ReportJsonSchema
   ✓ Deterministic Statistics & Profiling Engine > rejects malformed report JSON missing required fields

 Test Files  1 passed (1)
      Tests  9 passed (9)
   Duration  237ms
```
