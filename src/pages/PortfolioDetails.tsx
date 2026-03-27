import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { TrendingUp, DollarSign, ArrowLeft, Plus } from 'lucide-react';
import { AddAssetModal } from '@/components/portfolios/AddAssetModal';
import { listPortfolioAssetsWithDetails, addAssetToPortfolio, suggestAssetsForRiskProfile } from '@/services/assets';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [suggested, setSuggested] = useState<any[]>([]);

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

        const pa = await listPortfolioAssetsWithDetails(id!);
        setAssets((pa ?? []) as PortfolioAsset[]);

        const exclude = (pa ?? []).map((x: any) => x.asset_id);
        const recs = await suggestAssetsForRiskProfile((p as Portfolio).risk_profile, exclude);
        setSuggested(recs);
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Distribuição de Ativos</h3>
          <button onClick={() => setIsAddAssetOpen(true)} className="inline-flex items-center bg-primary text-white px-3 py-2 rounded-md text-sm hover:bg-primary-600">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Ativo
          </button>
        </div>
        {assets.length === 0 ? (
          <p className="text-neutral-500">Nenhum ativo vinculado a esta carteira.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={assets.map(a => ({ name: a.assets?.symbol || a.asset_id, value: a.allocation_percentage }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                    {assets.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#00D084', '#1E3A8A', '#EF4444', '#F59E0B', '#10B981'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {assets.map((a) => (
                <div key={a.id} className="flex items-center justify-between border border-neutral-100 rounded-md p-3">
                  <div className="cursor-pointer" onClick={() => navigate(`/ativos/${a.assets?.symbol}`)}>
                    <p className="text-sm font-medium text-neutral-900">{a.assets?.name} ({a.assets?.symbol})</p>
                    <p className="text-xs text-neutral-500">Alocação: {a.allocation_percentage}% • Quantidade: {a.quantity}</p>
                  </div>
                  <div className="text-sm text-neutral-700">
                    Preço Médio: R$ {a.average_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Sugestões para o seu perfil</h3>
        {suggested.length === 0 ? (
          <p className="text-neutral-500">Nenhuma sugestão disponível.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggested.map((s) => (
              <div key={s.id} className="border border-neutral-200 rounded-md p-4">
                <p className="text-sm font-medium text-neutral-900">{s.name} ({s.symbol})</p>
                <p className="text-xs text-neutral-500">{s.type.toUpperCase()} • {s.market}</p>
                <p className="text-xs text-neutral-500">DY: {s.dividend_yield ?? '-'} • Setor: {s.sector ?? '-'}</p>
                <div className="mt-3 flex justify-end">
                  <button className="text-sm text-primary-600 hover:text-primary-500" onClick={() => setIsAddAssetOpen(true)}>
                    Incluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onSubmit={(d) => handleAddAsset(d)}
      />
      
    </div>
  );
}
