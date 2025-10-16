
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import type { PlannedClass, Subject } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
    subject: Subject;
    onClose: () => void;
    onSave: () => void;
}

const LoadingState: React.FC = () => (
    <div className="text-center py-10">
        <svg className="animate-spin h-10 w-10 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-gray-600 font-semibold">Generando temario...</p>
        <p className="text-sm text-gray-500">Esto puede tardar unos segundos.</p>
    </div>
);

const SyllabusGeneratorModal: React.FC<Props> = ({ subject, onClose, onSave }) => {
    const [courseDescription, setCourseDescription] = useState('');
    const [numClasses, setNumClasses] = useState<number | ''>(15);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!courseDescription.trim() || !numClasses || numClasses <= 0 || !startDate) {
            setError("Por favor, completa todos los campos.");
            return;
        }

        if (!subject.schedule || subject.schedule.length === 0) {
            setError("Por favor, define un horario para la materia antes de generar un temario.");
            return;
        }
        
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
            
            const prompt = `Actúa como un diseñador de planes de estudio experto en la materia de "${subject.name}". Genera un temario coherente y progresivo para un curso de ${numClasses} clases. La descripción del curso es: "${courseDescription}". Devuelve una lista de temas en formato JSON. Cada tema debe tener un "titulo" y una "descripcion" breve. El título debe ser conciso y claro.`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                titulo: { type: Type.STRING },
                                descripcion: { type: Type.STRING }
                            }
                        }
                    }
                },
            });

            const generatedTopics = JSON.parse(response.text);

            if (!Array.isArray(generatedTopics) || generatedTopics.length === 0) {
                throw new Error("La IA no generó un temario válido. Inténtalo de nuevo con una descripción más detallada.");
            }

            const scheduleDays = subject.schedule.map(s => s.day).sort();
            let currentDate = new Date(startDate + 'T12:00:00Z');
            const classesToInsert: Omit<PlannedClass, 'id' | 'created_at'>[] = [];

            for (const topic of generatedTopics) {
                while (true) {
                    const dayOfWeek = currentDate.getUTCDay() === 0 ? 7 : currentDate.getUTCDay();
                    if (scheduleDays.includes(dayOfWeek)) break;
                    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                }
                
                classesToInsert.push({
                    subject_id: subject.id,
                    class_date: currentDate.toISOString().split('T')[0],
                    title: topic.titulo,
                    description: topic.descripcion,
                    status: 'planned'
                });
                
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }

            const { error: insertError } = await supabase.from('planned_classes').insert(classesToInsert);
            if (insertError) throw insertError;

            onSave();
        } catch (err: any) {
            setError('Error al generar el temario: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl relative max-w-lg w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} disabled={isLoading} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl font-bold mb-1">Generar Temario con IA</h3>
                <p className="text-md text-gray-600 mb-4">Describe tu curso y la IA creará un plan de clases para ti.</p>
                
                {isLoading ? <LoadingState /> : (
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label htmlFor="course-description" className="block text-sm font-medium text-gray-700 mb-1">Descripción del curso</label>
                            <textarea
                                id="course-description"
                                value={courseDescription}
                                onChange={e => setCourseDescription(e.target.value)}
                                className="w-full h-24 p-2 border border-gray-300 rounded-lg resize-none bg-white/80"
                                placeholder={`Ej: "Curso introductorio de ${subject.name} enfocado en los fundamentos teóricos y ejercicios prácticos iniciales."`}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="num-classes" className="block text-sm font-medium text-gray-700 mb-1">Número de clases</label>
                                <input type="number" id="num-classes" value={numClasses} onChange={e => setNumClasses(e.target.value === '' ? '' : +e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm bg-white/80" min="1" max="50" required />
                            </div>
                            <div>
                                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                                <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm bg-white/80" required />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                        
                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-black/10">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                            <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.707 1.707A1 1 0 003 8v6a1 1 0 001 1h2a1 1 0 001-1V8a1 1 0 00-.293-.707L5 5.586V3a1 1 0 00-1-1zm0 14a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zM15 2a1 1 0 00-1 1v1.586l-1.707 1.707A1 1 0 0013 8v6a1 1 0 001 1h2a1 1 0 001-1V8a1 1 0 00-.293-.707L15 5.586V3a1 1 0 00-1-1zm0 14a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zM9 4a1 1 0 00-1 1v2.293l-1.146 1.147a1 1 0 001.414 1.414L9 8.414l.854.854a1 1 0 101.414-1.414L10 6.293V5a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                Generar Temario
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SyllabusGeneratorModal;
