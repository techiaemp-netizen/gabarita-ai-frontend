'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Wrench } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Demo em Desenvolvimento
          </h1>
          <p className="text-gray-600">
            Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
          </p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-800 font-medium">Em breve</span>
          </div>
          <p className="text-blue-700 text-sm">
            Estamos trabalhando para trazer a melhor experiência de demonstração para você.
          </p>
        </div>
        
        <Link 
          href="/"
          className="inline-flex items-center justify-center w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}