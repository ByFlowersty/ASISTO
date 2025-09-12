import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const validPassword = import.meta.env.VITE_LOGIN_PASSWORD;

    if (password === validPassword) {
      sessionStorage.setItem('isLoggedIn', 'true');
      navigate('/', { replace: true });
    } else {
      setError('Contraseña incorrecta. Inténtalo de nuevo.');
      setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-200 to-slate-300 px-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white shadow-xl rounded-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-wide">
            Cynosure <span className="text-blue-600">ONE</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">Acceso privado al sistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Iniciar sesión
            </button>
          </div>
        </form>

        <div className="text-xs text-center text-gray-400 mt-4">
          &copy; {new Date().getFullYear()} Cynosure ONE
        </div>
      </div>
    </div>
  );
};

export default Login;
