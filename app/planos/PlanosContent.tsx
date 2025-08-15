// app/planos/PlanosContent.tsx

'use client'; // ESSENCIAL: Garante que este código só rode no cliente.

import { useSearchParams } from 'next/navigation';

// Este componente fará a leitura da URL e exibirá o conteúdo.
export default function PlanosContent() {
  const searchParams = useSearchParams();
  
  // Exemplo: pegando um parâmetro chamado 'plano' da URL. Ex: /planos?plano=premium
  const planoSelecionado = searchParams.get('plano');

  return (
    <div>
      <h2>Detalhes do Plano</h2>
      {planoSelecionado ? (
        <p>Você está visualizando o plano: <strong>{planoSelecionado}</strong></p>
      ) : (
        <p>Nenhum plano selecionado. Navegue para `/planos?plano=premium` para ver um exemplo.</p>
      )}
      
      {/* Coloque aqui o resto do conteúdo da sua página de planos */}
    </div>
  );
}