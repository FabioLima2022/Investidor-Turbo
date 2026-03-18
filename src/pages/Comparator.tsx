import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { listPortfolios, PortfolioRecord } from '@/services/portfolios';

export function Comparator() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['portfolios', user?.id],
    queryFn: () => listPortfolios(user!),
    enabled: !!user,
  });

  const items = (data as PortfolioRecord[] | undefined) ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900">Comparador de Carteiras</h2>
      <p className="text-neutral-500">Compare estratégias e rentabilidade.</p>

      {isLoading ? (
        <p className="text-neutral-500">Carregando carteiras...</p>
      ) : items.length < 2 ? (
        <p className="text-neutral-500">Crie pelo menos duas carteiras para comparar.</p>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <div className="grid grid-cols-3 gap-2 text-sm font-medium text-neutral-700 mb-2">
            <div>Carteira</div>
            <div className="text-right">Aporte Inicial</div>
            <div className="text-right">Aporte Mensal</div>
          </div>
          <div className="space-y-2">
            {items.map((p) => (
              <div key={p.id} className="grid grid-cols-3 gap-2 text-sm">
                <div className="font-medium text-neutral-900">{p.name}</div>
                <div className="text-right">R$ {p.initial_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="text-right text-primary-600">R$ {p.monthly_contribution.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
