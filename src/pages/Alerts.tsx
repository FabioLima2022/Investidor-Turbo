import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">Alertas e Sugestões</h2>
      <p className="text-neutral-500">Notificações importantes sobre seus ativos.</p>

      <div className="bg-white p-6 rounded-lg border border-neutral-200">
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
