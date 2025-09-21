
import React, { useState, useEffect } from 'react';
import { Character, CustomizationData, VisualStyle, TextRenderingMode } from '../types';
import { VISUAL_STYLES } from '../constants';

interface CustomizationStepProps {
    characters: Character[];
    totalPanels: number;
    onSubmit: (data: CustomizationData) => void;
    error?: string | null;
}

const CharacterCard: React.FC<{
    character: Character;
    onDescriptionChange: (id: string, description: string) => void;
    onImageChange: (id: string, file: File | null) => void;
}> = ({ character, onDescriptionChange, onImageChange }) => {

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                alert("File is too large. Please upload an image under 4MB.");
                return;
            }
            onImageChange(character.id, file);
        }
        e.target.value = ''; // Reset input to allow re-uploading the same file
    };

    const handleRemoveImage = () => {
        onImageChange(character.id, null);
    };

    return (
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col h-full">
            <h4 className="text-lg font-bold text-indigo-400">{character.name}</h4>

            <div className="mt-2 flex-grow">
                <label htmlFor={`desc-${character.id}`} className="block text-sm text-slate-400 mb-1">Visual description</label>
                <textarea
                    id={`desc-${character.id}`}
                    value={character.description}
                    onChange={(e) => onDescriptionChange(character.id, e.target.value)}
                    placeholder={`e.g., A tall woman with long, flowing red hair...`}
                    className="w-full h-24 p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:ring-2 focus:ring-indigo-500 transition"
                />
            </div>

            <div className="mt-4">
                 <p className="text-sm text-slate-400 mb-1">Reference Image (Optional)</p>
                 <p className="text-xs text-slate-500 mb-2">Upload a character image for best consistency.</p>
                 {character.referenceImageUrl ? (
                    <div className="relative group">
                        <img src={character.referenceImageUrl} alt={`${character.name} reference`} className="w-full h-40 object-cover rounded-md" />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                            aria-label="Remove image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                 ) : (
                    <div className="w-full h-40 border-2 border-dashed border-slate-600 rounded-md flex items-center justify-center bg-slate-900/50 hover:border-indigo-500 transition">
                        <label className="cursor-pointer text-indigo-400 hover:text-indigo-300 p-4 text-center">
                             <span className="font-semibold">Upload Image</span>
                             <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                 )}
            </div>
        </div>
    );
};


