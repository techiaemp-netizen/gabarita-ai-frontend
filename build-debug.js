#!/usr/bin/env node

// Script de build verboso para diagnóstico no Vercel
console.log('=== DIAGNÓSTICO BUILD VERCEL ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Memory usage:', process.memoryUsage());
console.log('Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- VERCEL:', process.env.VERCEL);
console.log('- VERCEL_ENV:', process.env.VERCEL_ENV);
console.log('- CI:', process.env.CI);
console.log('- npm_config_cache:', process.env.npm_config_cache);

// Aumentar limite de memória
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Habilitar debug do Next.js e Webpack
process.env.DEBUG = 'next:*,webpack:*';
process.env.NEXT_DEBUG = '1';

console.log('\n=== INICIANDO BUILD COM DEBUG ===');

const { spawn } = require('child_process');

const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=4096',
    DEBUG: 'next:*,webpack:*',
    NEXT_DEBUG: '1'
  }
});

buildProcess.on('error', (error) => {
  console.error('\n=== ERRO NO PROCESSO DE BUILD ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

buildProcess.on('exit', (code, signal) => {
  console.log('\n=== BUILD FINALIZADO ===');
  console.log('Exit code:', code);
  console.log('Signal:', signal);
  console.log('Final memory usage:', process.memoryUsage());
  
  if (code !== 0) {
    console.error('Build falhou com código:', code);
    process.exit(code);
  }
  
  console.log('Build concluído com sucesso!');
});