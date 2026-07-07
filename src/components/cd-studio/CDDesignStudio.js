import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import CDTopbar from './CDTopbar';
import CDElementsSidebar from './CDElementsSidebar';
import CDCanvas from './CDCanvas';
import CDPropertiesSidebar from './CDPropertiesSidebar';
import CDLayersPanel from './CDLayersPanel';
import {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
} from '../../utils/templateApi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import './CDDesignStudio.css';

// ─── DICOM Preview Data (sample values shown in designer) ────────────────────
const SAMPLE_DICOM = {
    PatientName: 'John Doe',
    PatientId: 'PID-123456',
    StudyDate: '18-Jun-2026',
    Modality: 'CT',
    AccessionNumber: 'ACC-789012',
    StudyDescription: 'CT Chest with Contrast',
    StudyInstanceUID: '1.2.840.10008.5.1.4.1.1.2',
};

// ─── Placeholder map: spec keys → sample values ───────────────────────────────
const DICOM_PLACEHOLDER_MAP = {
    '{{PatientName}}': 'PatientName',
    '{{PatientId}}': 'PatientId',
    '{{StudyDate}}': 'StudyDate',
    '{{Modality}}': 'Modality',
    '{{AccessionNumber}}': 'AccessionNumber',
    '{{StudyDescription}}': 'StudyDescription',
    '{{StudyInstanceUID}}': 'StudyInstanceUID',
};

export function resolveDicomPlaceholders(text, dicomData) {
    if (!text) return text;
    let resolved = text;
    Object.entries(DICOM_PLACEHOLDER_MAP).forEach(([placeholder, key]) => {
        resolved = resolved.replaceAll(placeholder, dicomData[key] || placeholder);
    });
    return resolved;
}

export { SAMPLE_DICOM, DICOM_PLACEHOLDER_MAP };

// ─── Canvas / CD dimensions (frontend display units) ─────────────────────────
// The spec defines 1200×1200 px, but we render at 360 px (scaled by zoom).
// When serializing to the backend, we use the 1200-based coordinate space.
const DISPLAY_SIZE = 360;
const SPEC_SIZE = 1200;
const SCALE = SPEC_SIZE / DISPLAY_SIZE; // 3.333…

let nextId = 100;
function genId() { return `el-${nextId++}`; }

const DEFAULT_DISC_CONFIG = {
    outerRadius: 60,
    printableRadius: 58,
    safeRadius: 56,
    innerRadius: 11,
};

// ─── Schema converters ────────────────────────────────────────────────────────

/**
 * Convert a backend object (1200-px space, spec schema) → frontend element
 */
function specToElement(obj) {
    if (obj.type === 'image') {
        const relativeSrc = obj.source || '';
        // Build a full URL for the canvas <img> tag so the browser can fetch the image
        const serverBase = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/api\/?$/, '');
        const displaySrc = relativeSrc && !relativeSrc.startsWith('blob:') && !relativeSrc.startsWith('http')
            ? `${serverBase}${relativeSrc}`
            : relativeSrc;

        const isBackground = obj.left === 0 && obj.top === 0 && obj.width === SPEC_SIZE;
        return {
            id: String(obj.id),
            type: 'image',
            subtype: isBackground ? 'background' : 'custom',
            name: obj.subtype || (isBackground ? 'Background Image' : 'Image'),
            // Background images always fill the full CD display area
            x: isBackground ? 0 : Math.round(obj.left / SCALE),
            y: isBackground ? 0 : Math.round(obj.top / SCALE),
            width: isBackground ? DISPLAY_SIZE : Math.round(obj.width / SCALE),
            height: isBackground ? DISPLAY_SIZE : Math.round(obj.height / SCALE),
            src: displaySrc,     // full URL — used by canvas <img> for display
            source: relativeSrc, // relative path — stored back to backend on save
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
            zIndex: obj.zIndex ?? 0,
            objectFit: isBackground ? 'fill' : 'contain',
        };
    }

    // text / dynamic
    return {
        id: String(obj.id),
        type: 'dynamic',
        name: obj.name || 'Text',
        x: Math.round(obj.left / SCALE),
        y: Math.round(obj.top / SCALE),
        width: Math.round((obj.width || 400) / SCALE),
        rotation: 0,
        opacity: 1,
        content: obj.text || '',
        fontFamily: obj.fontFamily || 'Arial',
        fontSize: Math.round((obj.fontSize || 28) / SCALE),
        fontWeight: obj.bold ? '700' : '400',
        fontStyle: obj.italic ? 'italic' : 'normal',
        color: obj.color || '#000000',
        textAlign: obj.align || 'left',
        letterSpacing: 0,
        lineHeight: 1.4,
        locked: false,
        visible: true,
        zIndex: obj.zIndex ?? 2,
    };
}

