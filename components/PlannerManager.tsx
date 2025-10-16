
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import type { PlannedClass, Subject } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import GraphicOrganizerModal from './GraphicOrganizerModal';
import BulkAddModal from './BulkAddModal';
import SyllabusGeneratorModal from './SyllabusGeneratorModal';

// --- Componente principal del planificador ---
const PlannerManager: React.FC<{
    subject: Subject;
    plannedClasses: PlannedClass[];
    onDataChange: () => void;
}> = ({ subject, plannedClasses, onDataChange }) => {
    const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
    const [isSyllabusGeneratorOpen, setIsSyllabusGeneratorOpen] = useState(false);
    const [isOrganizerLoading, setIsOrganizerLoading] = useState(false);
    const [organizerData, setOrganizerData] = useState<{ content: any; sources: any[] } | null>(null);
    const [selectedClassForOrganizer, setSelectedClassForOrganizer] = useState<PlannedClass | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newClassTitle, setNewClassTitle] = useState('');
    const [newClassDate, setNewClassDate] = useState('');
    const [newClassDescription, setNewClassDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);


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
    
    const handleSaveNewClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassTitle || !newClassDate) {
            alert("El título y la fecha son obligatorios.");
            return;
        }
        setIsSaving(true);
        const { error } = await supabase.from('planned_classes').insert({
            subject_id: subject.id,
            title: newClassTitle,
            description: newClassDescription || null,
            class_date: newClassDate,
            status: 'planned'
        });
        setIsSaving(false);
    
        if (error) {
            alert('Error al guardar la clase: ' + error.message);
        } else {
            setNewClassTitle('');
            setNewClassDate('');
            setNewClassDescription('');
            setShowAddForm(false);
            onDataChange();
        }
    };

    const handleGenerateOrganizer = async (cls: PlannedClass) => {
        setSelectedClassForOrganizer(cls);
        setIsOrganizerLoading(true);
        setOrganizerData(null);

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
            
            const prompt = `Actúa como un profesor experto en la materia "${subject.name}". Crea un organizador gráfico detallado para el tema de clase: "${cls.title}". Descripción adicional: "${cls.description || 'No hay descripción adicional.'}". El contenido debe ser específico para la materia. Incluye un tema principal con su definición y varios subtemas con puntos clave, conceptos y ejemplos relevantes.`;
            
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

            const text = response.text;
            if (!text) {
                throw new Error("La respuesta de la IA estaba vacía.");
            }
            const parsedContent = JSON.parse(text);
            
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
            {isSyllabusGeneratorOpen && <SyllabusGeneratorModal subject={subject} onClose={() => setIsSyllabusGeneratorOpen(false)} onSave={() => { setIsSyllabusGeneratorOpen(false); onDataChange(); }} />}

            {selectedClassForOrganizer && (
                <GraphicOrganizerModal
                    cls={selectedClassForOrganizer}
                    isLoading={isOrganizerLoading}
                    data={organizerData}
                    onClose={() => setSelectedClassForOrganizer(null)}
                />
            )}
            
            <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/10">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                    <h2 className="text-2xl font-bold">Planificador de Clases</h2>
                    <div className="flex gap-2 flex-shrink-0 flex-wrap">
                         {!showAddForm && (
                           <button onClick={() => setShowAddForm(true)} className="px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700">Añadir Tema</button>
                         )}
                        <button onClick={() => setIsBulkAddModalOpen(true)} className="px-4 py-2 text-sm bg-primary-600 text-white font-semibold rounded-lg shadow-sm hover:bg-primary-700">Añadir en Bloque</button>
                        <button onClick={() => setIsSyllabusGeneratorOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-cyan-600 text-white font-semibold rounded-lg shadow-sm hover:bg-cyan-700">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.707 1.707A1 1 0 003 8v6a1 1 0 001 1h2a1 1 0 001-1V8a1 1 0 00-.293-.707L5 5.586V3a1 1 0 00-1-1zm0 14a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zM15 2a1 1 0 00-1 1v1.586l-1.707 1.707A1 1 0 0013 8v6a1 1 0 001 1h2a1 1 0 001-1V8a1 1 0 00-.293-.707L15 5.586V3a1 1 0 00-1-1zm0 14a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1zM9 4a1 1 0 00-1 1v2.293l-1.146 1.147a1 1 0 001.414 1.414L9 8.414l.854.854a1 1 0 101.414-1.414L10 6.293V5a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            Generar Temario con IA
                        </button>
                        {plannedClasses.length > 0 && 
                            <button onClick={handleDeleteAll} className="px-4 py-2 text-sm bg-red-500 text-white font-semibold rounded-lg shadow-sm hover:bg-red-600">Borrar Todo</button>
                        }
                    </div>
                </div>

                {showAddForm && (
                    <form onSubmit={handleSaveNewClass} className="my-4 p-4 border border-black/10 rounded-lg bg-black/5 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Añadir Nuevo Tema</h3>
                        <div>
                            <label htmlFor="new-class-title" className="block text-sm font-medium text-gray-700 mb-1">Título del Tema</label>
                            <input type="text" id="new-class-title" value={newClassTitle} onChange={e => setNewClassTitle(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm bg-white/80" required autoFocus />
                        </div>
                        <div>
                            <label htmlFor="new-class-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha de la Clase</label>
                            <input type="date" id="new-class-date" value={newClassDate} onChange={e => setNewClassDate(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm bg-white/80" required />
                        </div>
                        <div>
                            <label htmlFor="new-class-description" className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
                            <textarea id="new-class-description" value={newClassDescription} onChange={e => setNewClassDescription(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm bg-white/80" rows={2}></textarea>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowAddForm(false)} disabled={isSaving} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-300">
                                {isSaving ? 'Guardando...' : 'Guardar Tema'}
                            </button>
                        </div>
                    </form>
                )}

                {plannedClasses.length === 0 && !showAddForm ? (
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
                                <li key={cls.id} className="p-4 bg-black/5 rounded-lg flex flex-col sm:flex-row items-start justify-between hover:bg-black/10 gap-4">
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
