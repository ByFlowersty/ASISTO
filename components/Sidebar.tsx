import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('isLoggedIn');
        navigate('/login', { replace: true });
    };

    const navLinks = [
      { to: "/", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, label: "Materias" },
    ];
    
    const placeholderLinks = [
      { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2h2" /></svg>, label: "Todos los Cursos" },
      { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, label: "Mensajes" },
      { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, label: "Ajustes" },
    ];

    return (
        <aside className="w-64 bg-primary-950 text-white flex-col flex-shrink-0 hidden sm:flex">
            <div className="h-24 flex items-center justify-center border-b border-primary-900">
                <h1 className="text-2xl font-bold tracking-wider">AsistenciaQR</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navLinks.map(link => (
                    <NavLink
                        key={link.label}
                        to={link.to}
                        end
                        className={({ isActive }) =>
                            `flex items-center px-4 py-3 rounded-xl font-medium transition-colors duration-200 ${
                            isActive ? 'bg-primary-700 text-white' : 'text-primary-200 hover:bg-primary-900'
                            }`
                        }
                    >
                        {link.icon}
                        <span className="ml-4">{link.label}</span>
                    </NavLink>
                ))}
                {placeholderLinks.map(link => (
                    <div key={link.label} className="flex items-center px-4 py-3 rounded-xl font-medium text-primary-500 cursor-not-allowed">
                       {link.icon}
                       <span className="ml-4">{link.label}</span>
                    </div>
                ))}
            </nav>
            <div className="px-4 py-6 border-t border-primary-900">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 rounded-xl font-medium text-primary-200 hover:bg-primary-900 transition-colors duration-200"
                    aria-label="Cerrar sesión"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span className="ml-4">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
