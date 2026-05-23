export const colors = {
  primary: '#FA0F00',
  primaryDark: '#C20000',
  primaryLight: '#FF4F3F',

  dark: '#1D1D1D',
  darkGray: '#4A4A4A',
  midGray: '#6E6E6E',
  lightGray: '#C8C8C8',
  offWhite: '#F5F5F5',
  white: '#FFFFFF',

  border: '#E8E8E8',

  success: '#2D9D78',
  warning: '#E68619',
  error: '#E34850',
  info: '#1473E6',

  selectedOverlay: 'rgba(250, 15, 0, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.5)',

  statusPending: '#1473E6',
  statusReviewing: '#E68619',
  statusApproved: '#2D9D78',
  statusRejected: '#E34850',
};

export const typography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    hero: 44,
  },
  weights: {
    regular: 'AdobeClean-Regular' as const,
    medium: 'AdobeClean-Medium' as const,
    semibold: 'AdobeClean-Bold' as const,
    bold: 'AdobeClean-Bold' as const,
    heavy: 'AdobeClean-ExtraBold' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};
