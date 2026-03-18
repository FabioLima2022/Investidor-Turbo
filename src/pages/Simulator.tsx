import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listPortfolios, PortfolioRecord } from '@/services/portfolios';

type Simulation = {
  id: string;
  portfolio_id: string;
  period_months: number;
  scenario: 'conservative' | 'moderate' | 'aggressive';
  initial_projection: number;
  monthly_projection: number;
  monthly_breakdown: any;
  created_at: string;
};

export function Simulator() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);

  const portfoliosQuery = useQuery({
    queryKey: ['portfolios', user?.id],
    queryFn: () => listPortfolios(user!),
    enabled: !!user,
  });

  const simulationsQuery = useQuery({
    queryKey: ['simulations', selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .eq('portfolio_id', selectedId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Simulation[];
    },
    enabled: !!selectedId,
  });

  useEffect(() => {
    const first = (portfoliosQuery.data as PortfolioRecord[])?.[0];
    if (first) setSelectedId(first.id);
  }, [portfoliosQuery.data]);

  async function createBaseline() {
    try {
      setCreateError(null);
      if (!selectedId) return;
      const months = 12;
      const scenario: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
      const { data: portfolio } = await supabase
        .from('portfolios')
        .select('initial_amount, monthly_contribution')
        .eq('id', selectedId)
        .single();
      const initial = portfolio?.initial_amount ?? 0;
      const monthly = portfolio?.monthly_contribution ?? 0;
      let total = initial;
      const breakdown: { month: number; amount: number }[] = [];
      for (let m = 1; m <= months; m++) {
        total += monthly;
        breakdown.push({ month: m, amount: total });
      }
      const { error } = await supabase
        .from('simulations')
        .insert({
          portfolio_id: selectedId,
          period_months: months,
          scenario,
          initial_projection: initial,
          monthly_projection: monthly,
          monthly_breakdown: breakdown,
        });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['simulations', selectedId] });
    } catch (e: any) {
      setCreateError(e?.message || 'Erro ao criar simulação');
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">Simulador Financeiro</h2>
      <p className="text-neutral-500">Projeções de crescimento patrimonial e renda passiva.</p>

      <div className="bg-white p-6 rounded-lg border border-neutral-200 space-y-4">
        <div className="flex items-center space-x-3">
          <label className="text-sm text-neutral-700">Carteira:</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="border border-neutral-300 rounded-md px-3 py-2 text-sm"
          >
            {(portfoliosQuery.data as PortfolioRecord[] | undefined)?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            )) || <option value="">Nenhuma carteira</option>}
          </select>
          <button
            onClick={createBaseline}
            className="ml-auto bg-primary hover:bg-primary-600 text-white px-3 py-2 rounded-md text-sm"
            disabled={!selectedId}
          >
            Criar simulação inicial
          </button>
        </div>
        {createError && <p className="text-sm text-red-600">{createError}</p>}

        {simulationsQuery.isLoading ? (
          <p className="text-neutral-500">Carregando simulações...</p>
        ) : (simulationsQuery.data as Simulation[])?.length === 0 ? (
          <p className="text-neutral-500">Nenhuma simulação encontrada para esta carteira.</p>
        ) : (
          <div className="space-y-3">
            {(simulationsQuery.data as Simulation[]).map((s) => (
              <div key={s.id} className="border border-neutral-100 rounded-md p-3">
                <p className="text-sm font-medium text-neutral-900">
                  {s.period_months} meses • {s.scenario}
                </p>
                <p className="text-xs text-neutral-500">
                  Inicial: R$ {s.initial_projection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • Mensal: R$ {s.monthly_projection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
