import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import type { Subject, Student, AttendanceRecord, EvaluationCriterion, Assignment, Grade, Participation, PlannedClass } from '../types';

import StudentDetailModal from '../components/StudentDetailModal';
import AllStudentsQRModal from '../components/AllStudentsQRModal';
import PasswordPromptModal from '../components/PasswordPromptModal';
import ManualAttendanceModal from '../components/ManualAttendanceModal';
import ScheduleModal from '../components/ScheduleModal';
import AddStudentsModal from '../components/AddStudentsModal';
import PlannerManager from '../components/PlannerManager';
import GradingPeriodManager from '../components/GradingPeriodManager';
import AttendanceCalendar from '../components/AttendanceCalendar';
import DetailPane from '../components/DetailPane';
import StudentsPanel from '../components/StudentsPanel';

// --- Sub-componente para Criterios de Evaluación ---
const EvaluationManager: React.FC<{
  subjectId: string;
  criteria: EvaluationCriterion[];
  onCriteriaChange: () => void;
  participationsFeatureEnabled: boolean;
}> = ({ subjectId, criteria, onCriteriaChange, participationsFeatureEnabled }) => {
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState<number | ''>('');
  const [limit, setLimit] = useState<'multiple' | 'single'>('multiple');
  const [isAttendance, setIsAttendance] = useState(false);
  const [isParticipation, setIsParticipation] = useState(false);
  const [maxPoints, setMaxPoints] = useState<number | ''>('');
  const [activePeriod, setActivePeriod] = useState<number>(1);

  const filteredCriteria = criteria.filter(c => (c.grading_period || 1) === activePeriod);
  const totalPercentage = filteredCriteria.reduce((sum, crit) => sum + crit.percentage, 0);

  const handleCheckboxChange = (type: 'attendance' | 'participation') => {
      if (type === 'attendance') {
          setIsAttendance(!isAttendance);
          if (!isAttendance) setIsParticipation(false); // Uncheck other if this one is checked
      } else if (type === 'participation') {
          setIsParticipation(!isParticipation);
          if (!isParticipation) setIsAttendance(false); // Uncheck other if this one is checked
      }
  };

  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || percentage === '' || +percentage <= 0) {
        alert('Por favor, introduce un nombre y un porcentaje válido.');
        return;
    }
    if (totalPercentage + +percentage > 100) {
      alert('El porcentaje total para este parcial no puede superar el 100%.');
      return;
    }
     if (isParticipation && (maxPoints === '' || +maxPoints <= 0)) {
        alert('Por favor, define los puntos necesarios para la calificación máxima.');
        return;
    }

    const newCriterion: Partial<EvaluationCriterion> = {
        subject_id: subjectId,
        name,
        percentage: +percentage,
        type: 'default',
        assignment_limit: limit,
        grading_period: activePeriod,
    };

    if (isAttendance) {
        newCriterion.type = 'attendance';
        newCriterion.assignment_limit = 'single';
    } else if (isParticipation) {
        newCriterion.type = 'participation';
        newCriterion.assignment_limit = 'single';
        newCriterion.max_points = +maxPoints!;
    }

    const { error } = await supabase.from('evaluation_criteria').insert(newCriterion);
    if (error) alert('Error al añadir criterio: ' + error.message);
    else {
      setName('');
      setPercentage('');
      setLimit('multiple');
      setIsAttendance(false);
      setIsParticipation(false);
      setMaxPoints('');
      onCriteriaChange();
    }
  };

  const handleDeleteCriterion = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este criterio? Esto también eliminará las actividades y calificaciones asociadas.')) {
        const { error } = await supabase.from('evaluation_criteria').delete().eq('id', id);
        if (error) alert('Error al eliminar criterio: ' + error.message);
        else onCriteriaChange();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border">
        <h2 className="text-xl font-bold mb-4">Criterios de Evaluación</h2>
        
        <div className="flex border-b mb-4">
            {[1, 2, 3, 4].map(period => (
                <button
                    key={period}
                    type="button"
                    onClick={() => setActivePeriod(period)}
                    className={`px-4 py-2 -mb-px border-b-2 font-semibold text-sm transition-colors ${activePeriod === period ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                    {period}er Parcial
                </button>
            ))}
        </div>
        
        <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${totalPercentage > 100 ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(totalPercentage, 100)}%` }}></div>
            </div>
            <p className={`text-right text-sm font-semibold mt-1 ${totalPercentage > 100 ? 'text-red-500' : ''}`}>{totalPercentage}% de 100%</p>
        </div>
        <form onSubmit={handleAddCriterion} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start mb-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre (Ej: Tareas)" className="border border-gray-300 rounded-lg px-3 py-2" required/>
            <input type="number" value={percentage} onChange={e => setPercentage(e.target.value === '' ? '' : +e.target.value)} placeholder="%" className="border border-gray-300 rounded-lg px-3 py-2" required min="1" max="100"/>
            
            <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-2 pl-1">
                    <input id="is-default" type="radio" checked={!isAttendance && !isParticipation} onChange={() => { setIsAttendance(false); setIsParticipation(false); }} name="criterionType" className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <label htmlFor="is-default" className="text-sm text-gray-600">Actividades/Exámenes (por defecto)</label>
                </div>
                { !isAttendance && !isParticipation && (
                     <select value={limit} onChange={e => setLimit(e.target.value as any)} className="border border-gray-300 rounded-lg px-3 py-2 w-full">
                        <option value="multiple">Múltiples actividades</option>
                        <option value="single">Una sola actividad</option>
                    </select>
                )}
                 <div className="flex items-center gap-2 pl-1">
                    <input id="is-attendance" type="radio" checked={isAttendance} onChange={() => handleCheckboxChange('attendance')} name="criterionType" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <label htmlFor="is-attendance" className="text-sm text-gray-600">Calificar con asistencia</label>
                </div>
                {participationsFeatureEnabled && (
                  <div className="flex items-center gap-2 pl-1">
                      <input id="is-participation" type="radio" checked={isParticipation} onChange={() => handleCheckboxChange('participation')} name="criterionType" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <label htmlFor="is-participation" className="text-sm text-gray-600">Calificar con participaciones</label>
                  </div>
                )}
                {isParticipation && participationsFeatureEnabled && (
                    <input type="number" value={maxPoints} onChange={e => setMaxPoints(e.target.value === '' ? '' : +e.target.value)} placeholder="Puntos para calificación máxima (10)" className="border border-gray-300 rounded-lg px-3 py-2 w-full mt-2" required min="1"/>
                )}
            </div>

            <button type="submit" className="md:col-span-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">Añadir Criterio</button>
        </form>
        <ul className="space-y-2">
            {filteredCriteria.map(c => {
                 let description = '';
                switch(c.type) {
                    case 'attendance': description = 'Automático por asistencia'; break;
                    case 'participation': description = `Automático por participaciones (Meta: ${c.max_points} pts)`; break;
                    default: description = c.assignment_limit === 'single' ? 'Una sola actividad' : 'Múltiples actividades';
                }
                return (
                    <li key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                            <span>{c.name} - <span className="font-bold">{c.percentage}%</span></span>
                            <p className="text-xs text-gray-500">{description}</p>
                        </div>
                        <button onClick={() => handleDeleteCriterion(c.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Eliminar</button>
                    </li>
                );
            })}
        </ul>
    </div>
  );
};

// --- Sub-componente para Actividades ---
const AssignmentManager: React.FC<{
    subjectId: string;
    assignments: Assignment[];
    criteria: EvaluationCriterion[];
    onAssignmentsChange: () => void;
}> = ({ subjectId, assignments, criteria, onAssignmentsChange }) => {
    const [name, setName] = useState('');
    const [criterionId, setCriterionId] = useState('');

    const availableCriteria = criteria.filter(c => c.type === 'default');
    const selectedCriterion = criteria.find(c => c.id === criterionId);
    
    const canAddAssignment = selectedCriterion ? 
        selectedCriterion.assignment_limit === 'multiple' || !assignments.some(a => a.evaluation_criterion_id === criterionId)
        : false;

    const handleAddAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !criterionId || !canAddAssignment) {
            alert('Por favor, selecciona un criterio válido y escribe un nombre para la actividad.');
            return;
        }
        const { error } = await supabase.from('assignments').insert({ subject_id: subjectId, name, evaluation_criterion_id: criterionId });
        if (error) alert('Error al añadir actividad: ' + error.message);
        else {
            setName('');
            setCriterionId('');
            onAssignmentsChange();
        }
    };
    
    return (
         <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h2 className="text-xl font-bold mb-4">Actividades</h2>
             {availableCriteria.length === 0 ? <p className="text-gray-500">Primero debes añadir al menos un criterio de evaluación de tipo "Actividades/Exámenes".</p> : (
                 <>
                    <form onSubmit={handleAddAssignment} className="flex flex-col sm:flex-row gap-3 mb-4">
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la actividad" className="flex-grow border border-gray-300 rounded-lg px-3 py-2" required />
                        <select value={criterionId} onChange={e => setCriterionId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2" required>
                            <option value="">Selecciona un criterio</option>
                            {availableCriteria.map(c => <option key={c.id} value={c.id}>{c.name} (Parcial {c.grading_period || 1})</option>)}
                        </select>
                        <button type="submit" disabled={!canAddAssignment || !criterionId || !name} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-300">Crear</button>
                    </form>
                     {!canAddAssignment && criterionId && <p className="text-sm text-yellow-600 text-center mb-3">Este criterio solo permite una actividad y ya ha sido creada.</p>}
                     <ul className="space-y-2">
                         {assignments.map(a => (
                             <li key={a.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                 <div>
                                    <span className="font-medium">{a.name}</span>
                                    <p className="text-xs text-gray-500">{criteria.find(c=>c.id === a.evaluation_criterion_id)?.name} &bull; Creado el: {new Date(a.created_at).toLocaleDateString('es-ES')}</p>
                                 </div>
                             </li>
                         ))}
                     </ul>
                 </>
             )}
         </div>
    );
};


// --- Componente para gestionar Participaciones ---
const ParticipationManager: React.FC<{
    subjectId: string;
    students: Student[];
    participations: Participation[];
    onParticipationsChange: () => void;
}> = ({ subjectId, students, participations, onParticipationsChange }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);

    const participationsByStudent = useMemo(() => {
        const map = new Map<string, { semesterTotal: number; daily: Participation[] }>();
        students.forEach(s => map.set(s.id, { semesterTotal: 0, daily: [] }));
        participations.forEach(p => {
            if (map.has(p.student_id)) {
                const current = map.get(p.student_id)!;
                current.semesterTotal += p.points;
                if (p.date === selectedDate) {
                    current.daily.push(p);
                }
            }
        });
        return map;
    }, [students, participations, selectedDate]);
    
    const handleAddParticipation = async (studentId: string, points: number) => {
        setLoadingStudentId(studentId);
        const { error } = await supabase.from('participations').insert({
            student_id: studentId,
            subject_id: subjectId,
            points: points,
            date: selectedDate
        });
        if (error) alert('Error al añadir participación: ' + error.message);
        else onParticipationsChange();
        setLoadingStudentId(null);
    };

    const handleDeleteParticipation = async (participationId: string) => {
        if (window.confirm('¿Eliminar esta participación?')) {
            const { error } = await supabase.from('participations').delete().eq('id', participationId);
            if (error) alert('Error al eliminar: ' + error.message);
            else onParticipationsChange();
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h2 className="text-xl font-bold mb-4">Registro de Participaciones</h2>
            <div className="mb-4">
                <label htmlFor="participation-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input type="date" id="participation-date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2"/>
            </div>
             <div className="max-h-96 overflow-y-auto pr-2">
                <ul className="divide-y divide-gray-200">
                    {students.map(student => {
                        const studentData = participationsByStudent.get(student.id);
                        return (
                            <li key={student.id} className="py-3 px-2 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <div>
                                    <p className="text-gray-800 font-medium">{student.name}</p>
                                    <p className="text-xs text-gray-500">Total Semestre: <span className="font-bold">{studentData?.semesterTotal.toFixed(1) ?? '0.0'} pts</span></p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-wrap gap-1 min-h-[2rem] items-center">
                                        {studentData?.daily.map(p => (
                                            <span key={p.id} className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                +{p.points}
                                                <button onClick={() => handleDeleteParticipation(p.id)} className="text-blue-500 hover:text-blue-800">&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                    <button onClick={() => handleAddParticipation(student.id, 0.5)} disabled={loadingStudentId === student.id} className="px-2.5 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300">+0.5</button>
                                    <button onClick={() => handleAddParticipation(student.id, 1)} disabled={loadingStudentId === student.id} className="px-2.5 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300">+1</button>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    );
};


// --- Componente Principal ---
type View = 'hub' | 'evaluation' | 'planner' | 'participations' | 'attendance';

const SubjectDetail: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [plannedClasses, setPlannedClasses] = useState<PlannedClass[]>([]);
  const [participationsFeatureEnabled, setParticipationsFeatureEnabled] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('hub');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAllQRs, setShowAllQRs] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAddStudentsModalOpen, setIsAddStudentsModalOpen] = useState(false);

  const [verifyingPasswordForDate, setVerifyingPasswordForDate] = useState<Date | null>(null);
  const [manualAttendanceDate, setManualAttendanceDate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    try {
      const [
          subjectRes, 
          studentsRes, 
          attendanceRes, 
          criteriaRes, 
          assignmentsRes, 
          gradesRes, 
          plannedClassesRes
      ] = await Promise.all([
        supabase.from('subjects').select('*').eq('id', subjectId).single(),
        supabase.from('students').select('*').eq('subject_id', subjectId).order('name'),
        supabase.from('attendance_records').select(`*, students (name)`).eq('subject_id', subjectId),
        supabase.from('evaluation_criteria').select('*').eq('subject_id', subjectId).order('created_at'),
        supabase.from('assignments').select('*').eq('subject_id', subjectId).order('created_at'),
        supabase.from('grades').select('*').eq('subject_id', subjectId),
        supabase.from('planned_classes').select('*').eq('subject_id', subjectId).order('class_date'),
      ]);

      const responses = { subjectRes, studentsRes, attendanceRes, criteriaRes, assignmentsRes, gradesRes, plannedClassesRes };
      for (const [key, res] of Object.entries(responses)) {
        if (res.error) throw new Error(`Error fetching ${key}: ${res.error.message}`);
      }
      
      setSubject(subjectRes.data);
      setStudents(studentsRes.data || []);
      setAttendance((attendanceRes.data as any) || []);
      setCriteria(criteriaRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setGrades(gradesRes.data || []);
      setPlannedClasses(plannedClassesRes.data || []);

      const participationsRes = await supabase.from('participations').select('*').eq('subject_id', subjectId);
      
      if (participationsRes.error) {
          console.warn( "Error al cargar participaciones. La funcionalidad de participaciones está deshabilitada.", participationsRes.error );
          setParticipations([]);
          setParticipationsFeatureEnabled(false);
      } else {
          setParticipations(participationsRes.data || []);
          setParticipationsFeatureEnabled(true);
      }

    } catch (err: any) {
      setError('Error al cargar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const scheduledSessionDates = useMemo(() => {
    if (!subject?.schedule || subject.schedule.length === 0) return [];
    
    const schoolEvents = [ { title: 'Inicio de semestre', type: 'event', date: '2025-09-01' }, { title: 'Suspensión de clases', type: 'holiday', date: '2025-09-16' }, { title: 'Efemerides', type: 'event', date: '2025-10-01' }, { title: 'Aplicación de exámenes 1er parcial', type: 'exam', start: '2025-10-06', end: '2025-10-08' }, { title: 'Exámenes Extemporáneos', type: 'exam', start: '2025-10-11', end: '2025-10-12' }, { title: 'Entrega de calif. 1er parcial', type: 'grades', date: '2025-10-17' }, { title: 'Aplicación de exámenes 2do parcial', type: 'exam', start: '2025-11-03', end: '2025-11-05' }, { title: 'Efemerides', type: 'event', date: '2025-11-06' }, { title: 'Exámenes Extemporáneos', type: 'exam', start: '2025-11-11', end: '2025-11-12' }, { title: 'Entrega de calif. 2do parcial', type: 'grades', date: '2025-11-14' }, { title: 'Suspensión de clases', type: 'holiday', date: '2025-11-17' }, { title: 'Semana de conferencias', type: 'event', start: '2025-12-01', end: '2025-12-05' }, { title: 'Aplicación de exámenes 3er parcial', type: 'exam', start: '2025-12-03', end: '2025-12-05' }, { title: 'Exámenes Extemporáneos', type: 'exam', start: '2025-12-08', end: '2025-12-09' }, { title: 'Entrega de calif. 3er parcial', type: 'grades', date: '2025-12-12' }, { title: 'Efemerides', type: 'event', date: '2025-12-16' }, { title: 'Aplicación de exámenes 4o parcial', type: 'exam', start: '2025-12-17', end: '2025-12-19' }, { title: 'Fin de Semestre', type: 'event', date: '2025-12-19' }, { title: 'Periodo Vacacional', type: 'vacation', start: '2025-12-19', end: '2026-02-03' }, { title: 'Exámenes Extemporáneos', type: 'exam', start: '2026-01-05', end: '2026-01-06' }, { title: 'Entrega de calif. Finales', type: 'grades', date: '2026-01-09' }, { title: 'Aplicación de exámenes extraordinarios', type: 'exam', date: '2026-01-16' }, { title: 'Recursamiento de Materias', type: 'event', date: '2026-01-19' }, { title: 'Aplicación de exámenes extraordinarios', type: 'exam', date: '2026-01-23' }, { title: 'Inicio de Semestre', type: 'event', date: '2026-02-04' }, ];
    const eventMap = new Map();
    schoolEvents.forEach(event => { if ('date' in event && event.date) { eventMap.set(event.date, event); } else if ('start' in event && 'end' in event && event.start && event.end) { let currentDate = new Date(event.start + 'T12:00:00Z'); let endDate = new Date(event.end + 'T12:00:00Z'); while (currentDate <= endDate) { const dateString = currentDate.toISOString().split('T')[0]; eventMap.set(dateString, event); currentDate.setUTCDate(currentDate.getUTCDate() + 1); } } });
    const dates: string[] = [];
    const scheduleDays = subject.schedule.map(s => s.day);
    const semesterStart = new Date(subject.grading_periods_dates?.['1'] || '2025-09-01' + 'T00:00:00Z');
    const today = new Date();
    let current = new Date(semesterStart.getTime());
    while(current <= today) { const currentDayOfWeek = current.getUTCDay() === 0 ? 7 : current.getUTCDay(); if (scheduleDays.includes(currentDayOfWeek)) { const dateString = current.toISOString().split('T')[0]; const event = eventMap.get(dateString); const isNonLectiveDay = event && (event.type === 'holiday' || event.type === 'vacation'); if (!isNonLectiveDay) { dates.push(dateString); } } current.setUTCDate(current.getUTCDate() + 1); }
    return dates;
  }, [subject]);
  
    const studentsWithPendingAssignments = useMemo(() => {
        const defaultCriteriaIds = new Set( criteria.filter(c => c.type === 'default').map(c => c.id) );
        const gradableAssignments = assignments.filter(a => defaultCriteriaIds.has(a.evaluation_criterion_id));
        if (gradableAssignments.length === 0) return new Set<string>();
        const studentGradedAssignments = new Map<string, Set<string>>();
        grades.forEach(grade => { if (!studentGradedAssignments.has(grade.student_id)) { studentGradedAssignments.set(grade.student_id, new Set()); } studentGradedAssignments.get(grade.student_id)!.add(grade.assignment_id); });
        const pendingStudents = new Set<string>();
        students.forEach(student => { const gradedAssignmentIds = studentGradedAssignments.get(student.id) || new Set(); const hasMissingAssignment = gradableAssignments.some(assignment => !gradedAssignmentIds.has(assignment.id)); if (hasMissingAssignment) { pendingStudents.add(student.id); } });
        return pendingStudents;
    }, [students, assignments, grades, criteria]);

  const startAttendanceSession = async () => {
    if (!subjectId) return;
    try {
        const { data, error } = await supabase.from('attendance_sessions').insert({ subject_id: subjectId }).select().single();
        if (error) throw error;
        if (data) navigate(`/scan/${data.id}`);
    } catch (err: any) {
        setError("No se pudo iniciar la sesión de asistencia: " + err.message);
    }
  };

  const handleRequestManualAttendance = (date: Date) => {
    const isVerified = sessionStorage.getItem('manualAttendanceVerified') === 'true';
    if (isVerified) { setManualAttendanceDate(date); } 
    else { setVerifyingPasswordForDate(date); }
  };

  const handlePasswordSuccess = () => {
      sessionStorage.setItem('manualAttendanceVerified', 'true');
      setManualAttendanceDate(verifyingPasswordForDate);
      setVerifyingPasswordForDate(null);
  };

  const handleSaveManualAttendance = () => {
      setManualAttendanceDate(null);
      fetchData();
  };


  if (loading) return <p className="text-center text-gray-500 mt-8">Cargando...</p>;
  if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;
  if (!subject) return <p className="text-center text-gray-500 mt-8">Materia no encontrada.</p>;

  const totalPercentage = criteria.reduce((sum, crit) => sum + crit.percentage, 0);

  return (
    <div>
        {selectedStudent && <StudentDetailModal student={selectedStudent} subject={subject} criteria={criteria} assignments={assignments} grades={grades.filter(g => g.student_id === selectedStudent.id)} allAttendance={attendance} participations={participations.filter(p => p.student_id === selectedStudent.id)} scheduledSessionDates={scheduledSessionDates} onClose={() => setSelectedStudent(null)} />}
        {showAllQRs && <AllStudentsQRModal students={students} subjectName={subject.name} onClose={() => setShowAllQRs(false)} />}
        {isAddStudentsModalOpen && <AddStudentsModal subjectId={subjectId!} onClose={() => setIsAddStudentsModalOpen(false)} onSave={() => { fetchData(); setIsAddStudentsModalOpen(false); }} />}
        {verifyingPasswordForDate && <PasswordPromptModal onSuccess={handlePasswordSuccess} onClose={() => setVerifyingPasswordForDate(null)} />}
        {isScheduleModalOpen && <ScheduleModal subject={subject} onClose={() => setIsScheduleModalOpen(false)} onSave={fetchData} />}
        {manualAttendanceDate && <ManualAttendanceModal date={manualAttendanceDate} students={students} subjectId={subjectId!} onClose={() => setManualAttendanceDate(null)} onSave={handleSaveManualAttendance} />}

        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">{subject.name}</h1>
                <p className="text-lg text-gray-500 capitalize flex items-center gap-2">
                    {subject.term}
                    <button onClick={() => setIsScheduleModalOpen(true)} className="text-sm text-primary-600 hover:underline">
                        (Editar Horario)
                    </button>
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => navigate(`/subject/${subjectId}/rollcall`)} className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl shadow-sm hover:bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z" clipRule="evenodd" /></svg>
                    Pasar Lista
                </button>
                <button onClick={startAttendanceSession} className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 1a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zM3 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 1a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zM10 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V3zm2 1a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM10 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm3 1a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" /></svg>
                    Asistencia con QR
                </button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
                <div onClick={() => setActiveView('evaluation')} className="group p-6 bg-white rounded-xl shadow-lg border hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                    <div className="bg-primary-100 text-primary-600 rounded-lg w-12 h-12 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-800">Evaluación</h3>
                    <p className="mt-1 text-sm text-gray-500">{criteria.length} Criterios &bull; {totalPercentage}% Cubierto</p>
                </div>

                <div onClick={() => setActiveView('planner')} className="group p-6 bg-white rounded-xl shadow-lg border hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                    <div className="bg-cyan-100 text-cyan-600 rounded-lg w-12 h-12 flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-800">Planificador de Clases</h3>
                    <p className="mt-1 text-sm text-gray-500">{plannedClasses.length} clases planificadas</p>
                </div>
                
                {participationsFeatureEnabled && (
                <div onClick={() => setActiveView('participations')} className="group p-6 bg-white rounded-xl shadow-lg border hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                     <div className="bg-amber-100 text-amber-600 rounded-lg w-12 h-12 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.975-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-800">Participaciones</h3>
                    <p className="mt-1 text-sm text-gray-500">{participations.length} participaciones registradas</p>
                </div>
                )}
                
                <div onClick={() => setActiveView('attendance')} className="group p-6 bg-white rounded-xl shadow-lg border hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
                    <div className="bg-green-100 text-green-600 rounded-lg w-12 h-12 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-800">Asistencia</h3>
                    <p className="mt-1 text-sm text-gray-500">{scheduledSessionDates.length} sesiones de clase hasta hoy</p>
                </div>
            </div>

            <div className="lg:col-span-1 lg:sticky top-6">
                <StudentsPanel 
                    students={students}
                    studentsWithPendingAssignments={studentsWithPendingAssignments}
                    onAddStudentClick={() => setIsAddStudentsModalOpen(true)}
                    onGradeStudentClick={() => navigate(`/subject/${subjectId}/multi-grade`)}
                    onShowAllQRsClick={() => setShowAllQRs(true)}
                    onStudentClick={(student) => setSelectedStudent(student)}
                />
            </div>
        </div>

        {/* --- Detail Panes --- */}
        <DetailPane title="Gestión de Evaluación" active={activeView === 'evaluation'} onBack={() => setActiveView('hub')}>
            <div className="space-y-8">
                <GradingPeriodManager subject={subject} onDatesChange={fetchData} />
                <EvaluationManager subjectId={subjectId!} criteria={criteria} onCriteriaChange={fetchData} participationsFeatureEnabled={participationsFeatureEnabled} />
                <AssignmentManager subjectId={subjectId!} assignments={assignments} criteria={criteria} onAssignmentsChange={fetchData} />
            </div>
        </DetailPane>

        <DetailPane title="Planificador de Clases" active={activeView === 'planner'} onBack={() => setActiveView('hub')}>
            <PlannerManager subject={subject} plannedClasses={plannedClasses} onDataChange={fetchData} />
        </DetailPane>

        {participationsFeatureEnabled && (
            <DetailPane title="Registro de Participaciones" active={activeView === 'participations'} onBack={() => setActiveView('hub')}>
                <ParticipationManager subjectId={subjectId!} students={students} participations={participations} onParticipationsChange={fetchData} />
            </DetailPane>
        )}

        <DetailPane title="Registro de Asistencia" active={activeView === 'attendance'} onBack={() => setActiveView('hub')}>
             <div className="bg-white p-6 rounded-xl shadow-lg border">
                <AttendanceCalendar subject={subject} attendance={attendance} students={students} onAddManualAttendance={handleRequestManualAttendance} />
            </div>
        </DetailPane>
    </div>
  );
};

export default SubjectDetail;
