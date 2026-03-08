import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  transpilePackages: ['@epde/shared'],
  rewrites: async () => [
    {
      source: '/api/v1/:path*',
      destination: `${process.env.API_PROXY_TARGET || 'http://localhost:3001'}/api/v1/:path*`,
    },
  ],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  disableLogger: true,
  tunnelRoute: '/monitoring',
});
