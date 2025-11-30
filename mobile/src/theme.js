// Theme colors
export const colors = {
  // Primary colors
  primary: '#F8C400', // Yellow color used in the app
  primaryDark: '#E6B400', // Darker shade of primary
  primaryLight: '#FFD633', // Lighter shade of primary
  
  // Secondary colors
  secondary: '#0C831F', // Green color used in the app
  secondaryDark: '#0A6E1A',
  secondaryLight: '#0E9A28',
  
  // Status colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  
  // Grayscale
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  mediumGray: '#9E9E9E',
  darkGray: '#424242',
  black: '#000000',
  
  // Backgrounds
  background: '#FFFFFF',
  surface: '#F8F8F8',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textOnPrimary: '#000000',
  textOnSecondary: '#FFFFFF',
  
  // Borders
  border: '#E0E0E0',
  divider: '#EEEEEE',
  
  // Other
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(0, 0, 0, 0.12)',
};

// Typography
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body1: {
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
