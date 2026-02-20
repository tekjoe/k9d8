import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Default OG tags — crawlers see these since they don't run JS */}
        <title>k9d8 | Find Dog Parks &amp; Schedule Playdates Near You</title>
        <meta
          name="description"
          content="Connect with dog owners and schedule playdates with k9d8. Find nearby dog parks, see active dogs in your area, and message other owners."
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="k9d8" />
        <meta property="og:title" content="k9d8 | Find Dog Parks & Schedule Playdates Near You" />
        <meta
          property="og:description"
          content="Connect with dog owners and schedule playdates with k9d8. Find nearby dog parks, see active dogs in your area, and message other owners."
        />
        <meta property="og:image" content="https://k9d8.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://k9d8.com" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="k9d8 | Find Dog Parks & Schedule Playdates Near You" />
        <meta
          name="twitter:description"
          content="Connect with dog owners and schedule playdates with k9d8. Find nearby dog parks, see active dogs in your area, and message other owners."
        />
        <meta name="twitter:image" content="https://k9d8.com/og-image.png" />

        <ScrollViewStyleReset />

        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-2Q6H4SHDJS" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2Q6H4SHDJS');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
