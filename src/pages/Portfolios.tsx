import { useState } from 'react';
import { Plus, Wallet, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CreatePortfolioModal } from '@/components/portfolios/CreatePortfolioModal';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortfolio, listPortfolios, PortfolioRecord } from '@/services/portfolios';

// Mock data for initial development
const MOCK_PORTFOLIOS = [
  {
    id: '1',
    name: 'Carteira Aposentadoria',
    description: 'Foco em longo prazo e dividendos',
    totalValue: 150000.00,
    monthlyIncome: 1250.50,
    riskProfile: 'Moderado',
  },
  {
    id: '2',
    name: 'Reserva de Oportunidade',
    description: 'Alta liquidez para aproveitar quedas',
    totalValue: 45000.00,
    monthlyIncome: 380.20,
    riskProfile: 'Conservador',
  },
];

export function Portfolios() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [portfolios, setPortfolios] = useState(MOCK_PORTFOLIOS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreatePortfolio = async (data: any) => {
    setCreateError(null);
    if (user) {
      try {
        await createPortfolio(user, {
          name: data.name,
          description: data.description,
          initial_amount: data.initialAmount,
          monthly_contribution: data.monthlyContribution,
          risk_profile: data.riskProfile,
        });
        await queryClient.invalidateQueries({ queryKey: ['portfolios'] });
        setIsModalOpen(false);
      } catch (e: any) {
        setCreateError(
          e?.message?.includes('foreign key') 
            ? 'Erro ao criar carteira: perfil de usuário inexistente no banco (FK).'
            : e?.message || 'Erro ao criar carteira'
        );
      }
    } else {
      const newPortfolio = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        description: data.description,
        totalValue: data.initialAmount,
        monthlyIncome: 0,
        riskProfile:
          data.riskProfile === 'conservative'
            ? 'Conservador'
            : data.riskProfile === 'moderate'
            ? 'Moderado'
            : 'Arrojado',
      };
      setPortfolios([...portfolios, newPortfolio]);
      setIsModalOpen(false);
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['portfolios', user?.id],
    queryFn: () => listPortfolios(user!),
    enabled: !!user,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Minhas Carteiras</h2>
          <p className="text-neutral-500">Gerencie suas estratégias de investimento</p>
        </div>
        {createError && (
          <div className="mr-4 text-sm text-red-600">
            {createError}
          </div>
        )}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Carteira
        </button>
      </div>

      {user ? (
        isLoading ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-neutral-200 text-center">
            <p className="text-neutral-500">Carregando carteiras...</p>
          </div>
        ) : isError ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-neutral-200 text-center">
            <p className="text-neutral-500">Erro ao carregar carteiras.</p>
          </div>
        ) : (data as PortfolioRecord[])?.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-neutral-200 text-center">
            <div className="mx-auto h-12 w-12 text-neutral-400">
              <Wallet className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-neutral-900">Nenhuma carteira encontrada</h3>
            <p className="mt-1 text-sm text-neutral-500">Crie sua primeira carteira.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(data as PortfolioRecord[]).map((portfolio) => (
              <div
                key={portfolio.id}
                className="bg-white overflow-hidden shadow-sm rounded-lg border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100">
                        <Wallet className="h-6 w-6 text-primary-600" />
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-neutral-900">{portfolio.name}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          portfolio.risk_profile === 'conservative'
                            ? 'bg-blue-100 text-blue-800'
                            : portfolio.risk_profile === 'moderate'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {portfolio.risk_profile === 'conservative'
                          ? 'Conservador'
                          : portfolio.risk_profile === 'moderate'
                          ? 'Moderado'
                          : 'Arrojado'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-neutral-500 line-clamp-2">{portfolio.description}</p>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
                    <div>
                      <dt className="text-xs font-medium text-neutral-500 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Patrimônio
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-neutral-900">
                        {formatCurrency(portfolio.initial_amount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500 flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Aporte Mensal
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-success-600 text-primary-600">
                        {formatCurrency(portfolio.monthly_contribution)}
                      </dd>
                    </div>
                  </div>
                </div>
                <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200">
                  <div className="text-sm">
                    <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                      Ver detalhes <span aria-hidden="true">&rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : portfolios.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-neutral-200 text-center">
          <div className="mx-auto h-12 w-12 text-neutral-400">
            <Wallet className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-neutral-900">Nenhuma carteira encontrada</h3>
          <p className="mt-1 text-sm text-neutral-500">Comece criando sua primeira carteira de investimentos.</p>
          <div className="mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Criar Carteira
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="bg-white overflow-hidden shadow-sm rounded-lg border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100">
                      <Wallet className="h-6 w-6 text-primary-600" />
                    </span>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-neutral-900">{portfolio.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      portfolio.riskProfile === 'Conservador' ? 'bg-blue-100 text-blue-800' :
                      portfolio.riskProfile === 'Moderado' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {portfolio.riskProfile}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-neutral-500 line-clamp-2">
                    {portfolio.description}
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Patrimônio
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-neutral-900">
                      {formatCurrency(portfolio.totalValue)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-neutral-500 flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Renda Mensal
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-success-600 text-primary-600">
                      {formatCurrency(portfolio.monthlyIncome)}
                    </dd>
                  </div>
                </div>
              </div>
              <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200">
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                    Ver detalhes <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <CreatePortfolioModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePortfolio}
      />
    </div>
  );
}
