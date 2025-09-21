
import React, { useRef } from 'react';
import { ComicPage, ComicPanelData } from '../types';
import ComicPanel from './ComicPanel';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ComicViewerStepProps {
    pages: ComicPage[];
    onEditPanel: (panel: ComicPanelData, pageNumber: number) => void;
}

const PageLayout: React.FC<{ panels: ComicPanelData[], onEditPanel: (panel: ComicPanelData) => void }> = ({ panels, onEditPanel }) => {
    const panelCount = panels.length;

    if (panelCount === 1) {
        return <ComicPanel panel={panels[0]} onEdit={onEditPanel} />;
    }

    if (panelCount === 2) {
        return (
            <div className="grid grid-rows-2 gap-4 h-full">
                {panels.map(panel => <ComicPanel key={panel.panel_number} panel={panel} onEdit={onEditPanel} />)}
            </div>
        );
    }

    if (panelCount === 3) {
        const wideIndex = panels.findIndex(p => p.panel_emphasis === 'WIDE');
        if (wideIndex === 0) { // Wide panel at top
            return (
                <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                    <div key={panels[0].panel_number} className="col-span-2"><ComicPanel panel={panels[0]} onEdit={onEditPanel} /></div>
                    <div key={panels[1].panel_number}><ComicPanel panel={panels[1]} onEdit={onEditPanel} /></div>
                    <div key={panels[2].panel_number}><ComicPanel panel={panels[2]} onEdit={onEditPanel} /></div>
                </div>
            );
        }
        if (wideIndex === 2) { // Wide panel at bottom
            return (
                <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                    <div key={panels[0].panel_number}><ComicPanel panel={panels[0]} onEdit={onEditPanel} /></div>
                    <div key={panels[1].panel_number}><ComicPanel panel={panels[1]} onEdit={onEditPanel} /></div>
                    <div key={panels[2].panel_number} className="col-span-2"><ComicPanel panel={panels[2]} onEdit={onEditPanel} /></div>
                </div>
            );
        }
        const tallIndex = panels.findIndex(p => p.panel_emphasis === 'TALL');
        if (tallIndex === 0) { // Tall panel on left
             return (
                <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                    <div key={panels[0].panel_number} className="row-span-2"><ComicPanel panel={panels[0]} onEdit={onEditPanel} /></div>
                    <div key={panels[1].panel_number}><ComicPanel panel={panels[1]} onEdit={onEditPanel} /></div>
                    <div key={panels[2].panel_number}><ComicPanel panel={panels[2]} onEdit={onEditPanel} /></div>
                </div>
            );
        }
         if (tallIndex === 2) { // Tall panel on right
            return (
                <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                    <div key={panels[0].panel_number}><ComicPanel panel={panels[0]} onEdit={onEditPanel} /></div>
                    <div key={panels[2].panel_number} className="row-span-2"><ComicPanel panel={panels[2]} onEdit={onEditPanel} /></div>
                    <div key={panels[1].panel_number}><ComicPanel panel={panels[1]} onEdit={onEditPanel} /></div>
                </div>
            );
        }
        // Default for 3: vertical stack
        return (
            <div className="grid grid-rows-3 gap-4 h-full">
                {panels.map(panel => <ComicPanel key={panel.panel_number} panel={panel} onEdit={onEditPanel} />)}
            </div>
        );
    }

    if (panelCount === 4) {
        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                {panels.map(panel => <ComicPanel key={panel.panel_number} panel={panel} onEdit={onEditPanel} />)}
            </div>
        );
    }

    if (panelCount === 5) {
         return (
            <div className="grid grid-cols-6 grid-rows-2 gap-4 h-full">
                <div key={panels[0].panel_number} className="col-span-3"><ComicPanel panel={panels[0]} onEdit={onEditPanel} /></div>
                <div key={panels[1].panel_number} className="col-span-3"><ComicPanel panel={panels[1]} onEdit={onEditPanel} /></div>
                <div key={panels[2].panel_number} className="col-span-2"><ComicPanel panel={panels[2]} onEdit={onEditPanel} /></div>
                <div key={panels[3].panel_number} className="col-span-2"><ComicPanel panel={panels[3]} onEdit={onEditPanel} /></div>
                <div key={panels[4].panel_number} className="col-span-2"><ComicPanel panel={panels[4]} onEdit={onEditPanel} /></div>
            </div>
        );
    }
    
    if (panelCount === 6) {
        return (
            <div className="grid grid-cols-2 grid-rows-3 gap-4 h-full">
                {panels.map(panel => <ComicPanel key={panel.panel_number} panel={panel} onEdit={onEditPanel} />)}
            </div>
        );
    }
    
    // Fallback for other counts
    return (
        <div className="grid grid-cols-2 grid-rows-3 gap-4 h-full">
            {panels.map(panel => <ComicPanel key={panel.panel_number} panel={panel} onEdit={onEditPanel} />)}
        </div>
    );
};


const ComicViewerStep: React.FC<ComicViewerStepProps> = ({ pages, onEditPanel }) => {
    const comicContainerRef = useRef<HTMLDivElement>(null);

    const handleDownloadPdf = async () => {
        const container = comicContainerRef.current;
        if (!container) return;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageElements = container.querySelectorAll('.comic-page-a4');

        for (let i = 0; i < pageElements.length; i++) {
            const page = pageElements[i] as HTMLElement;
            // Temporarily hide edit buttons
            const editButtons = page.querySelectorAll('.edit-button');
            editButtons.forEach(btn => (btn as HTMLElement).style.display = 'none');

            const canvas = await html2canvas(page, { scale: 2 });

            // Restore edit buttons
            editButtons.forEach(btn => (btn as HTMLElement).style.display = 'block');

            const imgData = canvas.toDataURL('image/png');

            if (i > 0) {
                pdf.addPage();
            }

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }

        pdf.save('comic-crafter-story.pdf');
    };


    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-indigo-400 mb-2 font-comic">Your Comic Is Ready!</h2>
                <p className="text-lg text-slate-300">Review your masterpiece below, edit panels, and download it as a PDF.</p>
                <button
                    onClick={handleDownloadPdf}
                    className="mt-6 inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download PDF</span>
                </button>
            </div>

            <div ref={comicContainerRef}>
                {pages.map(page => (
                    <div key={page.pageNumber} className="comic-page-a4 w-[210mm] h-[297mm] bg-white shadow-2xl mx-auto my-8 p-4">
                        <PageLayout 
                            panels={page.panels} 
                            onEditPanel={(p) => onEditPanel(p, page.pageNumber)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ComicViewerStep;