
export enum AppStep {
    ApiKeyInput = 'api_key_input',
    StoryInput = 'story_input',
    Analyzing = 'analyzing',
    CharacterGen = 'character_gen',
    Customize = 'customize',
    Generating = 'generating',
    Complete = 'complete'
}

export interface StoryboardPanel {
    panel_number: number;
    setting: string;
    characters: string[];
    action: string;
    dialogue: string;
    internal_monologue: string;
    panel_emphasis: 'NORMAL' | 'WIDE' | 'TALL' | 'FULL_PAGE';
}

export interface Character {
    id: string;
    name: string;
    description: string;
    referenceImageUrl?: string;
}

export interface VisualStyle {
    id: string;
    name: string;
    prompt: string;
}

export type TextRenderingMode = 'overlay' | 'in_image' | 'typeset';

export interface CustomizationData {
    style: VisualStyle;
    characters: Character[];
    textRenderingMode: TextRenderingMode;
    forceFullPage?: boolean;
}

export interface ComicPanelData extends StoryboardPanel {
    imageUrl: string;
    generatedBy: string; // Model used for generation, e.g., 'gemini-2.5-flash-image-preview'
    textRenderingMode: TextRenderingMode;
}

export interface ComicPage {
    pageNumber: number;
    panels: ComicPanelData[];
}