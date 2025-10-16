import React, { useMemo, useState } from 'react';
// Fix: The default import for 'qrcode.react' can cause type errors. Importing the specific QRCodeSVG component is more robust.
import { QRCodeSVG } from 'qrcode.react';
import type { Student, EvaluationCriterion, Assignment, Grade, AttendanceRecord, Participation, Subject } from '../types';

interface Props {
    student: Student;
    subject: Subject;
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
            <div className="bg-white/80 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
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

const StudentDetailModal: React.FC<Props> = ({ student, subject, criteria, assignments, grades, allAttendance, participations, scheduledSessionDates, onClose }) => {
    const [showAttendanceDetailModal, setShowAttendanceDetailModal] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('final');

    const dynamicGradingPeriods = useMemo(() => {
        const dates = subject.grading_periods_dates || {};
        const semesterStart = dates['1'] || '2025-09-01';

        // Calculate semester end date (approx. 18 weeks after start)
        const semesterStartDate = new Date(semesterStart + 'T12:00:00Z');
        const semesterEndDate = new Date(semesterStartDate);
        semesterEndDate.setUTCDate(semesterEndDate.getUTCDate() + (18 * 7));
        const semesterEndStr = semesterEndDate.toISOString().split('T')[0];

        const periods: { [key: string]: { name: string; start: string; end: string } } = {
            'final': { name: 'Final', start: semesterStart, end: semesterEndStr }
        };

        const getEndDate = (nextStartDateStr: string | undefined) => {
            if (!nextStartDateStr) return semesterEndStr;
            const nextStartDate = new Date(nextStartDateStr + 'T12:00:00Z');
            nextStartDate.setUTCDate(nextStartDate.getUTCDate() - 1);
            return nextStartDate.toISOString().split('T')[0];
        };
        
        if (dates['1']) periods['1'] = { name: '1er Parcial', start: dates['1'], end: getEndDate(dates['2']) };
        if (dates['2']) periods['2'] = { name: '2do Parcial', start: dates['2'], end: getEndDate(dates['3']) };
        if (dates['3']) periods['3'] = { name: '3er Parcial', start: dates['3'], end: getEndDate(dates['4']) };
        if (dates['4']) periods['4'] = { name: '4o Parcial', start: dates['4'], end: semesterEndStr };

        return periods;
    }, [subject.grading_periods_dates]);

    const availablePeriods = useMemo(() => {
        const periodEntries = Object.entries(dynamicGradingPeriods);
        // Sort them: final, 1, 2, 3, 4
        periodEntries.sort(([keyA], [keyB]) => {
            if (keyA === 'final') return -1;
            if (keyB === 'final') return 1;
            return parseInt(keyA) - parseInt(keyB);
        });
        return periodEntries;
    }, [dynamicGradingPeriods]);

    const filteredScheduledDates = useMemo(() => {
        const period = dynamicGradingPeriods[selectedPeriod];
        if (!period) return scheduledSessionDates;

        const startDate = new Date(period.start + 'T00:00:00Z').getTime();
        const endDate = new Date(period.end + 'T23:59:59Z').getTime();

        return scheduledSessionDates.filter(dateString => {
            const d = new Date(dateString + 'T12:00:00Z').getTime();
            return d >= startDate && d <= endDate;
        });
    }, [scheduledSessionDates, selectedPeriod, dynamicGradingPeriods]);

    const { attendedDates, missedDates } = useMemo(() => {
        const studentAttendance = new Set(
            allAttendance
                .filter(rec => rec.student_id === student.id)
                .map(rec => new Date(rec.created_at).toISOString().split('T')[0])
        );

        const attended = filteredScheduledDates.filter(d => studentAttendance.has(d));
        const missed = filteredScheduledDates.filter(d => !studentAttendance.has(d));
        
        return { attendedDates: attended, missedDates: missed };
    }, [allAttendance, student.id, filteredScheduledDates]);


    const gradeSummary = useMemo(() => {
        const period = dynamicGradingPeriods[selectedPeriod];
        if (!period) {
            return { details: [], finalGrade: 0 };
        }
        const startDate = new Date(period.start + 'T00:00:00Z').getTime();
        const endDate = new Date(period.end + 'T23:59:59Z').getTime();

        const periodCriteria = selectedPeriod === 'final'
            ? criteria
            : criteria.filter(c => (c.grading_period || 1) === parseInt(selectedPeriod, 10));

        const totalDefinedPercentage = periodCriteria.reduce((sum, crit) => sum + crit.percentage, 0);
        let totalWeightedScoreContribution = 0;

        const criteriaWithDetails = periodCriteria.map(criterion => {
            let criterionAverage: number | null = null;
            let assignmentGrades: { assignmentName: string; score: number | null }[] = [];
            let hasContentInPeriod = false;

            if (criterion.type === 'attendance') {
                if (filteredScheduledDates.length > 0) {
                    const studentAttendanceCount = attendedDates.length;
                    criterionAverage = (studentAttendanceCount / filteredScheduledDates.length) * 10;
                    assignmentGrades.push({ assignmentName: 'Cálculo automático por asistencia', score: criterionAverage });
                    hasContentInPeriod = true;
                }
            } else if (criterion.type === 'participation') {
                const periodParticipations = participations.filter(p => {
                    const pDate = new Date(p.date + 'T12:00:00Z').getTime();
                    return pDate >= startDate && pDate <= endDate;
                });

                if (periodParticipations.length > 0 || (selectedPeriod !== 'final' && criterion.max_points) || selectedPeriod === 'final') {
                    hasContentInPeriod = true;
                    const totalPoints = periodParticipations.reduce((sum, p) => sum + p.points, 0);
                    const maxPoints = criterion.max_points || 1;
                    criterionAverage = Math.min((totalPoints / maxPoints) * 10, 10);
                    assignmentGrades.push({ assignmentName: `Puntos acumulados: ${totalPoints.toFixed(1)} / ${maxPoints}`, score: criterionAverage });
                }
            } else { // Default type
                const relevantAssignments = assignments.filter(a => a.evaluation_criterion_id === criterion.id);
                const periodAssignments = relevantAssignments.filter(a => {
                    const aDate = new Date(a.created_at).getTime();
                    return aDate >= startDate && aDate <= endDate;
                });

                if (periodAssignments.length > 0) {
                    hasContentInPeriod = true;
                    assignmentGrades = periodAssignments.map(a => {
                        const grade = grades.find(g => g.assignment_id === a.id);
                        return {
                            assignmentName: a.name,
                            score: grade ? grade.score : null
                        };
                    });

                    const gradedAssignments = assignmentGrades.filter(ag => ag.score !== null);
                    if (gradedAssignments.length > 0) {
                        const sumOfScores = gradedAssignments.reduce((sum, currentGrade) => sum + (currentGrade.score!), 0);
                        criterionAverage = sumOfScores / gradedAssignments.length;
                    } else {
                        criterionAverage = null; // No assignments graded yet
                    }
                }
            }

            if (criterionAverage !== null) {
                totalWeightedScoreContribution += (criterionAverage / 10) * criterion.percentage;
            }

            return {
                criterionName: criterion.name,
                percentage: criterion.percentage,
                average: criterionAverage,
                assignments: assignmentGrades,
                criterionType: criterion.type,
                hasContent: hasContentInPeriod
            };
        });

        const finalScoreOutOf100 = totalDefinedPercentage > 0
            ? (totalWeightedScoreContribution / totalDefinedPercentage) * 100
            : 0;
            
        return {
            details: criteriaWithDetails,
            finalGrade: finalScoreOutOf100 / 10,
        };
    }, [criteria, assignments, grades, participations, student.id, filteredScheduledDates, attendedDates, selectedPeriod, dynamicGradingPeriods]);


    const periodName = dynamicGradingPeriods[selectedPeriod]?.name || 'Final';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            {showAttendanceDetailModal && (
                <AttendanceDetailView 
                    attendedDates={attendedDates}
                    missedDates={missedDates}
                    onClose={() => setShowAttendanceDetailModal(false)}
                />
            )}
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl relative max-w-4xl w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div className="flex-shrink-0">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                        <div>
                            <h3 className="text-xl font-bold mb-1">{student.name}</h3>
                            <p className="text-md text-gray-600">Reporte de Calificaciones - {subject.name}</p>
                        </div>
                         <div>
                            <label htmlFor="period-select" className="sr-only">Seleccionar Periodo</label>
                            <select
                                id="period-select"
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="text-sm border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white/80"
                            >
                                {availablePeriods.map(([key, { name }]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 flex-grow overflow-hidden">
                    <div className="md:col-span-2 overflow-y-auto pr-2">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-black/5 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Criterio (%)</th>
                                    <th scope="col" className="px-6 py-3">Actividad</th>
                                    <th scope="col" className="px-6 py-3 text-center">Calificación (0-10)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gradeSummary.details.map((detail, index) => (
                                    <React.Fragment key={index}>
                                        {detail.hasContent ? detail.assignments.map((ag, agIndex) => (
                                            <tr key={`${index}-${agIndex}`} className="bg-transparent border-b border-black/10 hover:bg-black/5">
                                                {agIndex === 0 && (
                                                    <td rowSpan={detail.assignments.length} className="px-6 py-4 font-medium text-gray-900 border-r border-black/10 align-top">
                                                        {detail.criterionName} ({detail.percentage}%)
                                                        <div className="text-xs text-primary-600 font-bold mt-1">
                                                            Promedio: {detail.average !== null ? detail.average.toFixed(1) : '-'}
                                                        </div>
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
                                                        {ag.score !== null ? ag.score.toFixed(1) : <span className="text-gray-400">N/C</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                             <tr className="bg-transparent border-b border-black/10 hover:bg-black/5">
                                                <td className="px-6 py-4 font-medium text-gray-900 border-r border-black/10">{detail.criterionName} ({detail.percentage}%)</td>
                                                <td colSpan={2} className="px-6 py-4 text-gray-400 italic">No hay actividades evaluadas en este periodo.</td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="md:col-span-1 flex flex-col items-center justify-start bg-black/5 p-6 rounded-lg space-y-4 overflow-y-auto">
                        <div className="text-center">
                            <h4 className="text-lg font-bold text-gray-800">Calificación {periodName}</h4>
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
