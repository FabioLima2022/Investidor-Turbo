import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getAssetBySymbol } from '@/services/assets';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowLeft } from 'lucide-react';

export function AssetDetails() {
  const { symbol } = useParams();
  const [asset, setAsset] = useState<any | null>(null);
  const [dividends, setDividends] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const a = await getAssetBySymbol(symbol!);
        setAsset(a);
        if (a) {
          const { data, error: e } = await supabase
            .from('dividend_history')
            .select('ex_date, payment_date, amount_per_share, total_amount, currency')
            .eq('asset_id', a.id)
            .order('payment_date', { ascending: true });
          if (e) throw e;
          setDividends((data ?? []).map((d) => ({
            date: new Date(d.payment_date).toLocaleDateString('pt-BR'),
            perShare: d.amount_per_share,
            total: d.total_amount,
          })));
        }
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar ativo');
      } finally {
        setLoading(false);
      }
    }
    if (symbol) load();
  }, [symbol]);

  if (loading) {
    return <p className="text-neutral-500">Carregando ativo...</p>;
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <p className="text-red-600">{error}</p>
        <Link to="/carteiras" className="inline-flex items-center text-primary-600 hover:text-primary-500 mt-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="bg-white p-6 rounded-lg border border-neutral-200">
        <p className="text-neutral-500">Ativo não encontrado.</p>
        <Link to="/carteiras" className="inline-flex items-center text-primary-600 hover:text-primary-500 mt-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{asset.name} ({asset.symbol})</h2>
          <p className="text-neutral-500">{asset.type.toUpperCase()} • {asset.market} • DY: {asset.dividend_yield ?? '-'}</p>
        </div>
        <Link to="/carteiras" className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Dividendos por Mês</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dividends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#00D084" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Projeção Simples</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dividends.map((d, i) => ({ idx: i + 1, total: d.total }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="idx" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#1E3A8A" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
