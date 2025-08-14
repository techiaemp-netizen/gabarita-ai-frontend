/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router é habilitado por padrão no Next.js 13+
  skipTrailingSlashRedirect: true,
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configuração experimental para resolver erro de useSearchParams
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  // Configurações para evitar conflitos com Vite
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  
  // Headers para evitar conflitos de CORS
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;