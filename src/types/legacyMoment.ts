export interface LegacyMoment {
  type: 'specificDate' | 'ifImGone';
  value: string; // Date string for specificDate, interval for ifImGone
  label: string; // Human-readable description
}

export const IF_IM_GONE_OPTIONS = [
  { value: '6months', label: '6 Months' },
  { value: 'annual', label: '1 Year (Annual)' },
  { value: '2years', label: '2 Years' },
  { value: '3years', label: '3 Years' }
] as const;