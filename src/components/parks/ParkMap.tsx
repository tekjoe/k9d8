// Platform-specific exports for ParkMap
// This file exists to satisfy TypeScript in cross-platform code
// Actual implementations are in ParkMap.web.tsx and ParkMap.native.tsx

export { default } from './ParkMap.native';
export type { ParkMapProps } from './ParkMap.web';