const CustomizationStep: React.FC<CustomizationStepProps> = ({ characters, totalPanels, onSubmit, error }) => {
    const [customCharacters, setCustomCharacters] = useState<Character[]>(characters);
    const [selectedStyle, setSelectedStyle] = useState<VisualStyle>(VISUAL_STYLES[0]);
    const [textRenderingMode, setTextRenderingMode] = useState<TextRenderingMode>('overlay');
    const [forceFullPage, setForceFullPage] = useState(false);

    const MAX_PANELS = 400;

    useEffect(() => {
        setCustomCharacters(characters);
    }, [characters]);

    const handleCharacterDescriptionChange = (id: string, description: string) => {
        setCustomCharacters(prev => prev.map(c => c.id === id ? { ...c, description } : c));
    };

    const handleCharacterImageChange = (id: string, file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCustomCharacters(prev => prev.map(c => c.id === id ? { ...c, referenceImageUrl: reader.result as string } : c));
            };
            reader.readAsDataURL(file);
        } else {
            setCustomCharacters(prev => prev.map(c => c.id === id ? { ...c, referenceImageUrl: undefined } : c));
        }
    };


    const isSubmittable = customCharacters.every(c => c.description.trim().length > 10) && totalPanels > 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmittable) {
            onSubmit({
                style: selectedStyle,
                characters: customCharacters,
                textRenderingMode,
                forceFullPage,
            });
        }
    };
    
    const textOptions = [
        { id: 'overlay', title: 'HTML Overlay', description: 'Text is layered over the image in your browser. (Default)' },
        { id: 'in_image', title: 'AI-Rendered in Image', description: 'The AI draws text directly into the panel artwork.' },
        { id: 'typeset', title: 'AI Typesetting (Beta)', description: 'AI draws empty bubbles, then text is precisely added.' },
    ];


    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-indigo-400 mb-2 font-comic">Customize Your Comic</h2>
                <p className="text-lg text-slate-300">Define the look and feel of your creation.</p>
            </div>

            {error && <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full" role="alert">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-12">
                <section>
                    <h3 className="text-2xl font-bold mb-4 border-b-2 border-slate-700 pb-2">1. Select Visual Style</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {VISUAL_STYLES.map(style => (
                            <button
                                type="button"
                                key={style.id}
                                onClick={() => setSelectedStyle(style)}
                                className={`p-4 rounded-lg border-2 transition text-center ${selectedStyle.id === style.id ? 'border-indigo-500 bg-indigo-900/50' : 'border-slate-700 bg-slate-800 hover:border-indigo-600'}`}
                            >
                                {style.name}
                            </button>
                        ))}
                    </div>
                </section>

                {customCharacters.length > 0 && (
                    <section>
                        <h3 className="text-2xl font-bold mb-4 border-b-2 border-slate-700 pb-2">2. Define Characters</h3>
                        <p className="text-slate-400 mb-4 text-sm">Our AI has generated initial descriptions. Feel free to edit them and upload reference images for best results. (Min 10 chars per description).</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {customCharacters.map(char => (
                                <CharacterCard
                                    key={char.id}
                                    character={char}
                                    onDescriptionChange={handleCharacterDescriptionChange}
                                    onImageChange={handleCharacterImageChange}
                                />
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <h3 className="text-2xl font-bold mb-4 border-b-2 border-slate-700 pb-2">3. Text Rendering Options</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {textOptions.map(option => (
                             <label
                                key={option.id}
                                className={`bg-slate-800 p-4 rounded-lg border-2 cursor-pointer transition ${textRenderingMode === option.id ? 'border-indigo-500 bg-indigo-900/50' : 'border-slate-700 hover:border-indigo-600'}`}
                            >
                                <input
                                    type="radio"
                                    name="text-rendering"
                                    value={option.id}
                                    checked={textRenderingMode === option.id}
                                    onChange={() => setTextRenderingMode(option.id as TextRenderingMode)}
                                    className="sr-only"
                                />
                                <h4 className="font-semibold text-slate-200">{option.title}</h4>
                                <p className="text-sm text-slate-400 mt-1">{option.description}</p>
                            </label>
                        ))}
                    </div>
                </section>

                <section>
                     <h3 className="text-2xl font-bold mb-4 border-b-2 border-slate-700 pb-2">4. Layout Information</h3>
                     <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-600">
                            <div>
                                <h4 className="font-semibold text-slate-100">Force Full-Page Layout</h4>
                                <p className="text-sm text-slate-400">Toggle this to make every panel a full page, overriding AI decisions.</p>
                            </div>
                            <label htmlFor="force-full-page-toggle" className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={forceFullPage}
                                    onChange={() => setForceFullPage(!forceFullPage)}
                                    id="force-full-page-toggle"
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        {forceFullPage ? (
                            <p className="text-slate-300">
                                Full-page layout is enabled. Each panel will occupy its own page.
                            </p>
                        ) : (
                            <p className="text-slate-300">
                                Your comic will be generated with a <span className="font-bold text-indigo-300">dynamic layout</span>, adapting panels per page based on story moments.
                            </p>
                        )}
                        <p className="text-slate-300 mt-2">Your story has <span className="font-bold text-indigo-300">{totalPanels}</span> panels. The final page count will be determined during generation.</p>
                        {totalPanels > MAX_PANELS && (
                            <p className="text-amber-400 mt-4 text-sm font-semibold">
                                Note: Your story is very long. It will be automatically truncated to a maximum of {MAX_PANELS} panels.
                            </p>
                        )}
                     </div>
                </section>

                <div className="pt-6 border-t border-slate-700">
                     <button
                        type="submit"
                        disabled={!isSubmittable}
                        className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
                    >
                        <span>Generate Comic!</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M5 4a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2H5zm10 1H5a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V6a1 1 0 00-1-1z" />
                           <path d="M6 9a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm3 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm3 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" />
                        </svg>
                    </button>
                    {!isSubmittable && <p className="text-center text-red-400 text-sm mt-2">Please complete all character descriptions or ensure your story has panels.</p>}
                </div>
            </form>
        </div>
    );
};

export default CustomizationStep;