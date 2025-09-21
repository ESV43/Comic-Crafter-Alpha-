import React, { useState, useEffect } from 'react';
import { ComicPanelData } from '../types';

interface EditPanelModalProps {
    panel: ComicPanelData;
    onClose: () => void;
    onUpdate: (updatedPanel: ComicPanelData) => void;
    onRegenerate: (panelToRegen: ComicPanelData) => void;
    error: string | null;
    clearError: () => void;
}

const panelShapes = [
    { id: 'NORMAL', name: 'Normal' },
    { id: 'WIDE', name: 'Wide' },
    { id: 'TALL', name: 'Tall' },
    { id: 'FULL_PAGE', name: 'Full Page' },
];


const EditPanelModal: React.FC<EditPanelModalProps> = ({ panel, onClose, onUpdate, onRegenerate, error, clearError }) => {
    const [localPanel, setLocalPanel] = useState<ComicPanelData>(panel);
    const [isRegenerating, setIsRegenerating] = useState(false);

    useEffect(() => {
        setLocalPanel(panel);
        setIsRegenerating(panel.imageUrl === 'loading');
        // If there's an error on modal open, clear it after a delay
        if(error) {
            setTimeout(clearError, 5000);
        }
    }, [panel, error, clearError]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalPanel(prev => ({ ...prev, [name]: value }));
    };
    
    const handleShapeChange = (shape: ComicPanelData['panel_emphasis']) => {
        setLocalPanel(prev => ({ ...prev, panel_emphasis: shape }));
    };

    const handleSaveChanges = () => {
        onUpdate(localPanel);
    };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        clearError();
        await onRegenerate(localPanel);
        setIsRegenerating(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-indigo-400 font-comic">Edit Panel #{panel.panel_number}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left side: Image */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold mb-2">Panel Image</h3>
                         <div className="aspect-[4/3] bg-slate-700 rounded-md overflow-hidden relative">
                            {isRegenerating ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-400"></div>
                                    <p className="absolute bottom-4 text-slate-300 text-sm">Regenerating...</p>
                                </div>
                            ) : (
                                <img src={panel.imageUrl} alt={`Panel ${panel.panel_number}`} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="mt-4 w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                            {isRegenerating ? 'Working...' : 'Regenerate Image'}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                               <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 8a1 1 0 011 1v3.101a7.002 7.002 0 01-11.601-2.566 1 1 0 111.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1z" clipRule="evenodd" />
                            </svg>
                        </button>
                         <p className="text-xs text-slate-500 mt-1 text-center">Regenerates the image based on the current action text.</p>
                    </div>

                    {/* Right side: Text fields */}
                    <div className="flex flex-col space-y-4">
                        <div>
                            <label htmlFor="action" className="block text-sm font-medium text-slate-300 mb-1">Action</label>
                            <textarea id="action" name="action" value={localPanel.action} onChange={handleInputChange} rows={3} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                         <div>
                            <label htmlFor="dialogue" className="block text-sm font-medium text-slate-300 mb-1">Dialogue</label>
                            <textarea id="dialogue" name="dialogue" value={localPanel.dialogue} onChange={handleInputChange} rows={2} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label htmlFor="internal_monologue" className="block text-sm font-medium text-slate-300 mb-1">Internal Monologue / Thoughts</label>
                            <textarea id="internal_monologue" name="internal_monologue" value={localPanel.internal_monologue} onChange={handleInputChange} rows={2} className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Panel Layout</label>
                            <div className="grid grid-cols-2 gap-2">
                                {panelShapes.map(shape => (
                                    <button
                                        key={shape.id}
                                        type="button"
                                        onClick={() => handleShapeChange(shape.id as ComicPanelData['panel_emphasis'])}
                                        className={`p-3 rounded-md border-2 text-sm transition text-center ${localPanel.panel_emphasis === shape.id ? 'border-indigo-500 bg-indigo-900/50 text-white' : 'border-slate-600 bg-slate-700 hover:border-indigo-600 text-slate-300'}`}
                                    >
                                        {shape.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {error && <div className="px-6 pb-2"><div className="bg-red-900 border border-red-500 text-red-200 px-4 py-2 rounded-lg text-sm" role="alert">{error}</div></div>}

                <footer className="p-4 border-t border-slate-700 flex justify-end space-x-4">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                    <button onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">Save Changes</button>
                </footer>
            </div>
        </div>
    );
};

export default EditPanelModal;