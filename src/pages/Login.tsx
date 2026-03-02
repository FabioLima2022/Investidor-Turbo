import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Login() {
  const navigate = useNavigate();
  const { user, backendAvailable, backendError } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-neutral-200">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-neutral-900">Investidor Turbo</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Entre para gerenciar seus investimentos
          </p>
        </div>

        {!backendAvailable && (
          <div className="rounded-md bg-yellow-50 p-4 flex items-start mb-4">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              Backend indisponível: {backendError || 'Falha ao conectar ao Supabase'}.
              Verifique suas variáveis em .env e a URL do projeto no Supabase.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-neutral-300'
                } placeholder-neutral-500 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="seu@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-neutral-300'
                } placeholder-neutral-500 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !backendAvailable}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Entrar'
              )}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <span className="text-neutral-600">Não tem uma conta? </span>
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Cadastre-se gratuitamente
            </Link>
          </div>
        </form>
        
        {/* Mock Login Helper for Development */}
        {import.meta.env.DEV && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
             <p className="text-xs text-center text-neutral-400 mb-2">Ambiente de Desenvolvimento (Mock)</p>
             <button
               type="button"
               onClick={() => {
                 // Mock successful login by directly setting user in store
                 // This is a hack for development without backend connection
                 useAuthStore.getState().setUser({ 
                   id: 'mock-user-id', 
                   email: 'demo@investidorturbo.com',
                   app_metadata: {},
                   user_metadata: {},
                   aud: 'authenticated',
                   created_at: new Date().toISOString()
                 } as User);
                 navigate('/dashboard');
               }}
               className="w-full py-1 px-2 border border-neutral-300 text-xs font-medium rounded text-neutral-600 hover:bg-neutral-50"
             >
               Entrar como Demo User (Mock)
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
