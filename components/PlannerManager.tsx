import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import type { PlannedClass, Subject } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import GraphicOrganizerModal from './GraphicOrganizerModal';

// --- Modal para añadir temario en bloque ---
const BulkAddModal: React.FC<{
    subject: Subject;
    onClose: () => void;
    onSave: () => void;
}> = ({ subject, onClose, onSave }) => {
    const [syllabusText, setSyllabusText] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        setError('');
        if (!syllabusText.trim() || !startDate) {
            setError("Por favor, introduce el temario y selecciona una fecha de inicio.");
            return;
        }

        setIsSaving(true);
        
        if (!subject.schedule || subject.schedule.length === 0) {
            setError("Por favor, define un horario para la materia antes de añadir un temario.");
            setIsSaving(false);
            return;
        }
        
        const lines = syllabusText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Heuristic to skip header row if it exists
        if (lines.length > 0 && (lines[0].toLowerCase().includes('tema') || lines[0].toLowerCase().includes('subtema'))) {
            lines.shift();
        }

        const parsedTopics = lines.map(line => {
            const parts = line.split('\t');
            if (parts.length < 2) return null; // Must have at least Topic and Subtopic

            const tema = parts[0].trim();
            const subtema = parts[1].trim();
            const descripcion = (parts[2] || '').trim();
            
            const title = tema ? `${tema}: ${subtema}` : subtema;

            return {
                title,
                description: descripcion || null,
            };
        }).filter((topic): topic is { title: string; description: string | null } => topic !== null && topic.title !== '');


        if (parsedTopics.length === 0) {
            setError("No se encontraron temas válidos. Asegúrate de usar el formato correcto (columnas separadas por tabulación: Tema, Subtema, Descripción).");
            setIsSaving(false);
            return;
        }

        const scheduleDays = subject.schedule.map(s => s.day).sort();
        let currentDate = new Date(startDate + 'T12:00:00Z');
        const classesToInsert: Omit<PlannedClass, 'id' | 'created_at'>[] = [];

        for (const topic of parsedTopics) {
            while (true) {
                const dayOfWeek = currentDate.getUTCDay() === 0 ? 7 : currentDate.getUTCDay();
                if (scheduleDays.includes(dayOfWeek)) break;
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
            
            classesToInsert.push({
                subject_id: subject.id,
                class_date: currentDate.toISOString().split('T')[0],
                title: topic.title,
                description: topic.description,
                status: 'planned'
            });
            
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        const { error: insertError } = await supabase.from('planned_classes').insert(classesToInsert);

        setIsSaving(false);

        if (insertError) {
            setError('Error al guardar el temario: ' + insertError.message);
        } else {
            onSave();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-2xl relative max-w-lg w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl font-bold mb-1">Añadir Temario</h3>
                <p className="text-md text-gray-600 mb-4">Pega el temario desde una hoja de cálculo (columnas: Tema, Subtema, Descripción).</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio del temario</label>
                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm" />
                    </div>
                    <div>
                        <label htmlFor="syllabus-text" className="block text-sm font-medium text-gray-700 mb-1">Temario (un tema por línea)</label>
                        <textarea
                            id="syllabus-text"
                            value={syllabusText}
                            onChange={e => setSyllabusText(e.target.value)}
                            className="w-full h-48 p-2 border border-gray-300 rounded-lg resize-none"
                            placeholder={"OPERACIONES BÁSICAS\	1. Escritura de texto\	Ingresar texto en el documento.\nOPERACIONES BÁSICAS\	2. Selección de texto\	Manipular el texto..."}
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-300">
                        {isSaving ? 'Guardando...' : 'Guardar Temario'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Componente principal del planificador ---
const PlannerManager: React.FC<{
    subject: Subject;
    plannedClasses: PlannedClass[];
    onDataChange: () => void;
}> = ({ subject, plannedClasses, onDataChange }) => {
    const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
    const [isOrganizerLoading, setIsOrganizerLoading] = useState(false);
    const [organizerData, setOrganizerData] = useState<{ content: any; sources: any[] } | null>(null);
    const [selectedClassForOrganizer, setSelectedClassForOrganizer] = useState<PlannedClass | null>(null);

    const handleDeleteAll = async () => {
        if (window.confirm('¿Estás seguro de que quieres borrar todo el temario? Esta acción no se puede deshacer.')) {
            const { error } = await supabase.from('planned_classes').delete().eq('subject_id', subject.id);
            if (error) {
                alert('Error al borrar el temario: ' + error.message);
            } else {
                onDataChange();
            }
        }
    };
    
    const handleGenerateOrganizer = async (cls: PlannedClass) => {
        setSelectedClassForOrganizer(cls);
        setIsOrganizerLoading(true);
        setOrganizerData(null);

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
            
            const prompt = `Crea un organizador gráfico detallado sobre el siguiente tema de clase: "${cls.title}". Descripción adicional: "${cls.description || 'No hay descripción adicional.'}". Incluye un tema principal con su definición, y varios subtemas con sus puntos clave, conceptos y ejemplos relevantes.`;
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            tema_principal: {
                                type: Type.OBJECT,
                                properties: {
                                    nombre: { type: Type.STRING },
                                    definicion: { type: Type.STRING }
                                }
                            },
                            subtemas: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        nombre: { type: Type.STRING },
                                        puntos_clave: {
                                            type: Type.ARRAY,
                                            items: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            });

            const jsonText = response.text;
            if (!jsonText) {
                throw new Error("La respuesta de la IA llegó vacía.");
            }
            const parsedContent = JSON.parse(jsonText);
            
            setOrganizerData({ content: parsedContent, sources: [] });
        } catch (err) {
            console.error("Error al generar el organizador gráfico:", err);
            setOrganizerData({ content: { error: (err as Error).message }, sources: [] });
        } finally {
            setIsOrganizerLoading(false);
        }
    };

    return (
        <div>
            {isBulkAddModalOpen && <BulkAddModal subject={subject} onClose={() => setIsBulkAddModalOpen(false)} onSave={() => { setIsBulkAddModalOpen(false); onDataChange(); }} />}
            {selectedClassForOrganizer && (
                <GraphicOrganizerModal
                    cls={selectedClassForOrganizer}
                    isLoading={isOrganizerLoading}
                    data={organizerData}
                    onClose={() => setSelectedClassForOrganizer(null)}
                />
            )}
            
            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                    <h2 className="text-2xl font-bold">Planificador de Clases</h2>
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setIsBulkAddModalOpen(true)} className="px-4 py-2 text-sm bg-primary-600 text-white font-semibold rounded-lg shadow-sm hover:bg-primary-700">Añadir Temario</button>
                        {plannedClasses.length > 0 && 
                            <button onClick={handleDeleteAll} className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:bg-red-600">Borrar Todo</button>
                        }
                    </div>
                </div>

                {plannedClasses.length === 0 ? (
                    <div className="text-center py-10">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clases planificadas</h3>
                        <p className="mt-1 text-sm text-gray-500">Empieza por añadir un temario.</p>
                    </div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <ul className="space-y-3">
                            {plannedClasses.map(cls => (
                                <li key={cls.id} className="p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row items-start justify-between hover:bg-gray-100 gap-4">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">{cls.title}</p>
                                        {cls.description && (
                                            <p className="text-sm text-gray-600 mt-1">{cls.description}</p>
                                        )}
                                        <p className="text-sm text-gray-500 capitalize mt-2">{new Date(cls.class_date + 'T12:00:00Z').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 capitalize self-end">{cls.status}</span>
                                        <button 
                                          onClick={() => handleGenerateOrganizer(cls)}
                                          className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-cyan-500 text-white font-bold rounded-lg shadow-sm hover:bg-cyan-600 transition-colors"
                                        >
                                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                            Generar Organizador
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlannerManager;
