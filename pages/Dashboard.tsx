import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Subject } from '../types';

const SubjectCard: React.FC<{ subject: Subject }> = ({ subject }) => (
    <Link to={`/subject/${subject.id}`} className="block p-6 bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">{subject.name}</h5>
        <p className="font-normal text-gray-500 capitalize">{subject.term}</p>
        <div className="mt-4 flex justify-end">
            <span className="inline-flex items-center text-sm font-medium text-primary-500 hover:text-primary-700">
                Ver Detalles
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </span>
        </div>
    </Link>
);

const TodaysSchedule: React.FC<{ subjects: Subject[] }> = ({ subjects }) => {
    const { todaysClasses, formattedDate } = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1 = Lunes, 7 = Domingo

        const classes = subjects.flatMap(subject => {
            if (!subject.schedule) return [];
            return subject.schedule
                .filter(s => s.day === dayOfWeek)
                .map(s => ({
                    subjectId: subject.id,
                    subjectName: subject.name,
                    time: s.time,
                    duration: s.duration
                }));
        }).sort((a, b) => a.time.localeCompare(b.time));

        const dateString = today.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        return { todaysClasses: classes, formattedDate: dateString };
    }, [subjects]);

    const formatTime = (time: string, duration: number) => {
        const startTime = new Date(`1970-01-01T${time}Z`);
        const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
        const formatOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' };
        return `${startTime.toLocaleTimeString('es-ES', formatOptions)} - ${endTime.toLocaleTimeString('es-ES', formatOptions)}`;
    };

    return (
        <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800">Tu Horario para Hoy</h2>
            <p className="text-md text-gray-500 capitalize">{formattedDate}</p>
            
            {todaysClasses.length === 0 ? (
                <div className="mt-6 text-center py-8 bg-gray-50 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m8.4-8.4l-.7.7M4.3 4.3l-.7.7m16.1 0l-.7-.7M3.6 20.4l-.7-.7" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
                    </svg>
                    <p className="mt-4 font-semibold text-gray-700">No tienes clases programadas para hoy.</p>
                    <p className="text-sm text-gray-500">¡Disfruta tu día!</p>
                </div>
            ) : (
                <ul className="mt-4 space-y-3">
                    {todaysClasses.map((cls, index) => (
                        <li key={index}>
                            <Link to={`/subject/${cls.subjectId}`} className="block p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 text-center bg-primary-600 text-white font-bold rounded-md px-3 py-1.5">
                                        <p className="text-sm">{new Date(`1970-01-01T${cls.time}Z`).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'UTC' })}</p>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-bold text-gray-800">{cls.subjectName}</p>
                                        <p className="text-sm text-gray-600">{formatTime(cls.time, cls.duration)}</p>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


const Dashboard: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubjects(data || []);
    } catch (err: any) {
      setError('Error al cargar las materias: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return (
    <div>
      {!loading && <TodaysSchedule subjects={subjects} />}
        
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Materias</h1>
        <button
          onClick={() => navigate('/add-subject')}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          Nueva Materia
        </button>
      </div>

      {loading && <p className="text-center text-gray-500">Cargando...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!loading && !error && subjects.length === 0 && (
          <div className="text-center py-12 px-6 bg-white rounded-2xl shadow-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay materias</h3>
              <p className="mt-1 text-sm text-gray-500">Empieza por crear tu primera materia.</p>
          </div>
      )}

      {!loading && subjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
