
import React from 'react';
import ComicPanel from './ComicPanel';
import { ComicPanelData } from '../types';

interface GenerationStepProps {
    status: string;
    details: string;
    progress?: { current: number, total: number };
    panels?: ComicPanelData[];
}

const GenerationStep: React.FC<GenerationStepProps> = ({ status, details, progress, panels }) => {
    const percentage = progress && progress.total > 0 
        ? Math.round((progress.current / progress.total) * 100) 
        : 0;

    return (
        <div className="flex flex-col items-center justify-center text-center">
            {(!panels || panels.length === 0) && (
                 <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-indigo-500 mb-8"></div>
            )}
            <h2 className="text-4xl font-bold text-indigo-400 mb-2 font-comic">{status}</h2>
            <p className="text-lg text-slate-300 max-w-2xl mb-6">{details}</p>
            {progress && progress.total > 0 && (
                <div className="w-full max-w-2xl mb-8">
                    <div className="bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div 
                            className="bg-indigo-500 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-slate-300 mt-2">{`Generated ${progress.current} of ${progress.total} panels`}</p>
                </div>
            )}

            {panels && panels.length > 0 && (
                <div className="w-full max-w-7xl mx-auto bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                    <h3 className="text-xl font-bold font-comic mb-4 text-left text-indigo-300">Live Generation</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {panels.map(panel => (
                           <div key={panel.panel_number} className="aspect-[4/3] bg-slate-700 rounded-sm overflow-hidden">
                                <ComicPanel panel={panel} />
                           </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GenerationStep;
