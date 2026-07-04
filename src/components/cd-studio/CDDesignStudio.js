import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import CDTopbar from './CDTopbar';
import CDElementsSidebar from './CDElementsSidebar';
import CDCanvas from './CDCanvas';
import CDPropertiesSidebar from './CDPropertiesSidebar';
import CDLayersPanel from './CDLayersPanel';
import './CDDesignStudio.css';

const SAMPLE_DICOM = {
    patientName: 'John Doe',
    patientId: 'PID-123456',
    studyDate: '18-Jun-2026',
    studyTime: '09:42:31',
    modality: 'CT',
    accessionNumber: 'ACC-789012',
    hospitalName: 'ABC Medical Center',
    referringDoctor: 'Dr. Sarah Johnson',
    studyDescription: 'CT Chest with Contrast',
};

const DICOM_PLACEHOLDER_MAP = {
    '{{patientName}}': 'patientName',
    '{{patientId}}': 'patientId',
    '{{studyDate}}': 'studyDate',
    '{{studyTime}}': 'studyTime',
    '{{modality}}': 'modality',
    '{{accessionNumber}}': 'accessionNumber',
    '{{hospitalName}}': 'hospitalName',
    '{{referringDoctor}}': 'referringDoctor',
    '{{studyDescription}}': 'studyDescription',
};

export function resolveDicomPlaceholders(text, dicomData) {
    if (!text) return text;
    let resolved = text;
    Object.entries(DICOM_PLACEHOLDER_MAP).forEach(([placeholder, key]) => {
        resolved = resolved.replaceAll(placeholder, dicomData[key] || placeholder);
    });
    return resolved;
}

let nextId = 100;
function genId() { return `el-${nextId++}`; }

const CD_TEMPLATE_STORAGE_KEY = 'raster_cd_label_templates';
const BLANK_TEMPLATE_ID = 'blank';

const DEFAULT_ELEMENTS = [];

const SAMPLE_LABEL_ELEMENTS = [
    {
        id: 'bg-1',
        type: 'rectangle',
        name: 'Background',
        x: 0, y: 0,
        width: 360, height: 360,
        rotation: 0,
        opacity: 1,
        fill: '#ffffff',
        stroke: 'none',
        strokeWidth: 0,
        borderRadius: 180,
        locked: false,
        visible: true,
        zIndex: 0,
    },
    {
        id: 'text-hospital',
        type: 'dynamic',
        name: 'Hospital Name',
        x: 180, y: 85,
        width: 260,
        rotation: 0,
        opacity: 1,
        content: '{{hospitalName}}',
        fontFamily: 'Bai Jamjuree',
        fontSize: 13,
        fontWeight: '700',
        color: '#1a73e8',
        textAlign: 'center',
        letterSpacing: 2,
        lineHeight: 1.4,
        locked: false,
        visible: true,
        zIndex: 2,
    },
    {
        id: 'divider-1',
        type: 'line',
        name: 'Top Divider',
        x: 100, y: 105,
        width: 160, height: 1,
        rotation: 0,
        opacity: 0.5,
        fill: '#5fa6ff',
        locked: false,
        visible: true,
        zIndex: 3,
    },
    {
        id: 'text-patient',
        type: 'dynamic',
        name: 'Patient Name',
        x: 180, y: 135,
        width: 260,
        rotation: 0,
        opacity: 1,
        content: '{{patientName}}',
        fontFamily: 'Bai Jamjuree',
        fontSize: 16,
        fontWeight: '700',
        color: '#111111',
        textAlign: 'center',
        letterSpacing: 0.5,
        lineHeight: 1.4,
        locked: false,
        visible: true,
        zIndex: 4,
    },
    {
        id: 'text-pid',
        type: 'dynamic',
        name: 'Patient ID',
        x: 180, y: 158,
        width: 260,
        rotation: 0,
        opacity: 0.7,
        content: 'ID: {{patientId}}',
        fontFamily: 'Bai Jamjuree',
        fontSize: 10,
        fontWeight: '500',
        color: '#555555',
        textAlign: 'center',
        letterSpacing: 1,
        lineHeight: 1.4,
        locked: false,
        visible: true,
        zIndex: 5,
    },
    {
        id: 'text-modality',
        type: 'dynamic',
        name: 'Modality Badge',
        x: 180, y: 195,
        width: 260,
        rotation: 0,
        opacity: 1,
        content: '{{modality}} • {{studyDate}}',
        fontFamily: 'Bai Jamjuree',
        fontSize: 11,
        fontWeight: '600',
        color: '#1a73e8',
        textAlign: 'center',
        letterSpacing: 1.5,
        lineHeight: 1.4,
        locked: false,
        visible: true,
        zIndex: 6,
    },
    {
        id: 'divider-2',
        type: 'line',
        name: 'Bottom Divider',
        x: 100, y: 218,
        width: 160, height: 1,
        rotation: 0,
        opacity: 0.3,
        fill: '#aaaaaa',
        locked: false,
        visible: true,
        zIndex: 7,
    },
    {
        id: 'text-desc',
        type: 'dynamic',
        name: 'Study Description',
        x: 180, y: 238,
        width: 240,
        rotation: 0,
        opacity: 0.8,
        content: '{{studyDescription}}',
        fontFamily: 'Bai Jamjuree',
        fontSize: 10,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'center',
        letterSpacing: 0.5,
        lineHeight: 1.4,
        locked: false,
        visible: true,
        zIndex: 8,
    },
    {
        id: 'text-doc',
        type: 'dynamic',
        name: 'Referring Doctor',
        x: 180, y: 265,
        width: 240,
        rotation: 0,
        opacity: 0.7,
        content: 'Ref: {{referringDoctor}}',
        fontFamily: 'Bai Jamjuree',
        fontSize: 9,
        fontWeight: '400',
        color: '#555555',
        textAlign: 'center',
        letterSpacing: 0.3,
        lineHeight: 1.4,
        locked: false,
        visible: true,
        zIndex: 9,
    },
];

