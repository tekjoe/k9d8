jest.mock('../../../src/lib/supabase');
jest.mock('expo-router/head', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

import React from 'react';
import { Platform } from 'react-native';
import { render } from '@testing-library/react-native';
import StructuredData, { placeSchema, breadcrumbSchema, faqPageSchema, organizationSchema, mobileAppSchema } from '../../../src/components/seo/StructuredData';

describe('StructuredData', () => {
  it('renders null on non-web platforms', () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'ios';
    const { toJSON } = render(
      <StructuredData data={{ '@type': 'Place', name: 'Test' }} />
    );
    expect(toJSON()).toBeNull();
    (Platform as any).OS = originalOS;
  });

  it('renders on web platform', () => {
    const originalOS = Platform.OS;
    (Platform as any).OS = 'web';
    const { toJSON } = render(
      <StructuredData data={{ '@type': 'Place', name: 'Test' }} />
    );
    expect(toJSON()).toBeDefined();
    (Platform as any).OS = originalOS;
  });
});

describe('Schema helper functions', () => {
  it('placeSchema generates correct structure', () => {
    const schema = placeSchema({
      name: 'Test Park',
      description: 'A park',
      address: '123 Main St',
      latitude: 37.77,
      longitude: -122.41,
    });
    expect(schema['@type']).toBe('Place');
    expect(schema.name).toBe('Test Park');
    expect(schema.geo.latitude).toBe(37.77);
  });

  it('breadcrumbSchema generates correct structure', () => {
    const schema = breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Parks', url: '/parks' },
    ]);
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0].position).toBe(1);
  });

  it('faqPageSchema generates correct structure', () => {
    const schema = faqPageSchema([
      { question: 'Q1?', answer: 'A1' },
    ]);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity).toHaveLength(1);
  });

  it('organizationSchema generates correct structure', () => {
    const schema = organizationSchema();
    expect(schema['@type']).toBe('Organization');
    expect(schema.name).toBe('k9d8');
  });

  it('mobileAppSchema generates correct structure', () => {
    const schema = mobileAppSchema();
    expect(schema['@type']).toBe('MobileApplication');
    expect(schema.name).toBe('k9d8');
  });
});
