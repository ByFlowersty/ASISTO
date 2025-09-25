import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { supabase } from '../services/supabase';
import type { Student, Assignment } from '../types';

const MultiGradeScanner: React.FC = () => {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();
    
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
    const [grades, setGrades] = useState<Map<string, number | ''>>(new Map());
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

    const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
    const scannerContainerId = "qr-reader";

    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [activeCameraId, setActiveCameraId] = useState<string | undefined>(undefined);

    // Fetch initial data for the subject
    useEffect(() => {
        const fetchData = async () => {
            if (!subjectId) {
                navigate('/');
                return;
            }
            setIsLoading(true);
            const [assignmentsRes, studentsRes] = await Promise.all([
                supabase.from('assignments').select('*').eq('subject_id', subjectId).order('created_at'),
                supabase.from('students').select('*').eq('subject_id', subjectId)
            ]);
            
            if (assignmentsRes.error || studentsRes.error) {
                setMessage({ type: 'error', text: 'Error al cargar datos de la materia.' });
            } else {
                setAssignments(assignmentsRes.data);
                setAllStudents(studentsRes.data);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [subjectId, navigate]);

    const handleScan = useCallback(async (studentName: string) => {
        const student = allStudents.find(s => s.name === studentName);
        if (student) {
            html5QrcodeRef.current?.stop();
            setMessage({ type: 'success', text: `Estudiante encontrado: ${student.name}` });
            setScannedStudent(student);

            // Fetch existing grades for this student
            const { data: existingGrades, error } = await supabase
                .from('grades')
                .select('assignment_id, score')
                .eq('student_id', student.id);
            
            const gradesMap = new Map<string, number | ''>();
            assignments.forEach(a => gradesMap.set(a.id, '')); // Initialize all
            if (!error && existingGrades) {
                existingGrades.forEach(grade => {
                    gradesMap.set(grade.assignment_id, grade.score);
                });
            }
            setGrades(gradesMap);

        } else {
            setMessage({ type: 'error', text: `Estudiante "${studentName}" no encontrado en esta materia.` });
            setTimeout(() => setMessage(null), 2500);
        }
    }, [allStudents, assignments]);

    const handleGradeChange = (assignmentId: string, value: string) => {
        const score = value === '' ? '' : parseFloat(value);
        if (score === '' || (score >= 0 && score <= 10)) {
            setGrades(prev => new Map(prev).set(assignmentId, score));
        }
    };

    const handleSaveGrades = async () => {
        if (!scannedStudent || !subjectId) return;

        setIsSaving(true);
        const gradesToUpsert = Array.from(grades.entries())
            .filter(([, score]) => score !== '' && score !== null)
            .map(([assignment_id, score]) => ({
                student_id: scannedStudent.id,
                assignment_id,
                subject_id: subjectId,
                score: score as number,
            }));

        if (gradesToUpsert.length === 0) {
            setMessage({ type: 'info', text: 'No hay calificaciones nuevas para guardar.' });
            setIsSaving(false);
            return;
        }

        const { error } = await supabase.from('grades').upsert(gradesToUpsert, { onConflict: 'student_id, assignment_id' });

        if (error) {
            setMessage({ type: 'error', text: 'Error al guardar: ' + error.message });
        } else {
            setMessage({ type: 'success', text: 'Calificaciones guardadas con éxito.' });
            setTimeout(() => {
                handleScanAnother();
            }, 1500);
        }
        setIsSaving(false);
    };

    const handleScanAnother = () => {
        setScannedStudent(null);
        setGrades(new Map());
        setMessage(null);
        // Scanner will restart via useEffect
    };

    useEffect(() => {
        if (scannedStudent || isLoading) {
            if (html5QrcodeRef.current?.isScanning) {
                html5QrcodeRef.current.stop().catch(e => console.error("Error stopping the scanner:", e));
            }
            return;
        };

        Html5Qrcode.getCameras()
            .then(devices => {
                if (devices && devices.length) {
                    setCameras(devices);
                    if (!activeCameraId) {
                       const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera'));
                       setActiveCameraId(backCamera ? backCamera.id : devices[0].id);
                    }
                }
            })
            .catch(err => {
                console.error("Could not get cameras", err);
                setMessage({ type: 'error', text: 'No se pudo acceder a la cámara.' });
            });
    }, [scannedStudent, isLoading, activeCameraId]);

    useEffect(() => {
        if (!activeCameraId || scannedStudent) return;

        const qrcode = new Html5Qrcode(scannerContainerId);
        html5QrcodeRef.current = qrcode;
        const config: Html5QrcodeCameraScanConfig = { fps: 5, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
        
        if (!qrcode.isScanning) {
            qrcode.start(activeCameraId, config, handleScan, undefined)
                .catch(err => {
                    console.error("No se pudo iniciar el escáner.", err);
                });
        }
        
        return () => {
            if (qrcode.isScanning) {
                qrcode.stop().catch(error => console.log("Scanner stop failed.", error));
            }
        };
    }, [activeCameraId, handleScan, scannedStudent]);
    
    const handleCameraSwitch = () => {
        if (cameras.length < 2 || !activeCameraId) return;
        const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        setActiveCameraId(cameras[nextIndex].id);
    };

    if (isLoading) {
        return <p className="text-center mt-8">Cargando...</p>;
    }
    
    return (
        <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-2">Calificar por Alumno</h1>
            
            {!scannedStudent ? (
                <>
                    <p className="text-gray-600 mb-6">Escanea el código QR de un estudiante para calificar sus actividades.</p>
                    <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-gray-800 aspect-square">
                        <div id={scannerContainerId} className="w-full h-full"></div>
                        {cameras.length > 1 && (
                            <button onClick={handleCameraSwitch} className="absolute bottom-4 right-4 bg-black bg-opacity-40 text-white p-3 rounded-full hover:bg-opacity-60 transition-all z-10" aria-label="Cambiar cámara">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m-5 2a9 9 0 0015.55 5.55M20 20v-5h-5m5-2a9 9 0 00-15.55-5.55" /></svg>
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <div className="mt-8 text-left">
                    <h2 className="text-2xl font-bold mb-4">Calificando a: <span className="text-primary-600">{scannedStudent.name}</span></h2>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto p-4 bg-white rounded-2xl shadow-lg">
                        {assignments.length > 0 ? assignments.map(assignment => (
                            <div key={assignment.id} className="flex items-center justify-between gap-4 p-3 bg-gray-50 rounded-lg">
                                <label htmlFor={`grade-${assignment.id}`} className="font-medium text-gray-800 flex-grow">{assignment.name}</label>
                                <input
                                    id={`grade-${assignment.id}`}
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    value={grades.get(assignment.id) ?? ''}
                                    onChange={(e) => handleGradeChange(assignment.id, e.target.value)}
                                    className="w-28 p-2 border border-gray-300 rounded-lg text-center focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="0-10"
                                    aria-label={`Calificación para ${assignment.name}`}
                                />
                            </div>
                        )) : <p className="text-center text-gray-500 p-4">No hay actividades creadas para esta materia.</p>}
                    </div>
                     <div className="mt-6 flex justify-between items-center">
                        <button onClick={handleScanAnother} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-xl shadow-md hover:bg-gray-300">
                            Escanear Otro
                        </button>
                        <button onClick={handleSaveGrades} disabled={isSaving} className="px-8 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-md hover:bg-green-700 disabled:bg-gray-400">
                            {isSaving ? 'Guardando...' : 'Guardar Calificaciones'}
                        </button>
                    </div>
                </div>
            )}

            {message && (
                <div className={`mt-6 p-4 rounded-xl font-semibold text-center text-white transition-opacity duration-300 ${message.text ? 'opacity-100' : 'opacity-0'} ${message.type === 'success' ? 'bg-green-500' : message.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
                    {message.text}
                </div>
            )}

            <button
                onClick={() => navigate(`/subject/${subjectId}`)}
                className="mt-8 px-8 py-3 bg-gray-600 text-white font-semibold rounded-xl shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
                Volver a la Materia
            </button>
        </div>
    );
};

export default MultiGradeScanner;
