import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { StoryboardPanel, CustomizationData, ComicPage, Character, ComicPanelData, TextRenderingMode } from '../types';

// Helper function to initialize the AI client
const getAiClient = (apiKey: string | null): GoogleGenAI => {
    const finalApiKey = apiKey || process.env.API_KEY;
    if (!finalApiKey) {
        throw new Error("Google Gemini API Key is not configured. Please add one in Settings as no developer key is available.");
    }
    return new GoogleGenAI({ apiKey: finalApiKey });
};

// Page layout calculation logic, now exported to be used for re-pagination.
export const calculatePages = (panels: ComicPanelData[]): ComicPage[] => {
    const pages: ComicPage[] = [];
    let currentPagePanels: ComicPanelData[] = [];
    let currentPageWeight = 0;
    const MAX_PAGE_WEIGHT = 6;

    const getPanelWeight = (panel: ComicPanelData): number => {
        switch (panel.panel_emphasis) {
            case 'WIDE': return 2;
            case 'TALL': return 2;
            case 'FULL_PAGE': return MAX_PAGE_WEIGHT;
            default: return 1; // NORMAL
        }
    };

    panels.forEach(panel => {
        const panelWeight = getPanelWeight(panel);

        if (panelWeight >= MAX_PAGE_WEIGHT) {
            if (currentPagePanels.length > 0) {
                pages.push({ pageNumber: 0, panels: currentPagePanels });
            }
            pages.push({ pageNumber: 0, panels: [panel] });
            currentPagePanels = [];
            currentPageWeight = 0;
            return;
        }

        if (currentPageWeight + panelWeight > MAX_PAGE_WEIGHT) {
            pages.push({ pageNumber: 0, panels: currentPagePanels });
            currentPagePanels = [panel];
            currentPageWeight = panelWeight;
        } else {
            currentPagePanels.push(panel);
            currentPageWeight += panelWeight;
        }
    });

    if (currentPagePanels.length > 0) {
        pages.push({ pageNumber: 0, panels: currentPagePanels });
    }

    pages.forEach((page, index) => {
        page.pageNumber = index + 1;
    });

    return pages;
};


const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const storyAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        storyboard: {
            type: Type.ARRAY,
            description: "The story broken down into a sequence of comic panels.",
            items: {
                type: Type.OBJECT,
                properties: {
                    panel_number: { type: Type.INTEGER, description: "Sequential number of the panel." },
                    setting: { type: Type.STRING, description: "Short description of the location and environment." },
                    characters: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of character names present in the panel." },
                    action: { type: Type.STRING, description: "A detailed, one-to-two-sentence description of what's happening." },
                    dialogue: { type: Type.STRING, description: "The text spoken by characters in the panel. Format as 'Character: Line'. Use 'Narrator:' for narration." },
                    internal_monologue: { type: Type.STRING, description: "Any thought bubbles or inner monologue text. Format as 'Character (thought): text'." },
                    panel_emphasis: { type: Type.STRING, description: "Emphasis for this panel to guide layout. Options: 'NORMAL', 'WIDE' (takes full width of a row), 'TALL' (spans multiple rows vertically), 'FULL_PAGE' (takes the entire page). Use 'FULL_PAGE' for extremely pivotal moments. Use 'WIDE' for important establishing shots or actions. Use 'TALL' for dramatic character reveals or vertical actions. 'NORMAL' is for standard panels." }
                },
                 required: ["panel_number", "setting", "characters", "action", "dialogue", "internal_monologue", "panel_emphasis"]
            }
        }
    },
    required: ["storyboard"]
};

const characterDescriptionSchema = {
    type: Type.OBJECT,
    properties: {
        characters: {
            type: Type.ARRAY,
            description: "List of characters with their generated descriptions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING, description: "A detailed visual description of the character inferred from the story. Should be at least 15 words long." }
                },
                required: ["name", "description"]
            }
        }
    },
    required: ["characters"]
};

