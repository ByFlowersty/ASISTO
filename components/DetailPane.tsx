import React from 'react';

interface Props {
  title: string;
  active: boolean;
  onBack: () => void;
  children: React.ReactNode;
}

const DetailPane: React.FC<Props> = ({ title, active, onBack, children }) => {
  return (
    <div className={`fixed top-0 right-0 h-full w-full z-40 transition-transform duration-500 ease-in-out transform ${active ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="min-h-screen text-gray-800 p-4 md:p-6 lg:p-8 bg-gray-50">
        <div className="w-full mx-auto flex flex-col rounded-3xl shadow-2xl overflow-hidden bg-white/60 backdrop-blur-xl border border-white/20 h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)]">
            <div className="flex-shrink-0 p-6 md:p-10 pb-6 border-b">
                 <button onClick={onBack} className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-800 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                     Volver al Panel
                </button>
                <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
            </div>
            <div className="overflow-y-auto flex-grow p-6 md:p-10">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPane;