/**
 * Convert a frontend element → backend object (1200-px space, spec schema).
 *
 * Frontend types → API types:
 *   "image"   → { type: "image", source, left, top, width, height, zIndex }
 *   "label"   → { type: "text",  text (custom string), ...font props }
 *   "dynamic" → { type: "text",  text ({{Placeholder}}), ...font props }
 */
function elementToSpec(el, idCounter) {
    if (el.type === 'image') {
        return {
            id: idCounter,
            type: 'image',
            source: el.source || el.src || '',
            left: Math.round((el.x || 0) * SCALE),
            top: Math.round((el.y || 0) * SCALE),
            width: Math.round((el.width || 120) * SCALE),
            height: Math.round((el.height || 120) * SCALE),
            zIndex: el.zIndex ?? 0,
        };
    }

    // Both "label" (custom text) and "dynamic" (DICOM placeholder) → type: "text"
    const fontSizePx = el.fontSize || 14;
    const heightPx = el.height || Math.round(fontSizePx * 1.4);
    return {
        id: idCounter,
        type: 'text',
        text: el.content || '',
        left: Math.round((el.x || 0) * SCALE),
        top: Math.round((el.y || 0) * SCALE),
        width: Math.round((el.width || 200) * SCALE),
        height: Math.round(heightPx * SCALE),
        fontSize: Math.round(fontSizePx * SCALE),
        fontFamily: el.fontFamily || 'Arial',
        color: el.color || '#000000',
        bold: el.fontWeight === '700' || el.fontWeight === '800' || el.fontWeight === 'bold',
        italic: el.fontStyle === 'italic',
        align: el.textAlign || 'left',
        zIndex: el.zIndex ?? 2,
    };
}

/**
 * Build the full template payload to POST/PUT to backend.
 * Serializes all canvas elements into the 1200×1200 spec schema.
 *
 * Payload shape (matches API contract):
 *   {
 *     name,
 *     description,
 *     jsonDefinition: { width: 1200, height: 1200, objects: [...] },
 *     backgroundImage: "",
 *     isDefault: false
 *   }
 *
 * Each object inside jsonDefinition is one of:
 *   { id, type:"image", source, left, top, width, height, zIndex }
 *   { id, type:"text",  text, left, top, width, height, fontSize,
 *     fontFamily, color, bold, italic, align, zIndex }
 */
function buildTemplatePayload(name, elements, { description = '', backgroundImage = '', isDefault = false, createdAt = null } = {}) {
    const jsonDefinition = {
        // width: SPEC_SIZE,
        // height: SPEC_SIZE,
        objects: elements.map((el, i) => elementToSpec(el, i + 1)),
    };

    const payload = {
        name,
        description,
        jsonDefinition,
        backgroundImage,
        isDefault,
        ...(createdAt ? { createdAt } : {}),
    };
    // ── Debug: inspect the exact JSON being sent to the API ──────────────────
    console.log('[CDDesignStudio] Template payload to submit:', JSON.stringify(payload, null, 2));
    return payload;
}

