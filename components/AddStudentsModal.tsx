
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface Props {
    subjectId: string;
    onClose: () => void;
    onSave: () => void;
}

const AddStudentsModal: React.FC<Props> = ({ subjectId, onClose, onSave }) => {
    const [studentNames, setStudentNames] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const names = studentNames.split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);

        if (names.length === 0) {
            setError('Por favor, introduce al menos un nombre.');
            return;
        }

        const studentsToInsert = names.map(name => ({
            name,
            subject_id: subjectId,
        }));

        setIsSubmitting(true);
        const { error: insertError } = await supabase
            .from('students')
            .insert(studentsToInsert);
        
        setIsSubmitting(false);

        if (insertError) {
            setError('Error al guardar los estudiantes: ' + insertError.message);
        } else {
            onSave();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-2xl relative max-w-lg w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl font-bold mb-1">Añadir Estudiantes</h3>
                <p className="text-md text-gray-600 mb-4">Pega la lista de nombres de los estudiantes, uno por línea.</p>

                <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
                    <textarea
                        value={studentNames}
                        onChange={(e) => setStudentNames(e.target.value)}
                        className="w-full flex-grow p-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm resize-none"
                        placeholder="Juan Pérez García&#10;María López Hernández&#10;..."
                        rows={10}
                        required
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-300">
                            {isSubmitting ? 'Guardando...' : `Guardar Estudiantes`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentsModal;
