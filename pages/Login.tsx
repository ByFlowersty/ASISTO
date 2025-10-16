import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Test2404') {
      sessionStorage.setItem('isLoggedIn', 'true');
      navigate('/', { replace: true });
    } else {
      setError('Contraseña incorrecta. Inténtalo de nuevo.');
      setPassword('');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-primary-950">
      {/* Animated Gradient Shapes */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-[-50px] left-[-50px] w-72 h-72 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-100px] right-5 w-72 h-72 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-5 left-20 w-72 h-72 bg-primary-500 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
          <div className="text-center">
             <div className="inline-flex items-center justify-center gap-3 mb-4">
                 <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 4h4v4H4V4z" fill="currentColor"/>
                    <path d="M4 10h4v4H4v-4z" fill="currentColor" opacity="0.6"/>
                    <path d="M10 4h4v4h-4V4z" fill="currentColor" opacity="0.6"/>
                    <path d="M10 10h4v4h-4v-4z" fill="currentColor"/>
                    <path d="M16 4h4v4h-4V4z" fill="currentColor" opacity="0.6"/>
                    <path d="M4 16h4v4H4v-4z" fill="currentColor" opacity="0.6"/>
                    <path d="M10 16h4v4h-4v-4z" fill="currentColor" opacity="0.6"/>
                    <path d="M16 10h4v4h-4v-4z" fill="currentColor" opacity="0.6"/>
                    <path d="M16 16h4v4h-4v-4z" fill="currentColor"/>
                </svg>
                <h1 className="text-3xl font-bold tracking-wider text-white">AsistenciaQR</h1>
            </div>
            <p className="mt-2 text-sm text-gray-300">
                Acceso para prueba piloto.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-3 pl-10 text-white placeholder-gray-400 bg-white/10 border border-white/20 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {error && (
              <p className="text-sm text-center text-pink-400">{error}</p>
            )}

            <div>
              <button
                type="submit"
                className="group relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white border border-transparent rounded-lg bg-gradient-to-r from-cyan-500 to-primary-600 hover:from-cyan-600 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900 focus:ring-cyan-500 transition-all duration-300"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-cyan-300 group-hover:text-cyan-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
