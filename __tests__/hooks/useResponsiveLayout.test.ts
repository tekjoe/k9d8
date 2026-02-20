import { renderHook } from '@testing-library/react-native';
import { useResponsiveLayout, BREAKPOINTS } from '../../src/hooks/useResponsiveLayout';
import { useWindowDimensions } from 'react-native';

jest.mock('react-native', () => ({
  useWindowDimensions: jest.fn(),
}));

const mockDimensions = useWindowDimensions as jest.Mock;

describe('useResponsiveLayout', () => {
  it('returns mobile layout for narrow screens', () => {
    mockDimensions.mockReturnValue({ width: 375 });
    const { result } = renderHook(() => useResponsiveLayout());
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.showSidebar).toBe(false);
  });

  it('returns tablet layout for medium screens', () => {
    mockDimensions.mockReturnValue({ width: 800 });
    const { result } = renderHook(() => useResponsiveLayout());
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.showSidebar).toBe(true);
  });

  it('returns desktop layout for wide screens', () => {
    mockDimensions.mockReturnValue({ width: 1200 });
    const { result } = renderHook(() => useResponsiveLayout());
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isLargeDesktop).toBe(false);
  });

  it('returns large desktop for wide screens', () => {
    mockDimensions.mockReturnValue({ width: 1500 });
    const { result } = renderHook(() => useResponsiveLayout());
    expect(result.current.isLargeDesktop).toBe(true);
    expect(result.current.isXLDesktop).toBe(false);
  });

  it('returns XL desktop for very wide screens', () => {
    mockDimensions.mockReturnValue({ width: 2000 });
    const { result } = renderHook(() => useResponsiveLayout());
    expect(result.current.isXLDesktop).toBe(true);
  });

  it('exports correct breakpoint values', () => {
    expect(BREAKPOINTS.MOBILE).toBe(768);
    expect(BREAKPOINTS.TABLET).toBe(1024);
    expect(BREAKPOINTS.LARGE_DESKTOP).toBe(1440);
    expect(BREAKPOINTS.XL_DESKTOP).toBe(1920);
  });
});
