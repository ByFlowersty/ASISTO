
import React, { useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import type { Student } from '../types';

interface Props {
    date: Date;
    students: Student[];
    subjectId: string;
    onClose: () => void;
    onSave: () => void;
}

const ManualAttendanceModal: React.FC<Props> = ({ date, students, subjectId, onClose, onSave }) => {
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(() => new Set(students.map(s => s.id)));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

    const handleToggleStudent = (studentId: string) => {
        const newSet = new Set(selectedStudentIds);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        setSelectedStudentIds(newSet);
    };

    const handleSelectAll = () => {
        setSelectedStudentIds(new Set(students.map(s => s.id)));
    };

    const handleDeselectAll = () => {
        setSelectedStudentIds(new Set());
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // 1. Create a new session for this date.
            // We set the time to noon UTC to avoid timezone issues.
            const sessionDate = new Date(date);
            sessionDate.setUTCHours(12, 0, 0, 0);

            const { data: session, error: sessionError } = await supabase
                .from('attendance_sessions')
                .insert({ subject_id: subjectId, created_at: sessionDate.toISOString() })
                .select()
                .single();

            if (sessionError) throw sessionError;

            // 2. Create attendance records for selected students.
            if (selectedStudentIds.size > 0) {
                const recordsToInsert = Array.from(selectedStudentIds).map(studentId => ({
                    student_id: studentId,
                    session_id: session.id,
                    subject_id: subjectId,
                    created_at: sessionDate.toISOString() // Also set created_at here for consistency
                }));
                
                const { error: recordsError } = await supabase.from('attendance_records').insert(recordsToInsert);
                if (recordsError) throw recordsError;
            }
            
            onSave(); // This will trigger a refetch and close the modal
        } catch (error: any) {
            alert('Error al guardar la asistencia: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const sortedStudents = useMemo(() => [...students].sort((a, b) => a.name.localeCompare(b.name)), [students]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-2xl relative max-w-lg w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl font-bold mb-1">Registrar Asistencia Manual</h3>
                <p className="text-md text-gray-600 mb-4 capitalize">{formattedDate}</p>
                
                <div className="flex gap-2 mb-4">
                    <button onClick={handleSelectAll} className="flex-1 text-sm px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">Marcar todos</button>
                    <button onClick={handleDeselectAll} className="flex-1 text-sm px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300">Desmarcar todos</button>
                </div>
                
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 border-t border-b py-2">
                    {sortedStudents.map(student => (
                        <label key={student.id} className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedStudentIds.has(student.id)}
                                onChange={() => handleToggleStudent(student.id)}
                                className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-3 text-gray-800">{student.name}</span>
                        </label>
                    ))}
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-300">
                        {isSubmitting ? 'Guardando...' : `Guardar (${selectedStudentIds.size})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualAttendanceModal;
