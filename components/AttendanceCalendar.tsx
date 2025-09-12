
import React, { useMemo, useState } from 'react';
import type { AttendanceRecord, Student, Subject } from '../types';

// --- Data del Calendario Escolar ---
const schoolEvents = [
    { title: 'Inicio de semestre', type: 'event', date: '2025-09-01' },
    { title: 'Suspensión de clases', type: 'holiday', date: '2025-09-16' },
    { title: 'Efemerides', type: 'event', date: '2025-10-01' },
    { title: 'Aplicación de exámenes 1er parcial', type: 'exam', start: '2025-10-06', end: '2025-10-08' },
    { title: 'Exámenes Extemporáneos', type: 'exam', start: '2025-10-11', end: '2025-10-12' },
    { title: 'Entrega de calif. 1er parcial', type: 'grades', date: '2025-10-17' },
    { title: 'Aplicación de exámenes 2do parcial', type: 'exam', start: '2025-11-03', end: '2025-11-05' },
    { title: 'Efemerides', type: 'event', date: '2025-11-06' },
    { title: 'Exámenes Extemporáneos', type: 'exam', start: '2025-11-11', end: '2025-11-12' },
    { title: 'Entrega de calif. 2do parcial', type: 'grades', date: '2025-11-14' },
    { title: 'Suspensión de clases', type: 'holiday', date: '2025-11-17' },
    { title: 'Semana de conferencias', type: 'event', start: '2025-12-01', end: '2025-12-05' },
    { title: 'Aplicación de exámenes 3er parcial', type: 'exam', start: '2025-12-03', end: '2025-12-05' },
    { title: 'Exámenes Extemporáneos', type: 'exam', start: '2025-12-08', end: '2025-12-09' },
    { title: 'Entrega de calif. 3er parcial', type: 'grades', date: '2025-12-12' },
    { title: 'Efemerides', type: 'event', date: '2025-12-16' },
    { title: 'Aplicación de exámenes 4o parcial', type: 'exam', start: '2025-12-17', end: '2025-12-19' },
    { title: 'Fin de Semestre', type: 'event', date: '2025-12-19' },
    { title: 'Periodo Vacacional', type: 'vacation', start: '2025-12-19', end: '2026-02-03' },
    { title: 'Exámenes Extemporáneos', type: 'exam', start: '2026-01-05', end: '2026-01-06' },
    { title: 'Entrega de calif. Finales', type: 'grades', date: '2026-01-09' },
    { title: 'Aplicación de exámenes extraordinarios', type: 'exam', date: '2026-01-16' },
    { title: 'Recursamiento de Materias', type: 'event', date: '2026-01-19' },
    { title: 'Aplicación de exámenes extraordinarios', type: 'exam', date: '2026-01-23' },
    { title: 'Inicio de Semestre', type: 'event', date: '2026-02-04' },
];

const eventMap = new Map();
schoolEvents.forEach(event => {
    if (event.date) {
        eventMap.set(event.date, event);
    } else if (event.start && event.end) {
        let currentDate = new Date(event.start + 'T12:00:00Z');
        let endDate = new Date(event.end + 'T12:00:00Z');
        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split('T')[0];
            eventMap.set(dateString, event);
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
    }
});


interface AttendanceCalendarProps {
  subject: Subject;
  attendance: AttendanceRecord[];
  students: Student[];
  onAddManualAttendance: (date: Date) => void;
}

