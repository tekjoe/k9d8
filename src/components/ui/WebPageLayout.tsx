import React from 'react';
import { ScrollView, View } from 'react-native';
import DesktopSidebar from './DesktopSidebar';
import { useResponsiveLayout } from '@/src/hooks/useResponsiveLayout';

interface WebPageLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
  /** Render a custom header above the scrollable content */
  header?: React.ReactNode;
  /** Disable the built-in ScrollView (for pages that manage their own scrolling) */
  noScroll?: boolean;
}

export default function WebPageLayout({
  children,
  maxWidth = 1200,
  header,
  noScroll = false,
}: WebPageLayoutProps) {
  const { isMobile, isTablet, showSidebar } = useResponsiveLayout();

  const padding = isMobile ? 16 : isTablet ? 32 : 48;

  const content = noScroll ? (
    <View style={{ flex: 1, padding, maxWidth, width: '100%', alignSelf: 'center' }}>
      {children}
    </View>
  ) : (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        padding,
        maxWidth,
        width: '100%',
        alignSelf: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F4F1' }}>
      {showSidebar && <DesktopSidebar />}
      <View style={{ flex: 1 }}>
        {header}
        {content}
      </View>
    </View>
  );
}
