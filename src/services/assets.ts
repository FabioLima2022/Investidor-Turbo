import { supabase } from '@/lib/supabase';

export type AssetRecord = {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'fii' | 'etf' | 'reit' | 'bond';
  market: 'BR' | 'US';
  currency: string;
  current_price: number | null;
  dividend_yield: number | null;
  sector: string | null;
};

export async function listAssets(limit = 100): Promise<AssetRecord[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AssetRecord[];
}

export async function getAssetBySymbol(symbol: string): Promise<AssetRecord | null> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('symbol', symbol)
    .single();
  if (error) return null;
  return data as AssetRecord;
}

export async function listPortfolioAssetsWithDetails(portfolioId: string) {
  const { data, error } = await supabase
    .from('portfolio_assets')
    .select('id, portfolio_id, asset_id, allocation_percentage, quantity, average_price, assets:asset_id(id,symbol,name,type,market,currency,current_price,dividend_yield,sector)')
    .eq('portfolio_id', portfolioId);
  if (error) throw error;
  return (data ?? []) as any[];
}

export async function addAssetToPortfolio(payload: {
  portfolio_id: string;
  asset_id: string;
  allocation_percentage: number;
  quantity: number;
  average_price: number;
}) {
  const { data, error } = await supabase
    .from('portfolio_assets')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function suggestAssetsForRiskProfile(risk: 'conservative' | 'moderate' | 'aggressive', excludeIds: string[] = []) {
  let query = supabase.from('assets').select('*');
  if (risk === 'conservative') {
    query = query.in('type', ['fii', 'etf', 'bond']).eq('market', 'BR');
  } else if (risk === 'moderate') {
    query = query.in('type', ['etf', 'stock', 'fii']);
  } else {
    query = query.in('type', ['stock', 'etf', 'reit']).in('market', ['US', 'BR']);
  }
  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.map((id) => `'${id}'`).join(',')})`);
  }
  const { data, error } = await query.limit(20);
  if (error) throw error;
  return (data ?? []) as AssetRecord[];
}
