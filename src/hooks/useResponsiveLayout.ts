import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  LARGE_DESKTOP: 1440,
  XL_DESKTOP: 1920,
} as const;

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();

  const isMobile = width < BREAKPOINTS.MOBILE;
  const isTablet = width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET;
  const isDesktop = width >= BREAKPOINTS.TABLET;
  const isLargeDesktop = width >= BREAKPOINTS.LARGE_DESKTOP;
  const isXLDesktop = width >= BREAKPOINTS.XL_DESKTOP;
  const showSidebar = width >= BREAKPOINTS.MOBILE;

  return { isMobile, isTablet, isDesktop, isLargeDesktop, isXLDesktop, showSidebar, width };
}
