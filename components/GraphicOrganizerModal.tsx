
import React from 'react';
import type { PlannedClass } from '../types';

interface Props {
    cls: PlannedClass;
    isLoading: boolean;
    data: { content: any; sources: any[] } | null;
    onClose: () => void;
}

const LoadingSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded-md w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded-md w-full mb-6"></div>
        <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded-md w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded-md w-5/6 ml-4"></div>
            <div className="h-4 bg-gray-200 rounded-md w-4/6 ml-4"></div>
        </div>
         <div className="space-y-4 mt-6">
            <div className="h-6 bg-gray-200 rounded-md w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded-md w-5/6 ml-4"></div>
        </div>
    </div>
);

const GraphicOrganizerModal: React.FC<Props> = ({ cls, isLoading, data, onClose }) => {

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSkeleton />;
        }

        if (!data || !data.content) {
            return <p className="text-center text-gray-500">No se ha generado contenido.</p>;
        }
        
        if (data.content.error) {
             return (
                <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-2">Error al generar</h4>
                    <p className="text-sm">{data.content.error}</p>
                </div>
            );
        }

        const { tema_principal, subtemas } = data.content;

        return (
            <div>
                {tema_principal && (
                    <div className="mb-6 pb-4 border-b border-black/10">
                        <h3 className="text-2xl font-bold text-primary-800">{tema_principal.nombre || cls.title}</h3>
                        {tema_principal.definicion && <p className="mt-2 text-gray-600">{tema_principal.definicion}</p>}
                    </div>
                )}
                
                <div className="space-y-6">
                    {subtemas && Array.isArray(subtemas) ? subtemas.map((subtema, index) => (
                        <div key={index} className="p-4 bg-primary-500/10 rounded-lg">
                            <h4 className="font-bold text-lg text-primary-700">{subtema.nombre}</h4>
                            {subtema.puntos_clave && Array.isArray(subtema.puntos_clave) && (
                                <ul className="mt-2 list-disc list-inside space-y-1 text-gray-700 pl-2">
                                    {subtema.puntos_clave.map((punto: string, pIndex: number) => (
                                        <li key={pIndex}>{punto}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )) : <p className="text-gray-500">La estructura del contenido no es la esperada.</p>}
                </div>
            </div>
        );
    };

    const renderSources = () => {
        if (isLoading || !data || !data.sources || data.sources.length === 0) {
            return null;
        }

        const validSources = data.sources.filter(s => s.web && s.web.uri);

        return (
            <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Fuentes:</h4>
                <ul className="space-y-1 text-xs list-decimal list-inside">
                    {validSources.map((source, index) => (
                        <li key={index}>
                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                {source.web.title || source.web.uri}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white/70 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl relative max-w-3xl w-full flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                         <h2 className="text-xl font-bold">Organizador Gráfico</h2>
                         <p className="text-sm text-gray-500">{cls.title}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto max-h-[70vh] pr-4">
                   {renderContent()}
                   {renderSources()}
                </div>
            </div>
        </div>
    );
};

export default GraphicOrganizerModal;
