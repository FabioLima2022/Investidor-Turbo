import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const { user, backendAvailable, backendError } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      });

      if (error) throw error;
      
      // Auto login or show success message
      // For now, let's redirect to login with a message (or dashboard if auto-logged in)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        navigate('/dashboard');
      } else {
        // Email confirmation required case
        setError('Cadastro realizado! Verifique seu email para confirmar.');
        // In a real app, we'd show a success screen
      }
      
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md border border-neutral-200">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-neutral-900">Criar Conta</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Comece sua jornada de investimentos hoje
          </p>
        </div>

        {!backendAvailable && (
          <div className={`rounded-md p-4 flex items-start bg-yellow-50 text-yellow-700`}>
            <AlertCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-yellow-400" />
            <p className="text-sm">
              Backend indisponível: {backendError || 'Falha ao conectar ao Supabase'}.
              Verifique suas variáveis em .env e a URL do projeto no Supabase.
            </p>
          </div>
        )}

        {error && (
          <div className={`rounded-md p-4 flex items-start ${error.includes('Verifique') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <AlertCircle className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${error.includes('Verifique') ? 'text-green-400' : 'text-red-400'}`} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700">
                Nome Completo
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.fullName ? 'border-red-300' : 'border-neutral-300'
                } placeholder-neutral-500 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="Seu Nome"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
              )}
            </div>

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
                autoComplete="new-password"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-neutral-300'
                } placeholder-neutral-500 text-neutral-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                placeholder="••••••"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
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
                'Criar Conta'
              )}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <span className="text-neutral-600">Já tem uma conta? </span>
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Faça login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
