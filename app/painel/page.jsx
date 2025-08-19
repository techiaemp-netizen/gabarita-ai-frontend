"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../../utils/auth';
import { useRouter } from 'next/navigation';
import ProgressBar from '../../components/ProgressBar';
import CardDesempenho from '../../components/CardDesempenho';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Painel (dashboard) page
 *
 * Shows the user's life bar, performance cards for each subject and
 * statistics for the current day using a bar chart. When the user is
 * not authenticated they are redirected back to the login page.
 */
export default function PainelPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [life, setLife] = useState(80);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const [performanceData, setPerformanceData] = useState([]);
  const [loadingPerformance, setLoadingPerformance] = useState(true);

  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/desempenho/materias`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setPerformanceData(data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de desempenho:', error);
      } finally {
        setLoadingPerformance(false);
      }
    };

    if (user) {
      loadPerformanceData();
    }
  }, [user]);

  return (
    <div className="p-4 flex flex-col space-y-6 flex-1">
      <div>
          <h2 className="text-xl font-medium mb-2">Sua Jornada</h2>
          <ProgressBar value={life} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingPerformance ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando dados de desempenho...</p>
          </div>
        ) : performanceData.length > 0 ? (
          performanceData.map((item, idx) => (
            <CardDesempenho
              key={idx}
              title={item.name}
              data={[{ name: 'Acertos', value: item.acertos }, { name: 'Erros', value: 100 - item.acertos }]}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-600">Nenhum dado de desempenho disponível ainda.</p>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Estatísticas de Hoje</h3>
        <div className="w-full h-60 bg-white rounded-xl shadow-sm p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ name: 'Acertos', value: 20 }, { name: 'Erros', value: 5 }]}> 
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3E8EFF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
