
import React from 'react';
import { ComicPanelData } from '../types';

interface ComicPanelProps {
    panel: ComicPanelData;
    onEdit?: (panel: ComicPanelData) => void;
}

const ComicPanel: React.FC<ComicPanelProps> = ({ panel, onEdit }) => {
    const hasDialogue = panel.dialogue && panel.dialogue.toLowerCase() !== 'none' && panel.dialogue.toLowerCase() !== 'n/a';
    const hasMonologue = panel.internal_monologue && panel.internal_monologue.toLowerCase() !== 'none' && panel.internal_monologue.toLowerCase() !== 'n/a';
    const hasAnyText = (hasDialogue || hasMonologue) && panel.textRenderingMode === 'overlay';
    const isNarration = hasDialogue && panel.dialogue.toLowerCase().startsWith('narrator:');
    const isLoading = panel.imageUrl === 'loading';

    return (
        <div className="w-full h-full border-2 border-black bg-white overflow-hidden relative group">
            {onEdit && (
                <button
                    onClick={() => onEdit(panel)}
                    className="edit-button absolute top-2 right-2 z-20 bg-indigo-600/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                    aria-label="Edit panel"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                    </svg>
                </button>
            )}

            <div className="absolute inset-0 bg-gray-700">
                {panel.generatedBy === 'failed' || !panel.imageUrl ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-100 text-red-700 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="font-sans text-xs font-semibold text-center">Image generation failed.</p>
                    </div>
                ) : !isLoading ? (
                    <img src={panel.imageUrl} alt={`Panel ${panel.panel_number}: ${panel.action}`} className="w-full h-full object-cover" />
                ) : null}

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-400"></div>
                    </div>
                )}
            </div>

            {hasAnyText && (
                <>
                    {isNarration && (
                        <div className="absolute top-0 left-0 right-0 m-1 z-10">
                            <div className="inline-block bg-yellow-200/95 border-2 border-black p-1.5 rounded text-black shadow-md">
                                <p className="font-sans text-xs italic break-words leading-tight">{panel.dialogue.replace(/narrator:/i, '').trim()}</p>
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-1.5 space-y-1.5 flex flex-col items-start z-10">
                        {hasMonologue && (
                            <div className="bg-blue-100/95 border-2 border-dashed border-blue-400 rounded-lg p-1.5 text-black shadow-md max-w-[90%]">
                                <p className="font-sans italic text-sm text-gray-800 break-words leading-tight">{panel.internal_monologue}</p>
                            </div>
                        )}
                        {!isNarration && hasDialogue && (
                            <div className="bg-white/95 p-1.5 rounded-lg border-2 border-black font-comic text-base text-black shadow-md max-w-[90%]">
                                <p className="break-words leading-tight">{panel.dialogue}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ComicPanel;
