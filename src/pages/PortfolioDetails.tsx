import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { TrendingUp, DollarSign, ArrowLeft } from 'lucide-react';

type Portfolio = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  initial_amount: number;
  monthly_contribution: number;
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  reinvest_dividends: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

type PortfolioAsset = {
  id: string;
  asset_id: string;
  allocation_percentage: number;
  quantity: number;
  average_price: number;
  assets?: {
    symbol: string;
    name: string;
    type: string;
    currency: string;
  };
};

export function PortfolioDetails() {
  const { id } = useParams();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const { data: p, error: e1 } = await supabase
          .from('portfolios')
          .select('*')
          .eq('id', id)
          .single();
        if (e1) throw e1;
        setPortfolio(p as Portfolio);

        const { data: pa, error: e2 } = await supabase
          .from('portfolio_assets')
          .select('id, asset_id, allocation_percentage, quantity, average_price, assets:asset_id(symbol,name,type,currency)')
          .eq('portfolio_id', id);
        if (e2) throw e2;
        setAssets((pa ?? []) as PortfolioAsset[]);
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar detalhes da carteira');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm border border-neutral-200 text-center">
        <p className="text-neutral-500">Carregando detalhes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm border border-neutral-200">
        <p className="text-red-600">{error}</p>
        <Link to="/carteiras" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-500">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm border border-neutral-200 text-center">
        <p className="text-neutral-500">Carteira não encontrada.</p>
        <Link to="/carteiras" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-500">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{portfolio.name}</h2>
          <p className="text-neutral-500">{portfolio.description || 'Sem descrição'}</p>
        </div>
        <Link to="/carteiras" className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-lg border border-neutral-200">
        <div>
          <dt className="text-xs font-medium text-neutral-500 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            Patrimônio
          </dt>
          <dd className="mt-1 text-lg font-semibold text-neutral-900">
            R$ {portfolio.initial_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-neutral-500 flex items-center">
            <DollarSign className="h-3 w-3 mr-1" />
            Aporte Mensal
          </dt>
          <dd className="mt-1 text-lg font-semibold text-primary-600">
            R$ {portfolio.monthly_contribution.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </dd>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Ativos da Carteira</h3>
        {assets.length === 0 ? (
          <p className="text-neutral-500">Nenhum ativo vinculado a esta carteira.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {assets.map((a) => (
              <div key={a.id} className="flex justify-between items-center border border-neutral-100 rounded-md p-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{a.assets?.name} ({a.assets?.symbol})</p>
                  <p className="text-xs text-neutral-500">Alocação: {a.allocation_percentage}% • Quantidade: {a.quantity}</p>
                </div>
                <div className="text-sm text-neutral-700">
                  Preço Médio: R$ {a.average_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
