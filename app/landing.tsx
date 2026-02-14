import { Redirect } from 'expo-router';

// On non-web platforms, redirect to sign-in
// The landing page is only for web/SEO purposes
export default function LandingFallback() {
  return <Redirect href="/(auth)/sign-in" />;
}
