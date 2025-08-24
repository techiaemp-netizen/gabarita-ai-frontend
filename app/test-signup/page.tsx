'use client';

import React from 'react';

export default function TestSignupPage() {
  return (
    <div className="min-h-screen bg-red-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Página de Teste - Cadastro</h1>
        <p className="text-gray-700">Esta é uma página de teste para verificar se o roteamento está funcionando.</p>
        <div className="mt-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Botão de Teste
          </button>
        </div>
      </div>
    </div>
  );
}