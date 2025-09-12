import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Student } from '../types';

interface Props {
    students: Student[];
    subjectName: string;
    onClose: () => void;
}

const AllStudentsQRModal: React.FC<Props> = ({ students, subjectName, onClose }) => {
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 print:p-0 print:bg-white">
            <div className="bg-white p-6 rounded-2xl shadow-2xl relative max-w-6xl w-full h-[90vh] flex flex-col print:shadow-none print:h-auto print:max-w-none">
                {/* --- Modal Header --- */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b print:hidden">
                    <div>
                        <h3 className="text-xl font-bold">Códigos QR para {subjectName}</h3>
                        <p className="text-sm text-gray-500">Usa el botón de imprimir para generar un PDF o enviar a tu impresora.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrint} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                            </svg>
                            Imprimir
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                {/* --- QR Code Grid --- */}
                <div id="qr-print-area" className="flex-grow overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4">
                        {students.sort((a, b) => a.name.localeCompare(b.name)).map(student => (
                            <div key={student.id} className="flex flex-col items-center justify-center p-4 border rounded-lg text-center break-inside-avoid">
                                <QRCodeSVG value={student.name} size={128} className="mb-2" />
                                <p className="font-semibold text-gray-800 text-sm">{student.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllStudentsQRModal;
