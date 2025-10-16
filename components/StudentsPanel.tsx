import React from 'react';
import type { Student } from '../types';

interface Props {
    students: Student[];
    subjectId: string;
    studentsWithPendingAssignments: Set<string>;
    onAddStudentClick: () => void;
    onGradeStudentClick: () => void;
    onShowAllQRsClick: () => void;
    onStudentClick: (student: Student) => void;
}

const StudentsPanel: React.FC<Props> = ({
    students,
    subjectId,
    studentsWithPendingAssignments,
    onAddStudentClick,
    onGradeStudentClick,
    onShowAllQRsClick,
    onStudentClick
}) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Estudiantes ({students.length})</h2>
            <div className="flex flex-col gap-2 mb-4">
                <button onClick={onAddStudentClick} className="w-full inline-flex items-center justify-center px-4 py-2 text-sm bg-primary-600 text-white font-semibold rounded-lg shadow-sm hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Añadir Estudiantes
                </button>
                <button onClick={onGradeStudentClick} className="w-full inline-flex items-center justify-center px-4 py-2 text-sm bg-green-500 text-white font-semibold rounded-lg shadow-sm hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 1a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zM3 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 1a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zM10 3a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V3zm2 1a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM10 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm3 1a1 1 0 10-2 0v1a1 1 0 102 0v-1z" clipRule="evenodd" /></svg>
                    Calificar con QR
                </button>
                {students.length > 0 && (
                    <button onClick={onShowAllQRsClick} className="w-full inline-flex items-center justify-center px-4 py-2 text-sm bg-blue-500 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
                        Ver todos los QR
                    </button>
                )}
            </div>
            <ul className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-2 -mr-4">
                {students.map(student => (
                    <li key={student.id} onClick={() => onStudentClick(student)} className="p-2.5 flex justify-between items-center rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <span className="font-medium text-gray-800 text-sm">{student.name}</span>
                        </div>
                        {studentsWithPendingAssignments.has(student.id) && (
                            <div title="Tiene actividades pendientes de calificar" className="flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.242-1.21 2.878 0l5.394 10.273c.636 1.21-.242 2.628-1.439 2.628H4.302c-1.197 0-2.075-1.418-1.439-2.628L8.257 3.099zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default StudentsPanel;