/**
 * Restore elements from a backend template.
 * Handles:
 *   - jsonDefinition as a plain object  { width, height, objects }
 *   - jsonDefinition as a JSON string   "{\"width\":1200,...}"
 *   - Legacy: template.objects array directly on the template
 */
export function restoreElementsFromTemplate(template) {
    if (template?.jsonDefinition) {
        let def = template.jsonDefinition;

        // If it's a string, parse it to an object first
        if (typeof def === 'string') {
            try {
                def = JSON.parse(def);
            } catch (e) {
                console.warn('[CDDesignStudio] Failed to parse jsonDefinition string:', e);
                def = null;
            }
        }

        // def is now an object (or null if parse failed)
        if (def?.objects?.length) {
            return def.objects.map(specToElement);
        }
    }

    // Legacy fallback: objects directly on template
    if (!template?.objects?.length) return [];
    return template.objects.map(specToElement);
}

// ─── History helpers ──────────────────────────────────────────────────────────
function cloneElements(elements) {
    return elements.map(el => ({ ...el }));
}

// ─── Save Template Modal ──────────────────────────────────────────────────────
function SaveTemplateModal({ mode, initialName, initialDescription, saving, onConfirm, onCancel }) {
    const [name, setName] = useState(initialName || '');
    const [description, setDescription] = useState(initialDescription || '');

    const title = mode === 'saveAs' ? 'Save As New Template'
        : (initialName ? 'Update Template' : 'Save Template');

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({ name, description });
    };

    return (
        <div className="cds-modal-overlay" onClick={onCancel}>
            <div className="cds-modal" onClick={e => e.stopPropagation()}>
                <div className="cds-modal-header">
                    <span className="cds-modal-title">{title}</span>
                    <button className="cds-modal-close" onClick={onCancel} title="Cancel">✕</button>
                </div>
                <form className="cds-modal-body" onSubmit={handleSubmit}>
                    <div className="cds-modal-field">
                        <label className="cds-modal-label" htmlFor="cds-tpl-name">Template Name <span className="cds-modal-required">*</span></label>
                        <input
                            id="cds-tpl-name"
                            className="cds-modal-input"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Standard CT Label"
                            autoFocus
                            required
                        />
                    </div>
                    <div className="cds-modal-field">
                        <label className="cds-modal-label" htmlFor="cds-tpl-desc">Description <span className="cds-modal-optional">(optional)</span></label>
                        <textarea
                            id="cds-tpl-desc"
                            className="cds-modal-input cds-modal-textarea"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Short description of this template…"
                            rows={3}
                        />
                    </div>
                    <div className="cds-modal-footer">
                        <button type="button" className="cds-modal-btn cds-modal-btn--cancel" onClick={onCancel} disabled={saving}>
                            Cancel
                        </button>
                        <button type="submit" className="cds-modal-btn cds-modal-btn--primary" disabled={saving || !name.trim()}>
                            {saving ? 'Saving…' : (mode === 'saveAs' ? 'Save As New' : (initialName ? 'Update' : 'Save'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

function CDDesignStudio({ onBack }) {
    const [elements, setElements] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [discConfig] = useState(DEFAULT_DISC_CONFIG);
    const [history, setHistory] = useState([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [zoom, setZoom] = useState(() => {
        const baseZoom = (window.innerWidth / 1920) * 2;
        return Math.min(3, Math.max(0.25, Math.round(baseZoom * 100) / 100));
    });
    const [showGrid, setShowGrid] = useState(true);

    // API-backed templates
    const [templates, setTemplates] = useState([]);          // list from GET /api/templates
    const [activeTemplate, setActiveTemplate] = useState(null); // currently loaded template object
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [savingTemplate, setSavingTemplate] = useState(false);

    // ── Save modal state ─────────────────────────────────────────────────────
    const [saveModal, setSaveModal] = useState(null);
    // saveModal shape: { mode: 'save' | 'saveAs', name: string, description: string }

    const [confirmDialog, setConfirmDialog] = useState(null);

    const [dicomData] = useState(SAMPLE_DICOM);

    // ── Load templates from API on mount ────────────────────────────────────
    useEffect(() => {
        setLoadingTemplates(true);
        getTemplates()
            .then(data => {
                const list = Array.isArray(data) ? data : (data?.items || data?.data || []);
                setTemplates(list);
            })
            .catch(err => {
                console.error('Failed to load templates:', err);
                toast.error(err?.response?.data?.message || err.message || 'Failed to load templates');
                setTemplates([]);
            })
            .finally(() => setLoadingTemplates(false));
    }, []);

    // ── History ──────────────────────────────────────────────────────────────
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

    // ── Element operations ───────────────────────────────────────────────────
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
        updateElements([...elements, dup]);
        setSelectedIds([dup.id]);
    }, [selectedElement, elements, updateElements]);

    const bringForward = useCallback(() => {
        if (!selectedElement) return;
        updateElements(elements.map(e =>
            e.id === selectedElement.id ? { ...e, zIndex: e.zIndex + 1 } : e
        ));
    }, [selectedElement, elements, updateElements]);

    const sendBackward = useCallback(() => {
        if (!selectedElement) return;
        updateElements(elements.map(e =>
            e.id === selectedElement.id ? { ...e, zIndex: Math.max(0, e.zIndex - 1) } : e
        ));
    }, [selectedElement, elements, updateElements]);

    // ── Open save modal ───────────────────────────────────────────────────────
    const saveTemplate = useCallback(() => {
        setSaveModal({
            mode: 'save',
            name: activeTemplate?.name || '',
            description: activeTemplate?.description || '',
        });
    }, [activeTemplate]);

    const saveAsTemplate = useCallback(() => {
        setSaveModal({
            mode: 'saveAs',
            name: '',
            description: '',
        });
    }, []);

    // ── Actual API call — triggered by modal confirm ──────────────────────────
    const handleSaveConfirm = useCallback(async ({ name, description }) => {
        if (!name.trim()) { toast.error('Template name is required.'); return; }
        setSaveModal(null);
        setSavingTemplate(true);
        try {
            const isNew = saveModal?.mode === 'saveAs' || !activeTemplate?.id;
            const payload = buildTemplatePayload(name.trim(), elements, {
                description: description.trim(),
                backgroundImage: activeTemplate?.backgroundImage || '',
                isDefault: activeTemplate?.isDefault || false,
                createdAt: !isNew ? (activeTemplate?.createdAt || null) : null,
            });

            let saved;
            if (!isNew) {
                saved = await updateTemplate(activeTemplate.id, payload);
                setTemplates(prev => prev.map(t => t.id === saved.id ? saved : t));
                toast.success('Template updated!');
            } else {
                saved = await createTemplate(payload);
                setTemplates(prev => [...prev, saved]);
                toast.success('Template saved!');
            }
            setActiveTemplate(saved);
        } catch (err) {
            console.error('Save template failed:', err);
            toast.error(err?.response?.data?.message || err.message || 'Save failed');
        } finally {
            setSavingTemplate(false);
        }
    }, [elements, activeTemplate, saveModal]);

    // ── Load template from dropdown (calls GET /api/templates/{id}) ─────────────
    const loadTemplate = useCallback(async (templateId) => {
        try {
            // Fetch the full template (includes jsonDefinition with objects)
            const fullTemplate = await getTemplate(templateId);
            const restored = restoreElementsFromTemplate(fullTemplate);
            setElements(restored);
            setHistory([restored]);
            setHistoryIndex(0);
            setSelectedIds([]);
            setActiveTemplate(fullTemplate);
            toast.success(`Loaded: ${fullTemplate.name}`);
        } catch (err) {
            console.error('Failed to load template:', err);
            toast.error(err?.response?.data?.message || err.message || 'Failed to load template');
        }
    }, []);

    // ── Delete template ──────────────────────────────────────────────────────
    const deleteActiveTemplate = useCallback(async () => {
        if (!activeTemplate?.id) {
            toast.error('No saved template is active.');
            return;
        }
        setConfirmDialog({
            title: 'Delete Template',
            message: `Delete template "${activeTemplate.name}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await deleteTemplate(activeTemplate.id);
                    setTemplates(prev => prev.filter(t => t.id !== activeTemplate.id));
                    setActiveTemplate(null);
                    setElements([]);
                    setHistory([[]]);
                    setHistoryIndex(0);
                    setSelectedIds([]);
                    toast.success('Template deleted.');
                } catch (err) {
                    toast.error(`Delete failed: ${err.message}`);
                }
            }
        });
    }, [activeTemplate]);

    // ── New blank canvas ─────────────────────────────────────────────────────
    const newBlankCanvas = useCallback(() => {
        if (elements.length > 0) {
            setConfirmDialog({
                title: 'New Blank Canvas',
                message: 'Start a new blank canvas? Unsaved changes will be lost.',
                onConfirm: () => {
                    setElements([]);
                    setHistory([[]]);
                    setHistoryIndex(0);
                    setSelectedIds([]);
                    setActiveTemplate(null);
                }
            });
            return;
        }
        setElements([]);
        setHistory([[]]);
        setHistoryIndex(0);
        setSelectedIds([]);
        setActiveTemplate(null);
    }, [elements]);

    // ── Export JSON ──────────────────────────────────────────────────────────
    const exportTemplate = useCallback(() => {
        const payload = buildTemplatePayload(
            activeTemplate?.name || 'Exported Template',
            elements,
            {
                description: activeTemplate?.description || '',
                backgroundImage: activeTemplate?.backgroundImage || '',
                isDefault: activeTemplate?.isDefault || false,
            }
        );
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'cd-template.json';
        a.click();
    }, [elements, activeTemplate]);

    // ── Import JSON ──────────────────────────────────────────────────────────
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
                    // Accept both spec format (objects[]) and legacy (elements[])
                    if (data.objects) {
                        const restored = restoreElementsFromTemplate(data);
                        updateElements(restored);
                        setActiveTemplate(null);
                        toast.success('Template imported from JSON!');
                    } else if (data.elements) {
                        updateElements(data.elements);
                        setActiveTemplate(null);
                        toast.success('Template imported!');
                    } else {
                        toast.error('Unrecognized template format.');
                    }
                } catch {
                    toast.error('Invalid template file.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, [updateElements]);

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
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
                onSaveAs={saveAsTemplate}
                onNew={newBlankCanvas}
                onDeleteTemplate={deleteActiveTemplate}
                onExportTemplate={exportTemplate}
                onImportTemplate={importTemplate}
                templates={templates}
                activeTemplate={activeTemplate}
                onLoadTemplate={loadTemplate}
                loadingTemplates={loadingTemplates}
                savingTemplate={savingTemplate}
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
                    <CDPropertiesSidebar
                        element={selectedElement}
                        onUpdate={updateSelectedElement}
                    />
                    <CDLayersPanel
                        elements={elements}
                        selectedIds={selectedIds}
                        onSelect={(id) => setSelectedIds([id])}
                        onUpdate={updateElements}
                    />
                </div>
            </div>

            {/* ── Save / Update Modal ───────────────────────────────────── */}
            {saveModal && (
                <SaveTemplateModal
                    mode={saveModal.mode}
                    initialName={saveModal.name}
                    initialDescription={saveModal.description}
                    saving={savingTemplate}
                    onConfirm={handleSaveConfirm}
                    onCancel={() => setSaveModal(null)}
                />
            )}

            {/* ── Confirm Modal ───────────────────────────────────── */}
            {confirmDialog && (
                <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                            <AlertDialogDescription>{confirmDialog.message}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setConfirmDialog(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    confirmDialog.onConfirm();
                                    setConfirmDialog(null);
                                }}
                                className={confirmDialog.title === 'Delete Template' ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                            >
                                Confirm
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
    );
}

export default CDDesignStudio;