const speechBubbleSchema = {
    type: Type.OBJECT,
    properties: {
        bubbles: {
            type: Type.ARRAY,
            description: "A list of speech or thought bubbles found in the image.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, description: "The type of bubble, either 'speech' for dialogue or 'thought' for monologue/internal thoughts." },
                    x: { type: Type.INTEGER, description: "The top-left x-coordinate of the bubble's bounding box, in pixels." },
                    y: { type: Type.INTEGER, description: "The top-left y-coordinate of the bubble's bounding box, in pixels." },
                    width: { type: Type.INTEGER, description: "The width of the bubble's bounding box, in pixels." },
                    height: { type: Type.INTEGER, description: "The height of the bubble's bounding box, in pixels." }
                },
                required: ["type", "x", "y", "width", "height"]
            }
        }
    },
    required: ["bubbles"]
};

interface Bubble {
    type: 'speech' | 'thought';
    x: number;
    y: number;
    width: number;
    height: number;
}

export const analyzeStory = async (story: string, apiKey: string | null): Promise<{ storyboard: StoryboardPanel[] }> => {
    const ai = getAiClient(apiKey);

    const prompt = `Analyze the following story and break it down into a logical sequence of comic book panels. For each panel, identify the setting, characters, action, dialogue, and any internal monologue. 
    
When determining the breakdown, also consider the narrative weight of each panel. Assign a 'panel_emphasis' based on its importance. Use 'FULL_PAGE' for climactic, page-turning moments. Use 'WIDE' for establishing shots or significant horizontal actions. Use 'TALL' for dramatic character reveals or vertical actions. Most panels should be 'NORMAL'. This will influence the final comic layout.

Ensure the output is a valid JSON object matching the provided schema.

STORY:
---
${story}
---
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: storyAnalysisSchema,
            safetySettings,
        },
    });

    const jsonString = response.text.trim();
    return JSON.parse(jsonString) as { storyboard: StoryboardPanel[] };
};

export const generateCharacterDescriptions = async (storyboard: StoryboardPanel[], characterNames: string[], apiKey: string | null): Promise<Omit<Character, 'id'>[]> => {
    const ai = getAiClient(apiKey);

    const prompt = `Based on the following comic book storyboard, generate a detailed visual description for each of the main characters listed. Infer their appearance, clothing, and general demeanor from their actions and the story's context.

    CHARACTERS TO DESCRIBE:
    - ${characterNames.join('\n- ')}

    STORYBOARD (Actions & Settings):
    ---
    ${storyboard.map(p => `Panel ${p.panel_number} (${p.setting}): ${p.action}`).join('\n')}
    ---

    Provide a plausible, creative description for each character. The output must be a valid JSON object matching the schema.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: characterDescriptionSchema,
            safetySettings,
        },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString) as { characters: Omit<Character, 'id'>[] };
    return result.characters;
}