const AttendanceModal: React.FC<{ date: Date; attendees: string[]; absentees: string[]; onClose: () => void }> = ({ date, attendees, absentees, onClose }) => {
    const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-2xl relative max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl font-bold mb-4 capitalize">{formattedDate}</h3>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2">{attendees.length} estudiante(s) presente(s):</h4>
                        <ul className="divide-y divide-gray-200">
                            {attendees.sort().map((name, index) => (
                                <li key={`present-${index}`} className="py-2 text-gray-800">{name}</li>
                            ))}
                        </ul>
                    </div>

                    {absentees.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-red-600 mb-2">{absentees.length} estudiante(s) ausente(s):</h4>
                            <ul className="divide-y divide-red-100">
                                {absentees.sort().map((name, index) => (
                                    <li key={`absent-${index}`} className="py-2 text-red-500 font-medium">{name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Legend: React.FC = () => (
    <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center text-xs">
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-400 mr-1.5"></span>Asistencia Tomada</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-cyan-300 mr-1.5"></span>Examen</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-300 mr-1.5"></span>Suspensión/Feriado</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-300 mr-1.5"></span>Vacaciones</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-300 mr-1.5"></span>Evento</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-pink-300 mr-1.5"></span>Entrega Calificaciones</div>
    </div>
);


const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ subject, attendance, students, onAddManualAttendance }) => {
    const [selectedDateInfo, setSelectedDateInfo] = useState<{ date: Date; attendees: string[]; absentees: string[] } | null>(null);
    const allStudentNames = useMemo(() => students.map(s => s.name), [students]);

    const attendanceByDate = useMemo(() => {
        const map = new Map<string, string[]>();
        attendance.forEach(record => {
            if (record.students?.name) {
                // FIX: Use UTC date string to prevent timezone-related errors.
                const dateString = new Date(record.created_at).toISOString().split('T')[0];

                if (!map.has(dateString)) map.set(dateString, []);
                map.get(dateString)!.push(record.students.name);
            }
        });
        return map;
    }, [attendance]);
    
    const monthsToRender = [
        { year: 2025, month: 8 }, { year: 2025, month: 9 }, { year: 2025, month: 10 },
        { year: 2025, month: 11 }, { year: 2026, month: 0 }, { year: 2026, month: 1 }
    ];
    
    if (!subject.schedule || subject.schedule.length === 0) {
        return <p className="text-center text-gray-600">Por favor, establece un horario para esta materia para poder gestionar la asistencia.</p>;
    }

    const renderMonth = (year: number, month: number) => {
        const monthName = new Date(year, month, 1).toLocaleString('es-ES', { month: 'long' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let firstDayOfWeek = new Date(year, month, 1).getDay();
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

        const blanks = Array(firstDayOfWeek).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
        
        // Use UTC for robust date comparisons, avoiding timezone issues.
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

        return (
            <div key={`${year}-${month}`} className="break-inside-avoid">
                <h3 className="text-xl font-bold text-gray-800 text-center capitalize mb-3">{monthName} {year}</h3>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {weekDays.map(day => <div key={day} className="font-semibold text-gray-500 pb-2">{day}</div>)}
                    {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                    {days.map(day => {
                        const currentDate = new Date(Date.UTC(year, month, day));
                        const dateString = currentDate.toISOString().split('T')[0];
                        const dayOfWeek = currentDate.getUTCDay() === 0 ? 7 : currentDate.getUTCDay();

                        const isScheduledClassDay = subject.schedule?.some(s => s.day === dayOfWeek) ?? false;
                        
                        const attendees = attendanceByDate.get(dateString) || [];
                        const event = eventMap.get(dateString);
                        const hasAttendance = attendees.length > 0;
                        
                        const isToday = currentDate.getTime() === todayUTC.getTime();
                        const isPast = currentDate < todayUTC;
                        
                        let dayClass = "w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 relative";
                        let isClickable = false;
                        const isNonLectiveEvent = event && (event.type === 'holiday' || event.type === 'vacation');

                        if (hasAttendance) {
                            dayClass += " bg-green-400 text-white font-bold cursor-pointer hover:bg-green-500";
                            isClickable = true;
                        } else if (isPast && isScheduledClassDay && !isNonLectiveEvent) {
                            dayClass += " hover:bg-opacity-80 cursor-pointer border border-dashed border-gray-400";
                            isClickable = true;
                            if (event) {
                                const colorClasses: { [key: string]: string } = { exam: 'bg-cyan-300', grades: 'bg-pink-300', event: 'bg-orange-300' };
                                dayClass += ` ${colorClasses[event.type] || ''} text-gray-800`;
                            } else {
                                dayClass += " text-gray-700";
                            }
                        } else if (event) {
                            const colorClasses: { [key: string]: string } = { exam: 'bg-cyan-300', holiday: 'bg-red-300', vacation: 'bg-purple-300', grades: 'bg-pink-300', event: 'bg-orange-300' };
                            dayClass += ` ${colorClasses[event.type]} text-gray-800`;
                        } else if (isScheduledClassDay) {
                            dayClass += " text-gray-700 hover:bg-gray-100";
                        } else {
                            dayClass += " text-gray-300";
                        }
                        
                        if (isToday && isScheduledClassDay) dayClass += " ring-2 ring-primary-500";

                        const handleClick = () => {
                            if (!isClickable) return;
                            if (hasAttendance) {
                                const absentees = allStudentNames.filter(name => !attendees.includes(name));
                                setSelectedDateInfo({ date: currentDate, attendees, absentees });
                            } else {
                                onAddManualAttendance(currentDate);
                            }
                        };

                        return (
                            <div key={day} className="py-1 flex items-center justify-center">
                                <div className={dayClass} onClick={handleClick} role="button" tabIndex={isClickable ? 0 : -1} title={event?.title}>
                                    {day}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div>
            {selectedDateInfo && <AttendanceModal 
                date={selectedDateInfo.date} 
                attendees={selectedDateInfo.attendees} 
                absentees={selectedDateInfo.absentees}
                onClose={() => setSelectedDateInfo(null)} 
            />}
             <div className="md:columns-2 lg:columns-3 gap-8 space-y-8">
                {monthsToRender.map(({year, month}) => renderMonth(year, month))}
            </div>
            <Legend/>
        </div>
    );
};

export default AttendanceCalendar;
