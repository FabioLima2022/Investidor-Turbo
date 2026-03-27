import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { listPortfolios, PortfolioRecord } from '@/services/portfolios';
import { supabase } from '@/lib/supabase';

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
        <div className="bg-white p-6 rounded-lg border border-neutral-200 space-y-4">
          <div className="grid grid-cols-4 gap-2 text-sm font-medium text-neutral-700 mb-2">
            <div>Carteira</div>
            <div className="text-right">Aporte Inicial</div>
            <div className="text-right">Aporte Mensal</div>
            <div className="text-right">Qtde de Ativos</div>
          </div>
          <div className="space-y-2">
            {items.map((p) => (
              <PortfolioRow key={p.id} portfolio={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PortfolioRow({ portfolio }: { portfolio: PortfolioRecord }) {
  const [count, setCount] = useState<number>(0);
  useEffect(() => {
    async function load() {
      const { count } = await supabase
        .from('portfolio_assets')
        .select('id', { count: 'exact', head: true })
        .eq('portfolio_id', portfolio.id);
      setCount(count ?? 0);
    }
    load();
  }, [portfolio.id]);
  return (
    <div className="grid grid-cols-4 gap-2 text-sm">
      <div className="font-medium text-neutral-900">{portfolio.name}</div>
      <div className="text-right">R$ {portfolio.initial_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      <div className="text-right text-primary-600">R$ {portfolio.monthly_contribution.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
      <div className="text-right">{count}</div>
    </div>
  );
}
