import React, { useState, useCallback, useEffect } from 'react';
import { AppStep, StoryboardPanel, Character, CustomizationData, ComicPage, ComicPanelData } from './types';
import Header from './components/Header';
import StoryInputStep from './components/StoryInputStep';
import CustomizationStep from './components/CustomizationStep';
import GenerationStep from './components/GenerationStep';
import ComicViewerStep from './components/ComicViewerStep';
import EditPanelModal from './components/EditPanelModal';
import SettingsModal from './components/SettingsModal';
import ApiKeyInputStep from './components/ApiKeyInputStep';
import { analyzeStory, generateCharacterDescriptions, generateComicImages, regeneratePanelImage, calculatePages } from './services/geminiService';

const App: React.FC = () => {
    const [userApiKey, setUserApiKey] = useState<string | null>(null);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    
    const [step, setStep] = useState<AppStep>(AppStep.Analyzing); // Default to a loading-like state
    const [story, setStory] = useState<string>('');
    const [storyboard, setStoryboard] = useState<StoryboardPanel[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [customizationData, setCustomizationData] = useState<CustomizationData | null>(null);
    const [comicPages, setComicPages] = useState<ComicPage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [generationProgress, setGenerationProgress] = useState<{ current: number, total: number }>({ current: 0, total: 0 });
    const [liveGeneratedPanels, setLiveGeneratedPanels] = useState<ComicPanelData[]>([]);
    const [editingPanel, setEditingPanel] = useState<ComicPanelData | null>(null);
    const [editingPanelPage, setEditingPanelPage] = useState<number | null>(null);

    useEffect(() => {
        const storedKey = localStorage.getItem('userApiKey');
        const hasDevKey = process.env.API_KEY && process.env.API_KEY.length > 0;

        if (storedKey) {
            setUserApiKey(storedKey);
            setStep(AppStep.StoryInput);
        } else if (hasDevKey) {
            setStep(AppStep.StoryInput);
        } else {
            setStep(AppStep.ApiKeyInput);
        }
    }, []);

    const handleOpenSettings = () => setIsSettingsModalOpen(true);
    const handleCloseSettings = () => setIsSettingsModalOpen(false);
    
    const handleApiKeySubmit = (key: string) => {
        const finalKey = key.trim();
        if (finalKey) {
            localStorage.setItem('userApiKey', finalKey);
            setUserApiKey(finalKey);
            setStep(AppStep.StoryInput);
        }
    };

    const handleSaveApiKey = (key: string) => {
        const finalKey = key.trim();
        const hasDevKey = process.env.API_KEY && process.env.API_KEY.length > 0;

        if (finalKey) {
            localStorage.setItem('userApiKey', finalKey);
            setUserApiKey(finalKey);
        } else {
            localStorage.removeItem('userApiKey');
            setUserApiKey(null);
            if (!hasDevKey) {
                setStep(AppStep.ApiKeyInput);
            }
        }
        setIsSettingsModalOpen(false);
    };

    const handleReset = () => {
        setStory('');
        setStoryboard([]);
        setCharacters([]);
        setComicPages([]);
        setError(null);
        setGenerationProgress({ current: 0, total: 0 });
        setLiveGeneratedPanels([]);
        setCustomizationData(null);
        setEditingPanel(null);
        setEditingPanelPage(null);
        
        const hasDevKey = process.env.API_KEY && process.env.API_KEY.length > 0;
        const storedKey = localStorage.getItem('userApiKey');
        setStep(storedKey || hasDevKey ? AppStep.StoryInput : AppStep.ApiKeyInput);
    };

    const handleStorySubmit = useCallback(async (currentStory: string) => {
        setStep(AppStep.Analyzing);
        setError(null);
        setStory(currentStory);
        try {
            const storyResult = await analyzeStory(currentStory, userApiKey);
            setStoryboard(storyResult.storyboard);

            const characterNames = new Set<string>();
            storyResult.storyboard.forEach(panel => {
                panel.characters.forEach(char => characterNames.add(char));
            });

            if (characterNames.size > 0) {
                setStep(AppStep.CharacterGen);
                const describedCharacters = await generateCharacterDescriptions(storyResult.storyboard, Array.from(characterNames), userApiKey);
                 const finalCharacters: Character[] = describedCharacters.map(char => ({
                    ...char,
                    id: char.name.toLowerCase().replace(/\s+/g, '_'),
                    referenceImageUrl: undefined
                }));
                 setCharacters(finalCharacters);
            } else {
                setCharacters([]);
            }

            setStep(AppStep.Customize);
        } catch (e: any) {
            console.error(e);
            setError(`An AI error occurred: ${e.message}. Please check your story or API key and try again.`);
            setStep(AppStep.StoryInput);
        }
    }, [userApiKey]);

    const handleCustomizationSubmit = useCallback(async (customization: CustomizationData) => {
        setCustomizationData(customization);
        setStep(AppStep.Generating);
        setError(null);
        setLiveGeneratedPanels([]);
        setGenerationProgress({ current: 0, total: storyboard.length });
        try {
            const pages = await generateComicImages(
                storyboard, 
                customization,
                (progress, newPanel) => {
                    setGenerationProgress(progress);
                    if (newPanel) {
                        setLiveGeneratedPanels(prev => [...prev, newPanel]);
                    }
                },
                userApiKey
            );
            setComicPages(pages);
            setStep(AppStep.Complete);
        } catch (e: any) {
            console.error(e);
            setError(`Failed to generate comic images: ${e.message}. The AI may be experiencing high load. Please try again.`);
            setStep(AppStep.Customize);
        }
    }, [storyboard, userApiKey]);

    const handleEditPanel = (panel: ComicPanelData, pageNumber: number) => {
        setEditingPanel(panel);
        setEditingPanelPage(pageNumber);
    };

    const handleCloseEditModal = () => {
        setEditingPanel(null);
        setEditingPanelPage(null);
    };

    const handleUpdatePanel = (updatedPanel: ComicPanelData) => {
        if (editingPanelPage === null) return;
        
        const allPanels = comicPages.flatMap(page => page.panels);
        const panelIndex = allPanels.findIndex(p => p.panel_number === updatedPanel.panel_number);

        if (panelIndex > -1) {
            const updatedPanelsList = [
                ...allPanels.slice(0, panelIndex),
                updatedPanel,
                ...allPanels.slice(panelIndex + 1)
            ];
            const newPages = calculatePages(updatedPanelsList);
            setComicPages(newPages);
        }
        setEditingPanel(updatedPanel);
    };

    const handleRegeneratePanelImage = async (panelToRegen: ComicPanelData) => {
        if (!customizationData || editingPanelPage === null) {
            console.error("Cannot regenerate image: missing context.", { customizationData, editingPanelPage });
            setError("Cannot regenerate image: context is missing. Please try again.");
            return;
        }
        const originalPanel = { ...editingPanel };
        setEditingPanel(panel => panel ? { ...panel, imageUrl: 'loading' } : null);

        try {
            const newImageBase64 = await regeneratePanelImage(panelToRegen, customizationData, userApiKey);
            const newImageUrl = `data:image/jpeg;base64,${newImageBase64}`;
            const updatedPanel = { ...panelToRegen, imageUrl: newImageUrl, generatedBy: 'gemini-2.5-flash-image-preview' };
            handleUpdatePanel(updatedPanel);
        } catch (e: any) {
            console.error(e);
            setError(`Failed to regenerate panel image: ${e.message}. Please try again.`);
            if(originalPanel) handleUpdatePanel(originalPanel as ComicPanelData);
        }
    };


    const renderStep = () => {
        switch (step) {
            case AppStep.ApiKeyInput:
                return <ApiKeyInputStep onSubmit={handleApiKeySubmit} />;
            case AppStep.StoryInput:
                return <StoryInputStep onSubmit={handleStorySubmit} error={error} />;
            case AppStep.Analyzing:
                return <GenerationStep status="Analyzing your story..." details="Our AI is identifying key plot points, characters, and scenes to create a storyboard." />;
            case AppStep.CharacterGen:
                return <GenerationStep status="Creating Characters..." details="The AI is now generating initial descriptions for your characters based on the story." />;
            case AppStep.Customize:
                return <CustomizationStep characters={characters} totalPanels={storyboard.length} onSubmit={handleCustomizationSubmit} error={error} />;
            case AppStep.Generating:
                return <GenerationStep
                    status="Crafting your comic..."
                    details="The AI is generating images for each panel. You can see the progress below."
                    progress={generationProgress}
                    panels={liveGeneratedPanels}
                />;
            case AppStep.Complete:
                return <ComicViewerStep pages={comicPages} onEditPanel={handleEditPanel} />;
            default:
                // Render a generic loading state while the initial step is determined
                return <GenerationStep status="Initializing..." details="Please wait." />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 font-sans">
            <Header onReset={handleReset} showReset={step !== AppStep.ApiKeyInput} onOpenSettings={handleOpenSettings} />
            <main className="container mx-auto px-4 py-8">
                {renderStep()}
            </main>
            {editingPanel && (
                <EditPanelModal
                    panel={editingPanel}
                    onClose={handleCloseEditModal}
                    onUpdate={handleUpdatePanel}
                    onRegenerate={handleRegeneratePanelImage}
                    error={error}
                    clearError={() => setError(null)}
                />
            )}
            {isSettingsModalOpen && (
                <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={handleCloseSettings}
                    onSave={handleSaveApiKey}
                    currentApiKey={userApiKey || ''}
                />
            )}
        </div>
    );
};

export default App;