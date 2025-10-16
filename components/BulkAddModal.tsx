import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import type { PlannedClass, Subject } from '../types';

interface Props {
    subject: Subject;
    onClose: () => void;
    onSave: () => void;
}

const BulkAddModal: React.FC<Props> = ({ subject, onClose, onSave }) => {
    const [syllabusText, setSyllabusText] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const placeholderText = `Ejemplo para un temario de C++ (Columnas: Tema, Subtema, Descripción):
UNIDAD 1: INTRODUCCIÓN\tConfiguración del Entorno\tTeoría: Instalación de un compilador de C++ (como g++) y un editor de código (como VS Code).
UNIDAD 1: INTRODUCCIÓN\tMi Primer Programa "Hola, Mundo"\tPráctica: Escribir, compilar y ejecutar el programa "Hola, Mundo" para verificar el entorno.
UNIDAD 1: INTRODUCCIÓN\tEstructura y Sintaxis Básica\tTeoría: Anatomía de un programa en C++: #include, using namespace, función main(), comentarios y punto y coma.
UNIDAD 2: FUNDAMENTOS\tVariables y Tipos de Datos Primitivos\tTeoría: int, float, double, char, bool. Declaración e inicialización de variables.
UNIDAD 2: FUNDAMENTOS\tUso de Variables\tPráctica: Escribir un programa que declare variables de diferentes tipos, les asigne valores y los imprima.
UNIDAD 2: FUNDAMENTOS\tOperadores Aritméticos y de Asignación\tTeoría: +, -, *, /, %, ++, --, =, +=, -=, etc. Precedencia de operadores.
UNIDAD 2: FUNDAMENTOS\tCalculadora Básica\tPráctica: Crear un programa que realice operaciones aritméticas básicas con valores fijos y muestre los resultados.
UNIDAD 2: FUNDAMENTOS\tEntrada y Salida (cin/cout)\tTeoría: Uso de la librería iostream para interactuar con el usuario.
UNIDAD 2: FUNDAMENTOS\tEntrada de Usuario\tPráctica: Modificar la calculadora para que pida dos números al usuario antes de realizar las operaciones.
UNIDAD 3: CONTROL DE FLUJO\tEstructuras Condicionales: if-else\tTeoría: Cómo tomar decisiones en el código. anidamiento de if-else.
UNIDAD 3: CONTROL DE FLUJO\tProblemas con if-else\tPráctica: Escribir programas como: verificar si un número es par o impar, o determinar si alguien es mayor de edad.
UNIDAD 3: CONTROL DE FLUJO\tEstructuras Condicionales: switch\tTeoría: Alternativa a if-else para múltiples condiciones basadas en un solo valor.
UNIDAD 3: CONTROL DE FLUJO\tMenú de Opciones\tPráctica: Crear un menú simple usando switch donde el usuario elija una opción (ej. 1. Sumar, 2. Restar).
UNIDAD 3: CONTROL DE FLUJO\tBucles: for\tTeoría: Sintaxis y uso de bucles 'for' para iterar un número conocido de veces.`;

    const handleSave = async () => {
        setError('');
        if (!syllabusText.trim() || !startDate) {
            setError("Por favor, introduce el temario y selecciona una fecha de inicio.");
            return;
        }

        setIsSaving(true);
        
        if (!subject.schedule || subject.schedule.length === 0) {
            setError("Por favor, define un horario para la materia antes de añadir un temario.");
            setIsSaving(false);
            return;
        }
        
        const lines = syllabusText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length > 0 && (lines[0].toLowerCase().includes('tema') || lines[0].toLowerCase().includes('subtema'))) {
            lines.shift();
        }

        const parsedTopics = lines.map(line => {
            const parts = line.split('\t');
            if (parts.length < 2) return null;

            const tema = parts[0].trim();
            const subtema = parts[1].trim();
            const descripcion = (parts[2] || '').trim();
            
            const title = tema ? `${tema}: ${subtema}` : subtema;

            return {
                title,
                description: descripcion || null,
            };
        }).filter((topic): topic is { title: string; description: string | null } => topic !== null && topic.title !== '');


        if (parsedTopics.length === 0) {
            setError("No se encontraron temas válidos. Asegúrate de usar el formato correcto (columnas separadas por tabulación: Tema, Subtema, Descripción).");
            setIsSaving(false);
            return;
        }

        const scheduleDays = subject.schedule.map(s => s.day).sort();
        let currentDate = new Date(startDate + 'T12:00:00Z');
        const classesToInsert: Omit<PlannedClass, 'id' | 'created_at'>[] = [];

        for (const topic of parsedTopics) {
            while (true) {
                const dayOfWeek = currentDate.getUTCDay() === 0 ? 7 : currentDate.getUTCDay();
                if (scheduleDays.includes(dayOfWeek)) break;
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
            
            classesToInsert.push({
                subject_id: subject.id,
                class_date: currentDate.toISOString().split('T')[0],
                title: topic.title,
                description: topic.description,
                status: 'planned'
            });
            
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        const { error: insertError } = await supabase.from('planned_classes').insert(classesToInsert);

        setIsSaving(false);

        if (insertError) {
            setError('Error al guardar el temario: ' + insertError.message);
        } else {
            onSave();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl relative max-w-lg w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 className="text-xl font-bold mb-1">Añadir Temario en Bloque</h3>
                <p className="text-md text-gray-600 mb-4">Pega el temario desde una hoja de cálculo (columnas: Tema, Subtema, Descripción).</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio del temario</label>
                        <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm bg-white/80" />
                    </div>
                    <div>
                        <label htmlFor="syllabus-text" className="block text-sm font-medium text-gray-700 mb-1">Temario (un tema por línea)</label>
                        <textarea
                            id="syllabus-text"
                            value={syllabusText}
                            onChange={e => setSyllabusText(e.target.value)}
                            className="w-full h-48 p-2 border border-gray-300 rounded-lg resize-none bg-white/80"
                            placeholder={placeholderText}
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-300">
                        {isSaving ? 'Guardando...' : 'Guardar Temario'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkAddModal;