const generateImagePrompt = (panel: StoryboardPanel, customization: CustomizationData, charactersWithImages: {name: string, id: string}[]): string => {
    const { style, characters, textRenderingMode } = customization;

    const characterSheet = characters.map(char => {
        return `- ${char.name} (ID: ${char.id}): ${char.description}`;
    }).join('\n');

    const charactersInPanel = panel.characters.length > 0
        ? `Characters in this panel: ${panel.characters.join(', ')}.`
        : 'No characters are explicitly mentioned in this panel.';

    const consistencyInstruction = charactersWithImages.length > 0
        ? `CRITICAL CONSISTENCY INSTRUCTIONS:
- You have been provided with reference images for the following characters: ${charactersWithImages.map(c => c.name).join(', ')}.
- You MUST use these images as the primary guide for the characters' appearance, especially their face, hair, and build.
- The CHARACTER SHEET description provides context for clothing and expression, but the reference image DICTATES their fundamental look. Ensure high fidelity to the reference.`
        : '';
    
    let textInstruction = '';
    switch (textRenderingMode) {
        case 'in_image':
            textInstruction = `Render any dialogue or internal monologue directly into the image using appropriate comic book conventions (e.g., speech bubbles for dialogue, thought bubbles or caption boxes for monologue). Place them carefully to avoid obscuring important visual elements. Dialogue: "${panel.dialogue}". Monologue: "${panel.internal_monologue}".`;
            break;
        case 'typeset':
            textInstruction = 'If there is dialogue or monologue, render it inside appropriate comic book speech or thought bubbles, but KEEP THE BUBBLES EMPTY. The text will be added later. Place bubbles carefully to avoid obscuring important visual elements.';
            break;
        case 'overlay':
        default:
            textInstruction = 'IMPORTANT: Do NOT include any text, speech bubbles, or sound effects in the image itself.';
            break;
    }


    const isRealisticStyle = style.id.includes('realism') || style.id.includes('photo');
    const framingInstruction = isRealisticStyle
        ? `Create a single image in the following style: ${style.prompt}. The image should be composed like a cinematic shot or a frame from a photorealistic graphic novel.`
        : `Create a single comic book panel image in the following style: ${style.prompt}`;

    const prompt = `
A key goal is to maintain visual consistency for all characters. Please refer to the CHARACTER SHEET and any provided reference images to keep character appearances consistent.

CHARACTER SHEET (DRAMATIS PERSONAE):
---
${characterSheet}
---

${consistencyInstruction}

PANEL GENERATION INSTRUCTIONS:
- Style: ${framingInstruction}
- Setting: ${panel.setting}
- Action: ${panel.action}
- ${charactersInPanel}
- Aspect Ratio: The image must have a 4:3 aspect ratio.
- ${textInstruction}
`;

    return prompt.trim();
};