const BUILT_IN_TEMPLATES = [
    { id: BLANK_TEMPLATE_ID, name: 'Blank Label', elements: DEFAULT_ELEMENTS, isDefault: true },
    { id: 'sample-label', name: 'Sample Label Template', elements: SAMPLE_LABEL_ELEMENTS, isDefault: true },
];

function cloneElements(elements) {
    return elements.map(element => ({ ...element }));
}

function loadStoredTemplates() {
    try {
        const saved = localStorage.getItem(CD_TEMPLATE_STORAGE_KEY);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveStoredTemplates(templates) {
    const userTemplates = templates.filter(template => !template.isDefault);
    localStorage.setItem(CD_TEMPLATE_STORAGE_KEY, JSON.stringify(userTemplates));
}

const DEFAULT_DISC_CONFIG = {
    outerRadius: 60,
    printableRadius: 58,
    safeRadius: 56,
    innerRadius: 11
};

export { SAMPLE_DICOM, DICOM_PLACEHOLDER_MAP };

function CDDesignStudio({ onBack }) {
    const [elements, setElements] = useState(DEFAULT_ELEMENTS);
    const [selectedIds, setSelectedIds] = useState([]);
    const [discConfig] = useState(DEFAULT_DISC_CONFIG);
    const [history, setHistory] = useState([DEFAULT_ELEMENTS]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [zoom, setZoom] = useState(() => {
        const baseZoom = (window.innerWidth / 1920) * 2;
        return Math.min(3, Math.max(0.25, Math.round(baseZoom * 100) / 100));
    });
    const [showGrid, setShowGrid] = useState(true);
    const [templates, setTemplates] = useState(() => [
        ...BUILT_IN_TEMPLATES,
        ...loadStoredTemplates(),
    ]);
    const [activeTemplate, setActiveTemplate] = useState(BLANK_TEMPLATE_ID);
    const [dicomData] = useState(SAMPLE_DICOM);

    const pushHistory = useCallback((newElements) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newElements);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const updateElements = useCallback((newElements) => {
        setElements(newElements);
        pushHistory(newElements);
    }, [pushHistory]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setElements(history[prevIndex]);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setElements(history[nextIndex]);
        }
    }, [history, historyIndex]);

    const selectedElement = selectedIds.length === 1
        ? elements.find(e => e.id === selectedIds[0])
        : null;

    const updateSelectedElement = useCallback((updates) => {
        if (!selectedElement) return;
        const newElements = elements.map(e =>
            e.id === selectedElement.id ? { ...e, ...updates } : e
        );
        updateElements(newElements);
    }, [selectedElement, elements, updateElements]);

    const addElement = useCallback((newEl) => {
        let currentElements = [...elements];
        // If adding a new background, remove any existing background image
        if (newEl.subtype === 'background') {
            currentElements = currentElements
                .filter(e => e.subtype !== 'background')
                .map(e => ({ ...e, zIndex: Math.max(1, (e.zIndex || 0) + 1) }));
        }

        const zIndex = newEl.zIndex !== undefined ? newEl.zIndex : currentElements.length;
        const el = { ...newEl, id: genId(), zIndex };

        currentElements.push(el);
        updateElements(currentElements);
        setSelectedIds([el.id]);
    }, [elements, updateElements]);

    const deleteSelected = useCallback(() => {
        if (selectedIds.length === 0) return;
        const newElements = elements.filter(e => !selectedIds.includes(e.id));
        updateElements(newElements);
        setSelectedIds([]);
    }, [selectedIds, elements, updateElements]);

    const duplicateSelected = useCallback(() => {
        if (!selectedElement) return;
        const dup = {
            ...selectedElement,
            id: genId(),
            x: selectedElement.x + 15,
            y: selectedElement.y + 15,
            name: selectedElement.name + ' Copy',
            zIndex: elements.length,
        };
        const newElements = [...elements, dup];
        updateElements(newElements);
        setSelectedIds([dup.id]);
    }, [selectedElement, elements, updateElements]);

    const bringForward = useCallback(() => {
        if (!selectedElement) return;
        const newElements = elements.map(e =>
            e.id === selectedElement.id ? { ...e, zIndex: e.zIndex + 1 } : e
        );
        updateElements(newElements);
    }, [selectedElement, elements, updateElements]);

    const sendBackward = useCallback(() => {
        if (!selectedElement) return;
        const newElements = elements.map(e =>
            e.id === selectedElement.id ? { ...e, zIndex: Math.max(0, e.zIndex - 1) } : e
        );
        updateElements(newElements);
    }, [selectedElement, elements, updateElements]);

    const saveTemplate = useCallback(() => {
        const name = prompt('Template name:', 'My Template');
        if (!name) return;
        const newTemplate = {
            id: `template-${Date.now()}`,
            name,
            elements: cloneElements(elements),
            discConfig: discConfig,
            isDefault: false
        };
        setTemplates(prev => {
            const nextTemplates = [...prev, newTemplate];
            saveStoredTemplates(nextTemplates);
            return nextTemplates;
        });
        setActiveTemplate(newTemplate.id);
        toast.success('Label template saved locally!');
    }, [elements, discConfig]);

    const loadTemplate = useCallback((templateId) => {
        const t = templates.find(t => t.id === templateId);
        if (!t) return;
        updateElements(cloneElements(t.elements));
        // If template has discConfig, we might want to update it too 
        // (though currently discConfig is fixed in state)
        setActiveTemplate(templateId);
    }, [templates, updateElements]);

    const exportTemplate = useCallback(() => {
        const t = { name: 'Exported Template', elements };
        const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'cd-template.json';
        a.click();
    }, [elements]);

    const importTemplate = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (data.elements) {
                        updateElements(data.elements);
                        setActiveTemplate(BLANK_TEMPLATE_ID);
                        toast.success('Template imported successfully!');
                    }
                } catch {
                    toast.error('Invalid template file.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, [updateElements]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
            if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); }
            if (e.key === 'Escape') { setSelectedIds([]); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, duplicateSelected, deleteSelected]);

    return (
        <div className="cds-root cds-dark">
            {/* Top Toolbar */}
            <CDTopbar
                onBack={onBack}
                onUndo={undo}
                onRedo={redo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                zoom={zoom}
                onZoomChange={setZoom}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(g => !g)}
                onSave={saveTemplate}
                onExportTemplate={exportTemplate}
                onImportTemplate={importTemplate}
                templates={templates}
                activeTemplate={activeTemplate}
                onLoadTemplate={loadTemplate}
            />

            {/* Main Editor Area */}
            <div className="cds-editor">
                {/* Left Sidebar */}
                <CDElementsSidebar
                    onAddElement={addElement}
                />

                {/* Canvas Workspace */}
                <CDCanvas
                    elements={elements}
                    selectedIds={selectedIds}
                    onSelect={setSelectedIds}
                    onUpdateElements={updateElements}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    showGrid={showGrid}
                    dicomData={dicomData}
                    discConfig={discConfig}
                    onDuplicate={duplicateSelected}
                    onDelete={deleteSelected}
                    onBringForward={bringForward}
                    onSendBackward={sendBackward}
                />

                {/* Right Sidebar */}
                <div className="cds-right-panel">
                    {/* Properties */}
                    <CDPropertiesSidebar
                        element={selectedElement}
                        onUpdate={updateSelectedElement}
                    />

                    {/* Layers Panel */}
                    <CDLayersPanel
                        elements={elements}
                        selectedIds={selectedIds}
                        onSelect={(id) => setSelectedIds([id])}
                        onUpdate={updateElements}
                    />


                </div>
            </div>
        </div>
    );
}

export default CDDesignStudio;
