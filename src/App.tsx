import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Dashboard } from '@/pages/Dashboard';
import { Portfolios } from '@/pages/Portfolios';
import { PortfolioDetails } from '@/pages/PortfolioDetails';
import { Simulator } from '@/pages/Simulator';
import { Income } from '@/pages/Income';
import { Alerts } from '@/pages/Alerts';
import { Comparator } from '@/pages/Comparator';
import { Settings } from '@/pages/Settings';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { AssetDetails } from '@/pages/AssetDetails';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient();

function AppRoutes() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="carteiras" element={<Portfolios />} />
          <Route path="carteiras/:id" element={<PortfolioDetails />} />
          <Route path="simulador" element={<Simulator />} />
          <Route path="dividendos" element={<Income />} />
          <Route path="alertas" element={<Alerts />} />
          <Route path="comparador" element={<Comparator />} />
          <Route path="configuracoes" element={<Settings />} />
          <Route path="ativos/:symbol" element={<AssetDetails />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
      </Router>
    </QueryClientProvider>
  )
}

export default App
