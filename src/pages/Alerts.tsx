import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

type Alert = {
  id: string;
  user_id: string;
  alert_type: 'dividend_drop' | 'volatility_increase' | 'price_target' | 'portfolio_deviation';
  asset_symbol: string | null;
  threshold_value: number | null;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
};

export function Alerts() {
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ type: string; symbol: string; threshold: number | '' }>({ type: 'price_target', symbol: '', threshold: '' });

  const alertsQuery = useQuery({
    queryKey: ['alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Alert[];
    },
    enabled: !!user,
  });

  async function createAlert() {
    try {
      setError(null);
      setCreating(true);
      const { error } = await supabase
        .from('alerts')
        .insert({
          user_id: user!.id,
          alert_type: form.type,
          asset_symbol: form.symbol || null,
          threshold_value: typeof form.threshold === 'number' ? form.threshold : null,
          is_active: true,
        });
      if (error) throw error;
      await alertsQuery.refetch();
      setForm({ type: 'price_target', symbol: '', threshold: '' });
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar alerta');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">Alertas e Sugestões</h2>
      <p className="text-neutral-500">Notificações importantes sobre seus ativos.</p>

      <div className="bg-white p-6 rounded-lg border border-neutral-200 space-y-4">
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-sm text-neutral-700">Tipo</label>
            <select className="mt-1 w-full border border-neutral-300 rounded px-2 py-1 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="price_target">Preço Alvo</option>
              <option value="dividend_drop">Queda de Dividendo</option>
              <option value="volatility_increase">Aumento de Volatilidade</option>
              <option value="portfolio_deviation">Desvio da Carteira</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-neutral-700">Símbolo (opcional)</label>
            <input className="mt-1 w-full border border-neutral-300 rounded px-2 py-1 text-sm" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="VALE3, ITUB4, AAPL" />
          </div>
          <div>
            <label className="text-sm text-neutral-700">Limite (opcional)</label>
            <input type="number" className="mt-1 w-full border border-neutral-300 rounded px-2 py-1 text-sm" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value ? Number(e.target.value) : '' })} placeholder="ex.: 100.00" />
          </div>
          <div>
            <button onClick={createAlert} className="bg-primary text-white px-3 py-2 rounded text-sm hover:bg-primary-600" disabled={creating}>Adicionar Alerta</button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        {alertsQuery.isLoading ? (
          <p className="text-neutral-500">Carregando alertas...</p>
        ) : (alertsQuery.data as Alert[])?.length === 0 ? (
          <p className="text-neutral-500">Nenhum alerta configurado.</p>
        ) : (
          <div className="space-y-3">
            {(alertsQuery.data as Alert[]).map((a) => (
              <div key={a.id} className="border border-neutral-100 rounded-md p-3 flex justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{a.alert_type}</p>
                  <p className="text-xs text-neutral-500">
                    {a.asset_symbol ? `Ativo: ${a.asset_symbol}` : 'Geral'} • Limite: {a.threshold_value ?? '-'}
                  </p>
                </div>
                <span className={`text-xs font-medium ${a.is_active ? 'text-green-600' : 'text-neutral-500'}`}>
                  {a.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
