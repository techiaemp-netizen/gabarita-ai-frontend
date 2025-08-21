const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ];
  },
  images: {
    unoptimized: true,
  },
  // Melhorar compatibilidade com navegadores
  experimental: {
    forceSwcTransforms: true,
  },
  // Configuracoes para melhor compatibilidade
  swcMinify: true,
  reactStrictMode: false, // Desabilitar para evitar problemas de hidratação
  // Configurações para resolver problemas de chunk loading
  output: 'standalone',
  webpack: (config, { dev, isServer }) => {
    // Configurar alias para resolucao de modulos
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
