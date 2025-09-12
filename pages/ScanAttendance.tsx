
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import { supabase } from '../services/supabase';

const ScanAttendance: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const lastScannedCode = useRef<string | null>(null);
  const scannerContainerId = "qr-reader";

  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | undefined>(undefined);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  const handleScan = useCallback(async (studentName: string) => {
    if (!sessionId) return;
    if (lastScannedCode.current === studentName) return;
    
    lastScannedCode.current = studentName;
    setTimeout(() => { lastScannedCode.current = null; }, 3000);

    setMessage(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions').select('subject_id').eq('id', sessionId).single();
      
      if (sessionError || !sessionData) throw new Error('Sesión no encontrada.');
      
      if (!sessionData.subject_id) {
        setMessage({ type: 'error', text: 'Error: La sesión de asistencia no está vinculada a una materia.' });
        return;
      }

      const { data: studentData, error: studentError } = await supabase
        .from('students').select('id').eq('name', studentName).eq('subject_id', sessionData.subject_id).single();

      if (studentError || !studentData) {
        setMessage({ type: 'error', text: `Estudiante "${studentName}" no encontrado en esta materia.` });
        return;
      }
      
      const { error: insertError } = await supabase
        .from('attendance_records').insert({ 
            student_id: studentData.id, 
            session_id: sessionId,
            subject_id: sessionData.subject_id
        });

      if (insertError) {
        if (insertError.code === '23505') {
          setMessage({ type: 'error', text: `Asistencia para "${studentName}" ya registrada.` });
        } else {
          throw insertError;
        }
      } else {
        setMessage({ type: 'success', text: `Asistencia registrada para: ${studentName}` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  }, [sessionId]);
  
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        if (devices && devices.length) {
          setCameras(devices);
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera'));
          setActiveCameraId(backCamera ? backCamera.id : devices[0].id);
        }
      })
      .catch(err => {
        console.error("Error getting cameras:", err);
        setMessage({ type: 'error', text: 'No se pudo acceder a las cámaras.' });
      });
  }, []);

  useEffect(() => {
    if (!activeCameraId) return;

    const qrcode = new Html5Qrcode(scannerContainerId);
    html5QrcodeRef.current = qrcode;

    const config: Html5QrcodeCameraScanConfig = { 
      fps: 10, 
      qrbox: { width: 280, height: 280 },
      aspectRatio: 1.0,
    };

    qrcode.start(
      activeCameraId,
      config,
      handleScan,
      undefined
    ).catch(err => console.error("Failed to start scanner", err));

    return () => {
      qrcode.stop().catch(error => {
        console.error("Failed to stop scanner on cleanup.", error);
      });
    };
  }, [activeCameraId, handleScan]);
  
  const handleCameraSwitch = () => {
    if (cameras.length < 2 || !activeCameraId) return;
    const currentIndex = cameras.findIndex(c => c.id === activeCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setActiveCameraId(cameras[nextIndex].id);
  };

  return (
    <div className="max-w-xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">Escanear Asistencia</h1>
      <p className="text-gray-600 mb-6">Apunta la cámara al código QR del estudiante.</p>
      
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-xl mb-6 text-left" role="alert">
        <div className="flex">
          <div className="py-1">
            <svg className="fill-current h-6 w-6 text-blue-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/></svg>
          </div>
          <div>
            <p className="font-bold">Permiso de cámara</p>
            <p className="text-sm">El navegador te pedirá permiso para usar la cámara. Por favor, acéptalo para comenzar a escanear.</p>
          </div>
        </div>
      </div>

      <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-gray-800">
        <div id={scannerContainerId} style={{ width: '100%', height: '100%' }}></div>
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
      <button
        onClick={() => navigate(-1)}
        className="mt-8 px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        Terminar Sesión
      </button>
    </div>
  );
};

export default ScanAttendance;
