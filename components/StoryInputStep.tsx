import React, { useState } from 'react';

interface StoryInputStepProps {
    onSubmit: (story: string) => void;
    error?: string | null;
}

const DEFAULT_STORY = `Captain Eva Rostova, a lone explorer charting the Nebulon Expanse, landed her scout ship, 'The Stardust Drifter', on the jungle planet of Xylos. Her mission: to investigate a faint, repeating energy signal.

Eva, in her silver and blue exosuit, stepped onto the alien soil. The air was thick with the scent of unknown blossoms and the hum of unseen insects. Towering, bioluminescent fungi cast an eerie blue glow on the dense foliage.

Deeper in the jungle, she found the source of the signal: a small, boxy robot, model B.O.B-7, entangled in thick, pulsing vines. One of its optical sensors was cracked, and it beeped weakly. "System... critical... power... low," it chirped.

Eva carefully used her plasma cutter to free the little robot. "Don't worry, little guy. I'll get you out of there," she said, her voice calm and reassuring. The robot's remaining sensor blinked thankfully.

Back on The Stardust Drifter, Eva patched up B.O.B-7. She replaced his power cell and repaired his cracked sensor. "There you go," she said, "Good as new." The robot whirred to life, its lights blinking brightly.

B.O.B-7 projected a hologram. It showed a map of a hidden cave system on Xylos, with a large deposit of rare crylithium crystals marked. "Treasure," B.O.B-7 beeped, pointing a metallic claw at the map. "For you. Friend."

Eva smiled. "Well, B.O.B-7," she said, patting his metallic head. "Looks like this is the start of a beautiful friendship... and a new adventure." The little robot beeped happily, ready for whatever came next.`;

const StoryInputStep: React.FC<StoryInputStepProps> = ({ onSubmit, error }) => {
    const [story, setStory] = useState(DEFAULT_STORY);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (story.trim().length > 50) { // Basic validation
            onSubmit(story);
        }
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <h2 className="text-4xl font-bold text-indigo-400 mb-2 font-comic">Unleash Your Story</h2>
            <p className="text-lg text-slate-300 mb-8">
                Paste your story below. Our AI will analyze the narrative and prepare a storyboard for your comic.
            </p>
            {error && <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-lg relative mb-6 w-full" role="alert">{error}</div>}
            <form onSubmit={handleSubmit} className="w-full">
                <textarea
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    placeholder="Once upon a time, in a galaxy far, far away..."
                    className="w-full h-80 p-4 bg-slate-800 border-2 border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 resize-none"
                />
                <button
                    type="submit"
                    disabled={story.trim().length <= 50}
                    className="mt-6 w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
                >
                    <span>Analyze Story & Create Storyboard</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </button>
                 <p className="text-sm text-slate-500 mt-2">Minimum 50 characters required.</p>
            </form>
        </div>
    );
};

export default StoryInputStep;