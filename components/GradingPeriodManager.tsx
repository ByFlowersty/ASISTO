import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import type { Subject } from '../types';

interface Props {
    subject: Subject;
    onDatesChange: () => void;
}

const GradingPeriodManager: React.FC<Props> = ({ subject, onDatesChange }) => {
    const [dates, setDates] = useState<{ [key: string]: string }>(subject.grading_periods_dates || {});
    const [isSaving, setIsSaving] = useState(false);

    const handleDateChange = (period: string, date: string) => {
        setDates(prev => ({ ...prev, [period]: date }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const { error } = await supabase
            .from('subjects')
            .update({ grading_periods_dates: dates })
            .eq('id', subject.id);
        
        if (error) {
            alert('Error al guardar las fechas: ' + error.message);
        } else {
            onDatesChange(); // To refetch data in parent
        }
        setIsSaving(false);
    };
    
    // Compare initial dates with current state to enable save button
    const hasChanges = JSON.stringify(dates) !== JSON.stringify(subject.grading_periods_dates || {});

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h2 className="text-xl font-bold mb-4">Fechas de Parciales</h2>
            <p className="text-sm text-gray-500 mb-4">Define la fecha de inicio para cada parcial. El final de un parcial se calcula automáticamente como el día anterior al inicio del siguiente.</p>
            <div className="space-y-4">
                {['1', '2', '3', '4'].map(p => (
                    <div key={p}>
                        <label htmlFor={`period-${p}-start`} className="block text-sm font-medium text-gray-700">{p}er Parcial - Inicio</label>
                        <input
                            type="date"
                            id={`period-${p}-start`}
                            value={dates[p] || ''}
                            onChange={(e) => handleDateChange(p, e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm"
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-end mt-6">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
                >
                    {isSaving ? 'Guardando...' : 'Guardar Fechas'}
                </button>
            </div>
        </div>
    );
};

export default GradingPeriodManager;
