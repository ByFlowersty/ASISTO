import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { supabase } from '../services/supabase';
import type { Student, Assignment } from '../types';

const GradeScanner: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    const [studentsToGrade, setStudentsToGrade] = useState<Student[]>([]);
    const [grades, setGrades] = useState<Map<string, number | ''>>(new Map());
    const [isSaving, setIsSaving] = useState(false);

    const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = "qr-reader";

    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [activeCameraId, setActiveCameraId] = useState<string | undefined>(undefined);

    useEffect(() => {
        const fetchAssignment = async () => {
            if (!assignmentId) {
                navigate('/');
                return;
            }
            const { data, error } = await supabase.from('assignments').select('*').eq('id', assignmentId).single();
            if (error || !data) {
                setMessage({ type: 'error', text: 'Actividad no encontrada.' });
            } else {
                setAssignment(data);
            }
        };
        fetchAssignment();
    }, [assignmentId, navigate]);

    const handleScan = useCallback(async (studentName: string) => {
        if (!assignment) return;
        
        if (studentsToGrade.some(s => s.name === studentName)) {
            setMessage({ type: 'error', text: `${studentName} ya está en la lista.` });
            setTimeout(() => setMessage(null), 2000);
            return;
        }
        
        try {
            const { data: studentData, error: studentError } = await supabase.from('students').select('*').eq('name', studentName).eq('subject_id', assignment.subject_id).single();
            if (studentError || !studentData) {
                setMessage({ type: 'error', text: `Estudiante "${studentName}" no encontrado.` });
            } else {
                setMessage({ type: 'success', text: `${studentData.name} añadido.` });
                setStudentsToGrade(prev => [...prev, studentData].sort((a,b) => a.name.localeCompare(b.name)));
                setGrades(prev => new Map(prev).set(studentData.id, ''));
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
        setTimeout(() => setMessage(null), 2000);
    }, [assignment, studentsToGrade]);

    const handleGradeChange = (studentId: string, value: string) => {
        const score = value === '' ? '' : parseFloat(value);
        if (score === '' || (score >= 0 && score <= 10)) {
            setGrades(prev => new Map(prev).set(studentId, score));
        }
    };

    const removeStudent = (studentId: string) => {
        setStudentsToGrade(prev => prev.filter(s => s.id !== studentId));
        setGrades(prev => {
            const newGrades = new Map(prev);
            newGrades.delete(studentId);
            return newGrades;
        });
    };

    const handleSaveAllGrades = async () => {
        if (!assignment || studentsToGrade.length === 0) return;

        setIsSaving(true);
        const gradesToUpsert = Array.from(grades.entries())
            .filter(([, score]) => score !== '')
            .map(([studentId, score]) => ({
                student_id: studentId,
                assignment_id: assignment.id,
                subject_id: assignment.subject_id,
                score: score as number,
            }));
        
        if (gradesToUpsert.length === 0) {
            setMessage({ type: 'error', text: 'No hay calificaciones nuevas para guardar.' });
            setIsSaving(false);
            setTimeout(() => setMessage(null), 2000);
            return;
        }

        const { error } = await supabase.from('grades').upsert(gradesToUpsert, { onConflict: 'student_id, assignment_id' });

        if (error) {
            setMessage({ type: 'error', text: 'Error al guardar: ' + error.message });
        } else {
            setMessage({ type: 'success', text: `${gradesToUpsert.length} calificaciones guardadas.` });
            setTimeout(() => navigate(`/subject/${assignment.subject_id}`), 1500);
        }
        setIsSaving(false);
    };

    useEffect(() => {
        if (!assignment) return;
        Html5Qrcode.getCameras()
            .then(devices => {
                if (devices && devices.length) {
                    setCameras(devices);
                    const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera'));
                    setActiveCameraId(backCamera ? backCamera.id : devices[0].id);
                }
            })
            .catch(err => {
                console.error("Could not get cameras", err);
                setMessage({ type: 'error', text: 'No se pudo acceder a la cámara.' });
            });
    }, [assignment]);

    useEffect(() => {
        if (!activeCameraId) return;
        const qrcode = new Html5Qrcode(scannerContainerId);
        html5QrcodeRef.current = qrcode;
        const config: Html5QrcodeCameraScanConfig = { fps: 5, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
        qrcode.start(activeCameraId, config, handleScan, undefined)
            .catch(err => setMessage({ type: 'error', text: 'No se pudo iniciar el escáner.' }));
        return () => {
            if (html5QrcodeRef.current?.isScanning) {
                html5QrcodeRef.current.stop().catch(error => console.log("Scanner stop failed on cleanup.", error));
            }
        };
    }, [activeCameraId, handleScan]);
    
    const handleCameraSwitch = () => {
        if (cameras.length < 2 || !activeCameraId) return;
        const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        setActiveCameraId(cameras[nextIndex].id);
    };

    if (!assignment) {
        return <p className="text-center mt-8">{message ? message.text : "Cargando actividad..."}</p>;
    }
    
    const validGradesCount = Array.from(grades.values()).filter(g => g !== '').length;

    return (
        <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-2">Calificar Actividad</h1>
            <p className="text-xl text-gray-700 mb-6">{assignment.name}</p>

            <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-gray-800 aspect-square">
                <div id={scannerContainerId} className="w-full h-full"></div>
                {cameras.length > 1 && (
                    <button onClick={handleCameraSwitch} className="absolute bottom-4 right-4 bg-black bg-opacity-40 text-white p-3 rounded-full hover:bg-opacity-60 transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Cambiar cámara">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m-5 2a9 9 0 0015.55 5.55M20 20v-5h-5m5-2a9 9 0 00-15.55-5.55" /></svg>
                    </button>
                )}
            </div>

            {message && (
                <div className={`mt-6 p-4 rounded-xl font-semibold text-center text-white ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {message.text}
                </div>
            )}

            {studentsToGrade.length > 0 && (
                <div className="mt-8 text-left">
                    <h2 className="text-2xl font-bold mb-4">Estudiantes Escaneados</h2>
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto p-1 pr-3 bg-white rounded-2xl shadow-lg">
                        {studentsToGrade.map(student => (
                            <div key={student.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-800 flex-grow">{student.name}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        value={grades.get(student.id) ?? ''}
                                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                        className="w-24 p-2 border border-gray-300 rounded-lg text-center focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="0-10"
                                        aria-label={`Calificación para ${student.name}`}
                                    />
                                    <button onClick={() => removeStudent(student.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100" aria-label={`Quitar a ${student.name}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-8 flex justify-end gap-4">
                <button onClick={() => navigate(-1)} className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl shadow-md hover:bg-gray-300">
                    Volver
                </button>
                 {studentsToGrade.length > 0 && (
                    <button onClick={handleSaveAllGrades} disabled={isSaving || validGradesCount === 0} className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isSaving ? 'Guardando...' : `Guardar (${validGradesCount})`}
                    </button>
                )}
            </div>
        </div>
    );
};

export default GradeScanner;
