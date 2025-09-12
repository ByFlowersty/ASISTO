
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Subject, Student } from '../types';

type AttendanceStatus = 'present' | 'absent';

const RollCall: React.FC = () => {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();

    const [subject, setSubject] = useState<Subject | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [alreadyTaken, setAlreadyTaken] = useState(false);

    const todayString = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const fetchData = useCallback(async () => {
        if (!subjectId) return;
        setLoading(true);
        setError(null);
        try {
            // Check if attendance was already taken today
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            const { data: existingSession, error: sessionCheckError } = await supabase
                .from('attendance_sessions')
                .select('id')
                .eq('subject_id', subjectId)
                .gte('created_at', todayStart.toISOString())
                .lte('created_at', todayEnd.toISOString())
                .limit(1);

            if (sessionCheckError) throw sessionCheckError;

            if (existingSession && existingSession.length > 0) {
                setAlreadyTaken(true);
            }

            const [subjectRes, studentsRes] = await Promise.all([
                supabase.from('subjects').select('*').eq('id', subjectId).single(),
                supabase.from('students').select('*').eq('subject_id', subjectId).order('name'),
            ]);

            if (subjectRes.error) throw subjectRes.error;
            setSubject(subjectRes.data);

            if (studentsRes.error) throw studentsRes.error;
            setStudents(studentsRes.data);

            // Initialize attendance state, defaulting all students to 'present'
            const initialAttendance = new Map<string, AttendanceStatus>();
            studentsRes.data.forEach(student => {
                initialAttendance.set(student.id, 'present');
            });
            setAttendance(initialAttendance);

        } catch (err: any) {
            setError('Error al cargar los datos: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [subjectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        const newAttendance = new Map(attendance);
        newAttendance.set(studentId, status);
        setAttendance(newAttendance);
    };
    
    const markAllAs = (status: AttendanceStatus) => {
         const newAttendance = new Map<string, AttendanceStatus>();
         students.forEach(student => {
            newAttendance.set(student.id, status);
         });
         setAttendance(newAttendance);
    };

    const handleSave = async () => {
        if (!subjectId || alreadyTaken) return;

        setIsSaving(true);
        setError(null);

        try {
            const { data: session, error: sessionError } = await supabase
                .from('attendance_sessions')
                .insert({ subject_id: subjectId })
                .select()
                .single();

            if (sessionError) throw sessionError;

            const presentStudents = Array.from(attendance.entries())
                .filter(([, status]) => status === 'present')
                .map(([studentId]) => studentId);

            if (presentStudents.length > 0) {
                const recordsToInsert = presentStudents.map(studentId => ({
                    student_id: studentId,
                    session_id: session.id,
                    subject_id: subjectId,
                }));

                const { error: recordsError } = await supabase.from('attendance_records').insert(recordsToInsert);

                if (recordsError) throw recordsError;
            }

            navigate(`/subject/${subjectId}`);
        } catch (err: any) {
            setError('Error al guardar la asistencia: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <p className="text-center text-gray-500 mt-8">Cargando...</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-2">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-800">Pase de Lista Manual</h1>
                    <p className="text-lg text-gray-600">{subject?.name} - <span className="capitalize">{todayString}</span></p>
                </div>
                 <button onClick={() => navigate(`/subject/${subjectId}`)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 self-start md:self-center">
                     Volver
                 </button>
            </div>
            
             {alreadyTaken ? (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg text-center">
                    <p className="font-bold">La asistencia para el día de hoy ya ha sido registrada.</p>
                </div>
            ) : (
             <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex flex-wrap gap-2 mb-4">
                     <button onClick={() => markAllAs('present')} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Marcar todos como Presentes</button>
                     <button onClick={() => markAllAs('absent')} className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600">Marcar todos como Ausentes</button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <ul className="divide-y divide-gray-200">
                        {students.map(student => (
                            <li key={student.id} className="py-3 px-2 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <span className="font-medium text-gray-800">{student.name}</span>
                                <fieldset className="flex items-center gap-x-4">
                                    <legend className="sr-only">Estado de asistencia para {student.name}</legend>
                                    <div>
                                        <input type="radio" id={`present-${student.id}`} name={`status-${student.id}`} value="present" checked={attendance.get(student.id) === 'present'} onChange={() => handleStatusChange(student.id, 'present')} className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"/>
                                        <label htmlFor={`present-${student.id}`} className="ml-2 text-sm text-green-700 font-medium">Presente</label>
                                    </div>
                                    <div>
                                        <input type="radio" id={`absent-${student.id}`} name={`status-${student.id}`} value="absent" checked={attendance.get(student.id) === 'absent'} onChange={() => handleStatusChange(student.id, 'absent')} className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"/>
                                        <label htmlFor={`absent-${student.id}`} className="ml-2 text-sm text-red-700 font-medium">Ausente</label>
                                    </div>
                                </fieldset>
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="flex justify-end mt-6 pt-4 border-t">
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 disabled:bg-primary-300">
                        {isSaving ? 'Guardando...' : 'Guardar Asistencia'}
                    </button>
                </div>
            </div>
            )}

        </div>
    );
};

export default RollCall;