const detectSpeechBubbles = async (ai: GoogleGenAI, base64Image: string): Promise<Bubble[]> => {
    const prompt = `Analyze this image and provide the coordinates of any speech or thought bubbles. Identify only one bubble for speech (dialogue) and one for thought (monologue), if present. The coordinates should be a bounding box. Respond in valid JSON matching the schema. If no bubbles are found, return an empty array.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: speechBubbleSchema,
                safetySettings,
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString) as { bubbles: Bubble[] };
        return result.bubbles || [];
    } catch (error) {
        console.error("Failed to detect speech bubbles:", error);
        return [];
    }
};

const renderTextOnImage = async (base64Image: string, dialogue: string, monologue: string, bubbles: Bubble[]): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return base64Image;

    const image = new Image();
    const imageLoadPromise = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = `data:image/jpeg;base64,${base64Image}`;
    });

    try {
        await imageLoadPromise;
    } catch (error) {
        console.error("Failed to load image onto canvas", error);
        return base64Image;
    }

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    
    await document.fonts.ready; // Ensure custom fonts are loaded

    const drawTextInBox = (text: string, bubble: Bubble) => {
        const paddingX = Math.max(5, bubble.width * 0.08);
        const paddingY = Math.max(5, bubble.height * 0.08);
        const maxWidth = bubble.width - (paddingX * 2);
        const maxHeight = bubble.height - (paddingY * 2);

        if (maxWidth <= 0 || maxHeight <= 0) return;

        let fontSize = Math.min(maxHeight, maxWidth / 2, 30);
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        while (fontSize >= 8) {
            ctx.font = `${fontSize}px "Bangers"`;
            const words = text.split(' ');
            let line = '';
            const lines: string[] = [];
            
            for (const word of words) {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && line.length > 0) {
                    lines.push(line.trim());
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            lines.push(line.trim());
            
            const lineHeight = fontSize * 1.2;
            const totalTextHeight = lines.length * lineHeight;

            if (totalTextHeight <= maxHeight) {
                const startY = bubble.y + (bubble.height / 2) - (totalTextHeight / 2) + (lineHeight / 2);
                lines.forEach((l, i) => {
                    ctx.fillText(l, bubble.x + bubble.width / 2, startY + (i * lineHeight));
                });
                return;
            }
            
            fontSize -= 1;
        }
    };
    
    const cleanText = (rawText: string): string => {
        if (!rawText || rawText.toLowerCase().trim() === 'none' || rawText.toLowerCase().trim() === 'n/a') {
            return "";
        }
        const match = rawText.match(/^(?:.*?(?:\(thought\))?):\s*(.*)$/);
        return (match && match[1]) ? match[1].trim() : rawText.trim();
    };

    const cleanDialogue = cleanText(dialogue);
    const cleanMonologue = cleanText(monologue);

    const speechBubble = bubbles.find(b => b.type === 'speech');
    if (speechBubble && cleanDialogue) {
        drawTextInBox(cleanDialogue, speechBubble);
    }
    
    const thoughtBubble = bubbles.find(b => b.type === 'thought');
    if (thoughtBubble && cleanMonologue) {
        drawTextInBox(cleanMonologue, thoughtBubble);
    }

    return canvas.toDataURL('image/jpeg').split(',')[1];
};


export const generateComicImages = async (
    storyboard: StoryboardPanel[],
    customization: CustomizationData,
    onProgress: (progress: { current: number, total: number }, newPanel?: ComicPanelData) => void,
    apiKey: string | null
): Promise<ComicPage[]> => {
    const ai = getAiClient(apiKey);
    const MAX_PANELS = 400;

    const processedStoryboard = customization.forceFullPage
        ? storyboard.map(p => ({ ...p, panel_emphasis: 'FULL_PAGE' as const }))
        : storyboard;

    const panelsToProcess = processedStoryboard.slice(0, MAX_PANELS);
    const MODEL = 'gemini-2.5-flash-image-preview';
    const generatedPanels: ComicPanelData[] = [];
    const totalPanelsToGenerate = panelsToProcess.length;
    const characterImageHistory = new Map<string, string>();

    for (const char of customization.characters) {
        if (char.referenceImageUrl) {
            const base64Data = char.referenceImageUrl.split(',')[1];
            if (base64Data) {
                characterImageHistory.set(char.id, base64Data);
            }
        }
    }

    for (let i = 0; i < totalPanelsToGenerate; i++) {
        const panel = panelsToProcess[i];
        const contentParts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [];
        const charactersWithImagesInPrompt: {name: string, id: string}[] = [];
        const uniqueCharactersInPanel = [...new Set(panel.characters)];
        const referenceImagesAdded = new Set<string>();

        for (const charName of uniqueCharactersInPanel) {
            const character = customization.characters.find(c => c.name === charName);
            if (character && characterImageHistory.has(character.id)) {
                const base64Image = characterImageHistory.get(character.id)!;
                if (!referenceImagesAdded.has(base64Image)) {
                    contentParts.push({
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image,
                        },
                    });
                    referenceImagesAdded.add(base64Image);
                }
                charactersWithImagesInPrompt.push({ name: character.name, id: character.id });
            }
        }

        const imagePrompt = generateImagePrompt(panel, customization, charactersWithImagesInPrompt);
        contentParts.push({ text: imagePrompt });

        let base64ImageBytes = '';
        const generatedBy = MODEL;
        const MAX_RETRIES = 3;
        let success = false;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model: MODEL,
                    contents: { parts: contentParts },
                    config: {
                        responseModalities: [Modality.IMAGE, Modality.TEXT],
                    },
                });

                const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
                if (!imagePart || !imagePart.inlineData) {
                    throw new Error("No image data found in the response.");
                }
                base64ImageBytes = imagePart.inlineData.data;
                success = true;
                break;

            } catch (error) {
                console.error(`Attempt ${attempt} for panel ${i + 1} failed with ${MODEL}.`, error);
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }
            }
        }

        if (!success) {
            const failedPanel: ComicPanelData = {
                ...panel,
                imageUrl: '',
                generatedBy: 'failed',
                textRenderingMode: customization.textRenderingMode,
            };
            generatedPanels.push(failedPanel);
            onProgress({ current: i + 1, total: totalPanelsToGenerate }, failedPanel);
            continue;
        }

        if (customization.textRenderingMode === 'typeset') {
            const hasText = (panel.dialogue && panel.dialogue.toLowerCase() !== 'none') || 
                            (panel.internal_monologue && panel.internal_monologue.toLowerCase() !== 'none');
            if (hasText) {
                try {
                    const bubbles = await detectSpeechBubbles(ai, base64ImageBytes);
                    if (bubbles.length > 0) {
                        base64ImageBytes = await renderTextOnImage(base64ImageBytes, panel.dialogue, panel.internal_monologue, bubbles);
                    }
                } catch (e) {
                    console.error("Typesetting failed for panel", panel.panel_number, e);
                }
            }
        }
        
        const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

        const newPanel: ComicPanelData = { ...panel, imageUrl, generatedBy, textRenderingMode: customization.textRenderingMode };
        generatedPanels.push(newPanel);
        onProgress({ current: i + 1, total: totalPanelsToGenerate }, newPanel);

        if (i < totalPanelsToGenerate - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    const pages = calculatePages(generatedPanels);
    return pages;
};

export const regeneratePanelImage = async (
    panelToRegen: ComicPanelData,
    customization: CustomizationData,
    apiKey: string | null
): Promise<string> => {
    const ai = getAiClient(apiKey);
    const MODEL = 'gemini-2.5-flash-image-preview';
    const characterImageHistory = new Map<string, string>();
    for (const char of customization.characters) {
        if (char.referenceImageUrl) {
            const base64Data = char.referenceImageUrl.split(',')[1];
            if (base64Data) {
                characterImageHistory.set(char.id, base64Data);
            }
        }
    }

    const contentParts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [];
    const charactersWithImagesInPrompt: {name: string, id: string}[] = [];
    const uniqueCharactersInPanel = [...new Set(panelToRegen.characters)];
    const referenceImagesAdded = new Set<string>();

    for (const charName of uniqueCharactersInPanel) {
        const character = customization.characters.find(c => c.name === charName);
        if (character && characterImageHistory.has(character.id)) {
            const base64Image = characterImageHistory.get(character.id)!;
            if (!referenceImagesAdded.has(base64Image)) {
                contentParts.push({
                    inlineData: { mimeType: 'image/jpeg', data: base64Image },
                });
                referenceImagesAdded.add(base64Image);
            }
            charactersWithImagesInPrompt.push({ name: character.name, id: character.id });
        }
    }

    const regenCustomization = { ...customization, textRenderingMode: panelToRegen.textRenderingMode };
    const imagePrompt = generateImagePrompt(panelToRegen, regenCustomization, charactersWithImagesInPrompt);
    contentParts.push({ text: imagePrompt });

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: { parts: contentParts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(part => part.inlineData);
    if (!imagePart || !imagePart.inlineData) {
        throw new Error("No image data found in the response.");
    }
    
    let base64ImageBytes = imagePart.inlineData.data;

    if (panelToRegen.textRenderingMode === 'typeset') {
        const hasText = (panelToRegen.dialogue && panelToRegen.dialogue.toLowerCase() !== 'none') || 
                        (panelToRegen.internal_monologue && panelToRegen.internal_monologue.toLowerCase() !== 'none');
        if (hasText) {
             try {
                const bubbles = await detectSpeechBubbles(ai, base64ImageBytes);
                if (bubbles.length > 0) {
                    base64ImageBytes = await renderTextOnImage(base64ImageBytes, panelToRegen.dialogue, panelToRegen.internal_monologue, bubbles);
                }
            } catch (e) {
                console.error("Typesetting failed for regenerated panel", panelToRegen.panel_number, e);
            }
        }
    }

    return base64ImageBytes;
};