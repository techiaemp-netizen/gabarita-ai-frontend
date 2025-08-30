const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Configurações básicas para estabilidade
  swcMinify: true,
  reactStrictMode: false,
  // Desabilitar prefetch para evitar erros ERR_ABORTED
  experimental: {
    linkNoTouchStart: true,
  },
  // Configurações para resolver problemas de chunk loading
  webpack: (config, { dev, isServer }) => {
    // Configurar alias para resolução de módulos
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@/components': path.resolve(__dirname, 'components'),
      '@/contexts': path.resolve(__dirname, 'contexts'),
      '@/services': path.resolve(__dirname, 'services'),
      '@/types': path.resolve(__dirname, 'types'),
      '@/utils': path.resolve(__dirname, 'utils'),
      '@/config': path.resolve(__dirname, 'config'),
    };

    // Configurações para desenvolvimento
    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      // Melhorar cache e performance
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    
    return config;
  },
}

module.exports = nextConfig
