/**
 * Ownership record for every known divergence group.
 *
 * A divergence group is a *class* of defect, not a single failing case. Keeping
 * the mapping here lets the conformance suite refuse a divergence that has no
 * owner: if a new class of drift is discovered, it must be classified against a
 * defect id and a remediation phase before the backlog can accept it.
 */
export interface DefectOwnership {
  /** Identifier used throughout the audit report and the remediation plan. */
  readonly defect: string;
  /** Remediation phase expected to remove the divergence. */
  readonly phase: string;
}

export const GROUP_OWNERSHIP: Readonly<Record<string, DefectOwnership>> = {
  'numeric-tower': { defect: 'D4', phase: 'Phase 3' },
  'logical-typing': { defect: 'D5', phase: 'Phase 3' },
  equality: { defect: 'D6', phase: 'Phase 3' },
  'division-by-zero': { defect: 'D13', phase: 'Phase 3' },
  'grammar-strictness': { defect: 'D12', phase: 'Phase 4' },
  collections: { defect: 'D35', phase: 'Phase 4' },
  'java-string-methods': { defect: 'D37', phase: 'Phase 6' },
  'long-precision': { defect: 'D38', phase: 'Phase 3' },
  'type-surface': { defect: 'D40', phase: 'Phase 7' },
};

export function ownershipOf(group: string): DefectOwnership | undefined {
  return GROUP_OWNERSHIP[group];
}
