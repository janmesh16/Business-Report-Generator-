import { ParsedSource } from '../parsers/types.js';
import { DataQuality } from '../llm/types.js';

export function evaluateDataQuality(sources: ParsedSource[]): DataQuality {
  const issues: string[] = [];
  let penaltyPoints = 0;

  if (sources.length === 0) {
    return {
      confidence: 'low',
      issues: ['No input data sources provided.'],
    };
  }

  for (const src of sources) {
    if (src.isScannedOrEmpty) {
      issues.push(`Document "${src.name}" has no extractable text (likely an image-based or scanned PDF).`);
      penaltyPoints += 3;
    }

    if (src.type === 'csv' || src.type === 'excel') {
      const table = src.activeTable;
      if (!table || table.rows.length === 0) {
        issues.push(`File "${src.name}" contains 0 data rows.`);
        penaltyPoints += 3;
        continue;
      }

      // 1. Sample Size Check
      if (table.rows.length < 5) {
        issues.push(`Dataset "${src.name}" has a very small sample size (${table.rows.length} rows), limiting statistical confidence.`);
        penaltyPoints += 2;
      } else if (table.rows.length < 15) {
        issues.push(`Dataset "${src.name}" has a modest sample size (${table.rows.length} rows).`);
        penaltyPoints += 1;
      }

      // 2. Null Value Check
      let totalCells = 0;
      let nullCells = 0;
      for (const row of table.rows) {
        for (const col of table.headers) {
          totalCells += 1;
          const val = row[col];
          if (val === null || val === undefined || val === '') {
            nullCells += 1;
          }
        }
      }

      const nullRate = totalCells > 0 ? (nullCells / totalCells) * 100 : 0;
      if (nullRate > 20) {
        issues.push(`Dataset "${src.name}" contains ${nullRate.toFixed(1)}% missing values across cells.`);
        penaltyPoints += 2;
      } else if (nullRate > 5) {
        issues.push(`Minor missing values (${nullRate.toFixed(1)}%) observed in "${src.name}".`);
        penaltyPoints += 1;
      }

      // 3. Duplicate Rows Check
      const seen = new Set<string>();
      let dupes = 0;
      for (const row of table.rows) {
        const rowStr = JSON.stringify(row);
        if (seen.has(rowStr)) {
          dupes += 1;
        } else {
          seen.add(rowStr);
        }
      }
      if (dupes > 0) {
        issues.push(`Found ${dupes} exact duplicate row(s) in "${src.name}".`);
        penaltyPoints += 1;
      }
    }

    if (src.type === 'text') {
      if (!src.extractedText || src.extractedText.length < 100) {
        issues.push(`Text notes in "${src.name}" are brief (< 100 characters), offering limited contextual grounding.`);
        penaltyPoints += 1;
      }
    }
  }

  // Determine overall confidence
  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (penaltyPoints >= 4) {
    confidence = 'low';
  } else if (penaltyPoints >= 2) {
    confidence = 'medium';
  }

  if (issues.length === 0) {
    issues.push('All source records validated successfully with complete column mapping and no anomalies.');
  }

  return {
    confidence,
    issues,
  };
}

