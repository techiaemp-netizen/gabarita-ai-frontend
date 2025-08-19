const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Melhorar compatibilidade com navegadores
  experimental: {
    forceSwcTransforms: true,
  },
  // Configurações para melhor compatibilidade
  swcMinify: true,
  reactStrictMode: true,
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

    if (dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig