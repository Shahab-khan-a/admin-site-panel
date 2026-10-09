/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  agentRules: false,
  async redirects() {
    return [
      {
        source: '/notices/admin',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/notice-verification/admin',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/notices/:token/admin',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/notice-verification/:token/admin',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
