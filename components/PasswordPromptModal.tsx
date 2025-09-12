import React, { useState } from 'react';

interface Props {
    onSuccess: () => void;
    onClose: () => void;
}

const PasswordPromptModal: React.FC<Props> = ({ onSuccess, onClose }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'Test2404') {
            onSuccess();
        } else {
            setError('Contraseña incorrecta.');
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-8 rounded-2xl shadow-2xl relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-center">Verificación Requerida</h3>
                <p className="text-gray-600 mb-6 text-center text-sm">Para registrar asistencia en una fecha pasada, por favor introduce la contraseña de administrador.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        className="w-full text-center p-2 border-2 border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Contraseña"
                        autoFocus
                        required
                    />
                    {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                    <button type="submit" className="w-full mt-4 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">
                        Verificar
                    </button>
                    <button type="button" onClick={onClose} className="w-full mt-2 px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100">
                        Cancelar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordPromptModal;
