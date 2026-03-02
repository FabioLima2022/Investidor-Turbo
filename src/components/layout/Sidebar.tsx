import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Calculator, DollarSign, Bell, ArrowLeftRight, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Carteiras', href: '/carteiras', icon: Wallet },
  { name: 'Simulador', href: '/simulador', icon: Calculator },
  { name: 'Renda & Dividendos', href: '/dividendos', icon: DollarSign },
  { name: 'Alertas', href: '/alertas', icon: Bell },
  { name: 'Comparador', href: '/comparador', icon: ArrowLeftRight },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-neutral-200">
      <div className="flex h-16 items-center px-6 border-b border-neutral-200">
        <span className="text-xl font-bold text-primary">Investidor Turbo</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-500'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-neutral-200 p-4">
        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            cn(
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors mb-2',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Settings 
                className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-500"
                )} 
              />
              Configurações
            </>
          )}
        </NavLink>
        <button 
          onClick={async () => {
            await signOut();
            navigate('/login', { replace: true });
          }}
          className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md text-danger hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );
}
