import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { listPortfolios, PortfolioRecord } from '@/services/portfolios';

type Dividend = {
  asset_id: string;
  ex_date: string;
  payment_date: string;
  amount_per_share: number;
  total_amount: number;
  currency: string;
  assets?: { symbol: string; name: string };
};

export function Income() {
  const { user } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string>('');

  const portfoliosQuery = useQuery({
    queryKey: ['portfolios', user?.id],
    queryFn: () => listPortfolios(user!),
    enabled: !!user,
  });

  const assetsQuery = useQuery({
    queryKey: ['portfolio_assets', selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const { data, error } = await supabase
        .from('portfolio_assets')
        .select('asset_id')
        .eq('portfolio_id', selectedId);
      if (error) throw error;
      return (data ?? []) as { asset_id: string }[];
    },
    enabled: !!selectedId,
  });

  const dividendsQuery = useQuery({
    queryKey: ['dividends', selectedId, assetsQuery.data],
    queryFn: async () => {
      const ids = (assetsQuery.data as { asset_id: string }[] | undefined)?.map(a => a.asset_id) ?? [];
      if (!selectedId || ids.length === 0) return [];
      const { data, error } = await supabase
        .from('dividend_history')
        .select('asset_id, ex_date, payment_date, amount_per_share, total_amount, currency, assets:asset_id(symbol,name)')
        .in('asset_id', ids)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Dividend[];
    },
    enabled: !!selectedId && !!assetsQuery.data,
  });

  useEffect(() => {
    const first = (portfoliosQuery.data as PortfolioRecord[])?.[0];
    if (first) setSelectedId(first.id);
  }, [portfoliosQuery.data]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">Renda e Dividendos</h2>
      <p className="text-neutral-500">Acompanhe seus recebimentos mensais.</p>

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
        </div>

        {dividendsQuery.isLoading ? (
          <p className="text-neutral-500">Carregando dividendos...</p>
        ) : (dividendsQuery.data as Dividend[])?.length === 0 ? (
          <p className="text-neutral-500">Nenhum dividendo encontrado para os ativos desta carteira.</p>
        ) : (
          <div className="space-y-3">
            {(dividendsQuery.data as Dividend[]).map((d, i) => (
              <div key={i} className="border border-neutral-100 rounded-md p-3 flex justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{d.assets?.name} ({d.assets?.symbol})</p>
                  <p className="text-xs text-neutral-500">Ex: {new Date(d.ex_date).toLocaleDateString('pt-BR')} • Pag: {new Date(d.payment_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="text-sm text-neutral-700">
                  Total: {d.currency} {d.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
