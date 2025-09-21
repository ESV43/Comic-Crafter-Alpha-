import React, { useState } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
    currentApiKey: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentApiKey }) => {
    const [apiKey, setApiKey] = useState(currentApiKey);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(apiKey);
    };
    
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={handleOverlayClick}>
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-indigo-400 font-comic">Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <div className="p-6">
                    <label htmlFor="apiKeyInput" className="block text-sm font-medium text-slate-300 mb-2">Your Google Gemini API Key</label>
                    <input
                        id="apiKeyInput"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your personal API Key"
                        className="w-full p-3 bg-slate-900 border-2 border-slate-600 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 mt-4 text-left text-sm">
                        <p className="text-slate-300">
                            You can get your free API key from{' '}
                            <a
                                href="https://ai.google.dev/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:underline font-semibold"
                            >
                                Google AI Studio
                            </a>.
                        </p>
                        <p className="text-slate-400 mt-2">
                            Your key is stored locally in your browser. If you clear this field, the app will revert to using the developer's key.
                        </p>
                    </div>
                </div>
                <footer className="p-4 border-t border-slate-700 flex justify-end space-x-4">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-lg transition">Cancel</button>
                    <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">Save</button>
                </footer>
            </div>
        </div>
    );
};

export default SettingsModal;
