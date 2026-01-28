/**
 * Professional color palette for industrial P&ID application
 * Based on Material Design with industrial modifications
 */

export const COLORS = {
  // Primary palette (Professional blue for technical applications)
  primary: {
    main: '#1976D2',      // Primary blue
    light: '#42A5F5',     // Lighter blue
    dark: '#1565C0',      // Darker blue
    contrast: '#FFFFFF',  // Text on primary
  },
  
  // Secondary palette (Industrial green for success/active states)
  secondary: {
    main: '#388E3C',      // Industrial green
    light: '#66BB6A',     // Light green
    dark: '#2E7D32',      // Dark green
    contrast: '#FFFFFF',
  },
  
  // Neutral palette (Professional grays)
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Semantic colors (Industrial standard)
  status: {
    normal: '#4CAF50',      // Green - Normal operation
    warning: '#FF9800',     // Orange - Warning
    alarm: '#F44336',       // Red - Alarm
    disabled: '#9E9E9E',    // Gray - Disabled
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',     // Main background
    secondary: '#F5F7FA',   // Secondary background
    tertiary: '#ECEFF1',    // Tertiary background (panels)
    dark: '#263238',        // Dark backgrounds (toolbar)
  },
  
  // Border colors
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#757575',
  },
  
  // Mode-specific colors
  mode: {
    edit: '#1976D2',        // Blue for edit mode
    runtime: '#388E3C',     // Green for runtime mode
  },
} as const;

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
} as const;

export const BORDER_RADIUS = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
} as const;

export const SHADOWS = {
  sm: '0 1px 3px rgba(0,0,0,0.12)',
  md: '0 2px 6px rgba(0,0,0,0.15)',
  lg: '0 4px 12px rgba(0,0,0,0.18)',
} as const;

export const TRANSITIONS = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '350ms ease',
} as const;
