/**
 * Westgard Multi-Rules Statistical QC Engine
 * Standard algorithm for clinical laboratory medicine & NABL ISO 15189 compliance.
 * 
 * Rules Evaluated:
 * 1. 1_3s: One control reading exceeds +/- 3s (Random error or severe shift) -> REJECT
 * 2. 1_2s: One control reading exceeds +/- 2s (Warning screening rule) -> WARNING
 * 3. 2_2s: Two consecutive control readings exceed +2s or two exceed -2s -> REJECT
 * 4. R_4s: Difference between current and previous control exceeds 4s -> REJECT
 * 5. 4_1s: Four consecutive control readings exceed +1s or four exceed -1s -> REJECT (Systematic shift)
 * 6. 10_x: Ten consecutive control readings fall on the same side of the mean -> REJECT (Systematic drift)
 */

export function evaluateWestgardRules(newObservedValue, targetMean, targetSD, historicalRuns = []) {
  const zScore = Number(((newObservedValue - targetMean) / targetSD).toFixed(2));
  const absZ = Math.abs(zScore);

  // Extract previous z-scores chronologically
  const previousZScores = historicalRuns
    .map(r => r.zScore)
    .filter(z => typeof z === 'number' && !isNaN(z));

  // Prepend current zScore to have index 0 as current, index 1 as previous, etc.
  const series = [zScore, ...previousZScores.slice(-12).reverse()];

  // 1. Check 1_3s Rule (Out of control: random or severe systematic error)
  if (absZ > 3.0) {
    return {
      zScore,
      status: 'OUT_OF_CONTROL',
      violationRule: '1_3s',
      violationDescription: `1_3s Rule Violated: Observation is ${absZ} SDs from mean (> 3.0s). Immediate analyzer halt & recalibration required.`
    };
  }

  // 2. Check 2_2s Rule (Two consecutive runs > +2s or two consecutive < -2s)
  if (series.length >= 2) {
    const z1 = series[0];
    const z2 = series[1];
    if ((z1 > 2.0 && z2 > 2.0) || (z1 < -2.0 && z2 < -2.0)) {
      return {
        zScore,
        status: 'OUT_OF_CONTROL',
        violationRule: '2_2s',
        violationDescription: '2_2s Rule Violated: Two consecutive QC runs exceeded 2 SDs on the same side. Systematic error detected.'
      };
    }
  }

  // 3. Check R_4s Rule (Range of 2 consecutive runs > 4s: one > +2s and other < -2s)
  if (series.length >= 2) {
    const range = Math.abs(series[0] - series[1]);
    if (range >= 4.0) {
      return {
        zScore,
        status: 'OUT_OF_CONTROL',
        violationRule: 'R_4s',
        violationDescription: `R_4s Rule Violated: Range between consecutive controls is ${range.toFixed(1)}s (>= 4s). Random error detected.`
      };
    }
  }

  // 4. Check 4_1s Rule (Four consecutive runs > +1s or four consecutive < -1s)
  if (series.length >= 4) {
    const last4 = series.slice(0, 4);
    const allHigh = last4.every(z => z > 1.0);
    const allLow = last4.every(z => z < -1.0);
    if (allHigh || allLow) {
      return {
        zScore,
        status: 'OUT_OF_CONTROL',
        violationRule: '4_1s',
        violationDescription: `4_1s Rule Violated: Four consecutive QC runs exceeded 1 SD on the ${allHigh ? 'positive' : 'negative'} side. Systematic shift detected.`
      };
    }
  }

  // 5. Check 10_x Rule (Ten consecutive runs on same side of mean)
  if (series.length >= 10) {
    const last10 = series.slice(0, 10);
    const allPositive = last10.every(z => z > 0);
    const allNegative = last10.every(z => z < 0);
    if (allPositive || allNegative) {
      return {
        zScore,
        status: 'OUT_OF_CONTROL',
        violationRule: '10_x',
        violationDescription: `10_x Rule Violated: Ten consecutive QC runs are biased on the ${allPositive ? 'positive' : 'negative'} side of mean. Systematic calibration drift detected.`
      };
    }
  }

  // 6. Check 1_2s Rule (Warning: between 2s and 3s)
  if (absZ > 2.0 && absZ <= 3.0) {
    return {
      zScore,
      status: 'WARNING',
      violationRule: '1_2s',
      violationDescription: `1_2s Warning Rule: Value is at ${absZ} SDs from mean (> 2.0s). Inspect reagent lots and inspect next control run.`
    };
  }

  // 7. All Westgard Rules Pass
  return {
    zScore,
    status: 'IN_CONTROL',
    violationRule: null,
    violationDescription: 'In Control: Observation is within acceptable analytical tolerance.'
  };
}
