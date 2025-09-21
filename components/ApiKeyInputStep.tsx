
import React, { useState } from 'react';

interface ApiKeyInputStepProps {
    onSubmit: (apiKey: string) => void;
}

const ApiKeyInputStep: React.FC<ApiKeyInputStepProps> = ({ onSubmit }) => {
    const [apiKey, setApiKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey.trim()) {
            onSubmit(apiKey.trim());
        }
    };

    return (
        <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
            <h2 className="text-4xl font-bold text-indigo-400 mb-2 font-comic">Enter Your API Key</h2>
            <p className="text-lg text-slate-300 mb-6">
                To use ComicCrafter AI, please provide your Google Gemini API key.
            </p>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 w-full mb-8 text-left text-sm">
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
                    Your key is stored only in your browser for this session and is not shared with anyone.
                </p>
            </div>
            <form onSubmit={handleSubmit} className="w-full">
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key here"
                    className="w-full p-3 bg-slate-800 border-2 border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300"
                    aria-label="Gemini API Key"
                />
                <button
                    type="submit"
                    disabled={!apiKey.trim()}
                    className="mt-6 w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
                >
                    <span>Save Key & Start Crafting</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default ApiKeyInputStep;
