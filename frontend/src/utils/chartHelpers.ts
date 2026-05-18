// Shared D3 styling constants for dark-theme charts.
export const CHART_MARGIN = { top: 16, right: 24, bottom: 38, left: 52 };

export const GRID_STROKE   = 'rgba(255,255,255,0.05)';
export const AXIS_STROKE   = 'rgba(255,255,255,0.07)';
export const TICK_FILL     = '#556070';
export const LABEL_FILL    = '#445566';
export const CHART_FONT    = 'system-ui, sans-serif';
export const SURFACE_COLOR = '#111c2d'; // matches --surface token

export const SEVERITY_COLOR: Record<string, string> = {
  critical: '#f87171',
  warning:  '#fbbf24',
  info:     '#60a5fa',
};

export function getSeverityColor(severity: string): string {
  return SEVERITY_COLOR[severity] ?? '#556070';
}
