
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { ScheduleEntry } from '../types';

const daysOfWeek = [
    { label: 'L', value: 1, longLabel: 'Lunes' }, { label: 'M', value: 2, longLabel: 'Martes' }, { label: 'X', value: 3, longLabel: 'Miércoles' },
    { label: 'J', value: 4, longLabel: 'Jueves' }, { label: 'V', value: 5, longLabel: 'Viernes' }, { label: 'S', value: 6, longLabel: 'Sábado' }, { label: 'D', value: 7, longLabel: 'Domingo' }
];

const AddSubject: React.FC = () => {
  const [name, setName] = useState('');
  const [term, setTerm] = useState<'semestre' | 'cuatrimestre'>('semestre');
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
    if (!name.trim()) {
      setError('El nombre de la materia no puede estar vacío.');
      return;
    }

    const isScheduleValid = schedule.every(s => s.time && s.duration > 0);
    if (schedule.length > 0 && !isScheduleValid) {
        setError('Por favor, completa la hora y duración para cada día seleccionado en el horario.');
        return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('subjects')
        .insert([{ 
            name, 
            term,
            schedule: schedule.length > 0 ? schedule : null,
        }]);

      if (error) throw error;
      
      navigate('/');
    } catch (err: any) {
      setError('Error al crear la materia: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Crear Nueva Materia</h1>
      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Materia</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Ej: Cálculo Diferencial"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
            <select
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value as 'semestre' | 'cuatrimestre')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-lg"
            >
              <option value="semestre">Semestre (A partir del 1 de Septiembre)</option>
              <option value="cuatrimestre">Cuatrimestre (A partir del 1 de Septiembre)</option>
            </select>
          </div>
          
          <div className="border-t pt-6">
             <h3 className="text-lg font-medium text-gray-800">Horario de Clase (Opcional)</h3>
             <p className="text-sm text-gray-500 mb-4">Define los días, horas y duración de cada clase.</p>
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Añadir día de clase</label>
                    <div className="flex gap-2 flex-wrap">
                        {daysOfWeek.map(day => (
                            <button
                                type="button"
                                key={day.value}
                                onClick={() => handleAddDayToSchedule(day.value)}
                                disabled={schedule.some(s => s.day === day.value)}
                                className={`w-10 h-10 rounded-full font-bold text-sm transition-colors ${
                                    schedule.some(s => s.day === day.value)
                                    ? 'bg-primary-600 text-white cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >{day.label}</button>
                        ))}
                    </div>
                </div>
                
                {schedule.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                       {schedule.map(entry => {
                         const dayInfo = daysOfWeek.find(d => d.value === entry.day)!;
                         return (
                            <div key={entry.day} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                                <label className="font-semibold text-gray-700">{dayInfo.longLabel}</label>
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
          </div>
          
          {error && <p className="text-red-500 text-sm my-4">{error}</p>}
          
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={loading}
            >
                Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Materia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubject;