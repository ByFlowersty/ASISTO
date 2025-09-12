
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { Subject, ScheduleEntry } from '../types';

interface Props {
    subject: Subject;
    onClose: () => void;
    onSave: () => void;
}

const daysOfWeek = [
    { label: 'Lunes', value: 1 }, { label: 'Martes', value: 2 }, { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 }, { label: 'Viernes', value: 5 }, { label: 'Sábado', value: 6 }, { label: 'Domingo', value: 7 }
];

const ScheduleModal: React.FC<Props> = ({ subject, onClose, onSave }) => {
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setSchedule(subject.schedule || []);
    }, [subject]);

    const handleAddDayToSchedule = (dayValue: number) => {
        if (!schedule.some(s => s.day === dayValue)) {
            const newSchedule = [...schedule, { day: dayValue, time: '', duration: 1 }];
            newSchedule.sort((a, b) => a.day - b.day);
            setSchedule(newSchedule);
        }
    };

    const handleRemoveDayFromSchedule = (dayValue: number) => {
        setSchedule(prev => prev.filter(s => s.day !== dayValue));
    };

    const handleScheduleChange = (dayValue: number, field: 'time' | 'duration', value: string | number) => {
        setSchedule(prev => prev.map(s => s.day === dayValue ? { ...s, [field]: value } : s));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const isScheduleValid = schedule.every(s => s.time && s.duration > 0);
        if (schedule.length > 0 && !isScheduleValid) {
            setError('Por favor, completa la hora y duración para cada día seleccionado.');
            return;
        }

        setIsSubmitting(true);
        const { error: updateError } = await supabase
            .from('subjects')
            .update({
                schedule: schedule.length > 0 ? schedule : null,
            })
            .eq('id', subject.id);

        setIsSubmitting(false);

        if (updateError) {
            setError('Error al guardar el horario: ' + updateError.message);
        } else {
            onSave();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-2xl relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl font-bold mb-1">Horario de Clase</h3>
                <p className="text-md text-gray-600 mb-6">Define los días y horas para <span className="font-semibold">{subject.name}</span>.</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Añadir día de clase</label>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                            {daysOfWeek.map(day => (
                                <button
                                    type="button"
                                    key={day.value}
                                    onClick={() => handleAddDayToSchedule(day.value)}
                                    disabled={schedule.some(s => s.day === day.value)}
                                    className={`px-2 py-2 rounded-lg font-semibold text-xs transition-colors ${
                                        schedule.some(s => s.day === day.value) 
                                        ? 'bg-primary-600 text-white cursor-not-allowed' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >{day.label}</button>
                            ))}
                        </div>
                    </div>
                    {schedule.length > 0 && (
                        <div className="space-y-3 pt-4 border-t max-h-64 overflow-y-auto pr-2">
                           {schedule.map(entry => {
                             const dayInfo = daysOfWeek.find(d => d.value === entry.day)!;
                             return (
                                <div key={entry.day} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                                    <label className="font-semibold text-gray-700">{dayInfo.label}</label>
                                    <div>
                                        <label htmlFor={`time-${entry.day}`} className="sr-only">Hora</label>
                                        <input type="time" id={`time-${entry.day}`} value={entry.time} onChange={e => handleScheduleChange(entry.day, 'time', e.target.value)} className="block w-full border-gray-300 rounded-lg shadow-sm" required />
                                    </div>
                                     <div>
                                        <label htmlFor={`duration-${entry.day}`} className="sr-only">Duración</label>
                                        <input type="number" id={`duration-${entry.day}`} min="1" max="8" value={entry.duration} onChange={e => handleScheduleChange(entry.day, 'duration', e.target.value === '' ? '' : +e.target.value)} className="block w-full border-gray-300 rounded-lg shadow-sm" required placeholder="Horas"/>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveDayFromSchedule(entry.day)} className="text-red-500 hover:text-red-700 justify-self-end">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                             );
                           })}
                        </div>
                    )}
                </div>
                
                {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}

                <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-300">
                        {isSubmitting ? 'Guardando...' : 'Guardar Horario'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ScheduleModal;
