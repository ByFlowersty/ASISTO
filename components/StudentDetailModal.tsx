import React, { useMemo, useState } from 'react';
// Fix: The default import for 'qrcode.react' can cause type errors. Importing the specific QRCodeSVG component is more robust.
import { QRCodeSVG } from 'qrcode.react';
import type { Student, EvaluationCriterion, Assignment, Grade, AttendanceRecord, Participation } from '../types';

interface Props {
    student: Student;
    subjectName: string;
    criteria: EvaluationCriterion[];
    assignments: Assignment[];
    grades: Grade[];
    allAttendance: AttendanceRecord[];
    participations: Participation[];
    scheduledSessionDates: string[];
    onClose: () => void;
}

const AttendanceDetailView: React.FC<{ attendedDates: string[], missedDates: string[], onClose: () => void }> = ({ attendedDates, missedDates, onClose }) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString + 'T12:00:00Z').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold mb-4">Detalle de Asistencia</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
                    <div>
                        <h4 className="font-semibold text-green-600 mb-2">Asistencias ({attendedDates.length})</h4>
                        <ul className="divide-y divide-gray-200">
                            {attendedDates.sort((a,b) => a.localeCompare(b)).map(date => <li key={date} className="py-2 text-sm">{formatDate(date)}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-600 mb-2">Faltas ({missedDates.length})</h4>
                        <ul className="divide-y divide-gray-200">
                            {missedDates.sort((a,b) => a.localeCompare(b)).map(date => <li key={date} className="py-2 text-sm">{formatDate(date)}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};


const StudentDetailModal: React.FC<Props> = ({ student, subjectName, criteria, assignments, grades, allAttendance, participations, scheduledSessionDates, onClose }) => {
    const [showAttendanceDetailModal, setShowAttendanceDetailModal] = useState(false);

    const { attendedDates, missedDates } = useMemo(() => {
        const studentAttendance = new Set(
            allAttendance
                .filter(rec => rec.student_id === student.id)
                .map(rec => new Date(rec.created_at).toISOString().split('T')[0])
        );

        const attended = scheduledSessionDates.filter(d => studentAttendance.has(d));
        const missed = scheduledSessionDates.filter(d => !studentAttendance.has(d));
        
        return { attendedDates: attended, missedDates: missed };
    }, [allAttendance, student.id, scheduledSessionDates]);


    const gradeSummary = useMemo(() => {
        let totalWeightedScore = 0;
        
        const criteriaWithDetails = criteria.map(criterion => {
            let criterionAverage: number | null = null;
            let assignmentGrades: { assignmentName: string; score: number | null }[] = [];

            if (criterion.type === 'attendance') {
                const studentAttendanceCount = attendedDates.length;
                criterionAverage = scheduledSessionDates.length > 0 ? (studentAttendanceCount / scheduledSessionDates.length) * 10 : 0;
                assignmentGrades.push({ assignmentName: 'Cálculo automático por asistencia', score: criterionAverage });
            } else if (criterion.type === 'participation') {
                const totalPoints = participations.reduce((sum, p) => sum + p.points, 0);
                const maxPoints = criterion.max_points || 1; // Avoid division by zero
                criterionAverage = Math.min((totalPoints / maxPoints) * 10, 10); // Cap at 10
                assignmentGrades.push({ assignmentName: `Puntos acumulados: ${totalPoints.toFixed(1)} / ${maxPoints}`, score: criterionAverage });
            } else { // Default type
                const relevantAssignments = assignments.filter(a => a.evaluation_criterion_id === criterion.id);
                assignmentGrades = relevantAssignments.map(a => {
                    const grade = grades.find(g => g.assignment_id === a.id);
                    return {
                        assignmentName: a.name,
                        score: grade ? grade.score : null
                    };
                });

                const totalAssignmentsForCriterion = relevantAssignments.length;
                if (totalAssignmentsForCriterion > 0) {
                    const sumOfScores = assignmentGrades.reduce((sum, currentGrade) => sum + (currentGrade.score ?? 0), 0);
                    criterionAverage = sumOfScores / totalAssignmentsForCriterion;
                } else {
                    criterionAverage = null; 
                }
            }
            
            if (criterionAverage !== null) {
                totalWeightedScore += (criterionAverage / 10) * criterion.percentage;
            }

            return {
                criterionName: criterion.name,
                percentage: criterion.percentage,
                average: criterionAverage,
                assignments: assignmentGrades,
                criterionType: criterion.type,
            };
        });

        return {
            details: criteriaWithDetails,
            finalGrade: totalWeightedScore
        };
    }, [criteria, assignments, grades, participations, student.id, scheduledSessionDates, attendedDates]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            {showAttendanceDetailModal && (
                <AttendanceDetailView 
                    attendedDates={attendedDates}
                    missedDates={missedDates}
                    onClose={() => setShowAttendanceDetailModal(false)}
                />
            )}
            <div className="bg-white p-6 rounded-2xl shadow-2xl relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl font-bold mb-1">{student.name}</h3>
                <p className="text-md text-gray-600 mb-4">Reporte de Calificaciones - {subjectName}</p>
                
                <div className="grid md:grid-cols-3 gap-6 max-h-[70vh]">
                    <div className="md:col-span-2 overflow-y-auto pr-2">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Criterio (%)</th>
                                    <th scope="col" className="px-6 py-3">Actividad</th>
                                    <th scope="col" className="px-6 py-3 text-center">Calificación (0-10)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gradeSummary.details.map((detail, index) => (
                                    <React.Fragment key={index}>
                                        {detail.assignments.length > 0 ? detail.assignments.map((ag, agIndex) => {
                                            const contribution = ((ag.score ?? 0) / 10) * (detail.percentage / detail.assignments.length);

                                            return (
                                                <tr key={`${index}-${agIndex}`} className="bg-white border-b hover:bg-gray-50">
                                                    {agIndex === 0 && (
                                                        <td rowSpan={detail.assignments.length} className="px-6 py-4 font-medium text-gray-900 border-r align-top">
                                                        {detail.criterionName} ({detail.percentage}%)
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4">
                                                        {ag.assignmentName}
                                                        {detail.criterionType === 'attendance' && (
                                                            <button onClick={() => setShowAttendanceDetailModal(true)} className="ml-2 text-xs font-semibold text-blue-600 hover:underline">(Ver detalle)</button>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="font-bold text-lg text-gray-800">
                                                            {ag.score !== null ? ag.score.toFixed(1) : '-'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 font-medium">
                                                            Aporta <span className="font-bold text-primary-600">{contribution.toFixed(2)}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr className="bg-white border-b">
                                                <td className="px-6 py-4 font-medium text-gray-900 border-r">{detail.criterionName} ({detail.percentage}%)</td>
                                                <td colSpan={2} className="px-6 py-4 text-gray-400 italic">No hay actividades para este criterio.</td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="md:col-span-1 flex flex-col items-center justify-start bg-gray-50 p-6 rounded-lg space-y-4">
                        <div className="text-center">
                            <h4 className="text-lg font-bold text-gray-800">Calificación Final</h4>
                            <p className="text-5xl font-bold text-primary-700">{gradeSummary.finalGrade.toFixed(2)}</p>
                        </div>
                        <div className="text-center pt-4">
                            <h4 className="text-lg font-bold text-gray-800 mb-2">Código QR del Estudiante</h4>
                            <div className="bg-white p-4 rounded-lg shadow-md inline-block">
                                {/* Fix: Use the imported QRCodeSVG component to resolve JSX type errors. */}
                                <QRCodeSVG value={student.name} size={192} />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Usa este QR para registrar asistencia o calificaciones.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StudentDetailModal;
