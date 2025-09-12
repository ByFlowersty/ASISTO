
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { supabase } from '../services/supabase';
import type { Student, Assignment } from '../types';

const GradeModal: React.FC<{
    student: Student;
    assignment: Assignment;
    onClose: () => void;
    onGradeSubmit: (score: number) => Promise<void>;
}> = ({ student, assignment, onClose, onGradeSubmit }) => {
    const [score, setScore] = useState<number | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (score === '' || score < 0 || score > 10) {
            alert("Por favor, introduce una calificación válida entre 0 y 10.");
            return;
        }
        setIsSubmitting(true);
        await onGradeSubmit(score);
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl relative max-w-sm w-full">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl font-bold mb-2">{student.name}</h3>
                <p className="text-sm text-gray-500 mb-4">Calificando: {assignment.name}</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={score}
                        onChange={(e) => setScore(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="w-full text-center text-2xl p-2 border-2 border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0-10"
                        autoFocus
                        required
                    />
                    <button type="submit" disabled={isSubmitting} className="w-full mt-4 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-300">
                        {isSubmitting ? 'Guardando...' : 'Guardar Calificación'}
                    </button>
                </form>
            </div>
        </div>
    );
};


const GradeScanner: React.FC = () => {
    const { assignmentId } = useParams<{ assignmentId: string }>();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
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
        
        if (html5QrcodeRef.current?.isScanning) {
            html5QrcodeRef.current.pause(true);
        }
        
        try {
            const { data: studentData, error: studentError } = await supabase.from('students').select('*').eq('name', studentName).eq('subject_id', assignment.subject_id).single();
            if (studentError || !studentData) {
                setMessage({ type: 'error', text: `Estudiante "${studentName}" no encontrado en esta materia.` });
                setTimeout(() => {
                    setMessage(null);
                    if (html5QrcodeRef.current) html5QrcodeRef.current.resume();
                }, 2000);
            } else {
                setScannedStudent(studentData);
            }
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
             setTimeout(() => {
                setMessage(null);
                if (html5QrcodeRef.current) html5QrcodeRef.current.resume();
            }, 2000);
        }
    }, [assignment]);

    const handleGradeSubmit = async (score: number) => {
        if (!scannedStudent || !assignment) return;
        
        const { error } = await supabase.from('grades').upsert({
            student_id: scannedStudent.id,
            assignment_id: assignment.id,
            subject_id: assignment.subject_id,
            score: score
        }, { onConflict: 'student_id, assignment_id' });

        if (error) {
            setMessage({ type: 'error', text: 'Error al guardar la calificación: ' + error.message });
        } else {
            setMessage({ type: 'success', text: `Calificación ${score} guardada para ${scannedStudent.name}.` });
        }
        setScannedStudent(null);
        setTimeout(() => {
            setMessage(null);
            if (html5QrcodeRef.current) html5QrcodeRef.current.resume();
        }, 2000);
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

        const config: Html5QrcodeCameraScanConfig = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0 
        };
        
        qrcode.start(
            activeCameraId,
            config,
            handleScan,
            undefined
        ).catch(err => {
            console.error("Failed to start scanner", err);
            setMessage({ type: 'error', text: 'No se pudo iniciar el escáner.' });
        });

        return () => {
            if (html5QrcodeRef.current) {
                html5QrcodeRef.current.stop().catch(error => {
                    console.log("Scanner stop failed on cleanup, this is expected in some cases.", error);
                });
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

    return (
        <div className="max-w-xl mx-auto text-center">
            {scannedStudent && (
                <GradeModal 
                    student={scannedStudent} 
                    assignment={assignment}
                    onClose={() => {
                        setScannedStudent(null);
                        if (html5QrcodeRef.current) html5QrcodeRef.current.resume();
                    }} 
                    onGradeSubmit={handleGradeSubmit}
                />
            )}
            <h1 className="text-3xl font-bold mb-2">Calificar Actividad</h1>
            <p className="text-xl text-gray-700 mb-6">{assignment.name}</p>

            <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-gray-800 aspect-square">
                <div id={scannerContainerId} className="w-full h-full"></div>
                {cameras.length > 1 && (
                    <button 
                        onClick={handleCameraSwitch} 
                        className="absolute bottom-4 right-4 bg-black bg-opacity-40 text-white p-3 rounded-full hover:bg-opacity-60 transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Cambiar cámara"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m-5 2a9 9 0 0015.55 5.55M20 20v-5h-5m5-2a9 9 0 00-15.55-5.55" />
                        </svg>
                    </button>
                )}
            </div>

            {message && (
                <div className={`mt-6 p-4 rounded-xl font-semibold text-center text-white ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {message.text}
                </div>
            )}
            <button onClick={() => navigate(-1)} className="mt-8 px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl shadow-md hover:bg-primary-700">
                Volver a la Materia
            </button>
        </div>
    );
};

export default GradeScanner;
