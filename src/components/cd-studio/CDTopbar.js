import {
    ArrowLeft, Undo2, Redo2, ZoomOut, ZoomIn,
    Grid3X3, Save, BookTemplate, Upload, Download,
    ChevronDown, Disc3, Plus, Trash2, Loader2, Copy
} from 'lucide-react';
import { useState } from 'react';

function CDTopbar({
    onBack, onUndo, onRedo, canUndo, canRedo,
    zoom, onZoomChange,
    onSave, onSaveAs, onNew, onDeleteTemplate,
    onExportTemplate, onImportTemplate,
    templates, activeTemplate, onLoadTemplate,
    loadingTemplates, savingTemplate,

}) {
    const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
    const zoomPct = Math.round(zoom * 100);

    const zoomOut = () => onZoomChange(Math.max(0.25, zoom - 0.1));
    const zoomIn = () => onZoomChange(Math.min(3, zoom + 0.1));

    const closeMenu = () => setTemplateMenuOpen(false);

    return (
        <div className="cds-toolbar">
            {/* Left Group */}
            <div className="cds-toolbar-group">
                <button className="cds-tb-btn cds-tb-back" onClick={onBack} title="Back to Dashboard">
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </button>

                <div className="cds-tb-divider" />

                <div className="cds-studio-brand">
                    <Disc3 size={18} className="cds-brand-icon" />
                    <div>
                        <div className="cds-brand-title">CD Design Studio</div>
                        <div className="cds-brand-sub">
                            {activeTemplate
                                ? activeTemplate.name
                                : 'DICOM Label Editor'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Center Group */}
            <div className="cds-toolbar-group cds-toolbar-center">
                <button
                    className={`cds-tb-btn ${!canUndo ? 'cds-tb-btn--disabled' : ''}`}
                    onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={16} />
                </button>
                <button
                    className={`cds-tb-btn ${!canRedo ? 'cds-tb-btn--disabled' : ''}`}
                    onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"
                >
                    <Redo2 size={16} />
                </button>

                <div className="cds-tb-divider" />

                <button className="cds-tb-btn" onClick={zoomOut} title="Zoom Out">
                    <ZoomOut size={16} />
                </button>
                <div className="cds-zoom-display">
                    <span>{zoomPct}%</span>
                </div>
                <button className="cds-tb-btn" onClick={zoomIn} title="Zoom In">
                    <ZoomIn size={16} />
                </button>

                <div className="cds-tb-divider" />


            </div>

            {/* Right Group */}
            <div className="cds-toolbar-group cds-toolbar-right">

                {/* New blank */}
                <button className="cds-tb-btn" onClick={onNew} title="New Blank Canvas">
                    <Plus size={15} />
                    <span>New</span>
                </button>
                {/* 
                <button className="cds-tb-btn" onClick={onImportTemplate} title="Import JSON">
                    <Upload size={15} />
                    <span>Import</span>
                </button>
                <button className="cds-tb-btn" onClick={onExportTemplate} title="Export JSON">
                    <Download size={15} />
                    <span>Export</span>
                </button> */}

                <div className="cds-tb-divider" />

                {/* Template dropdown (Load) */}
                <div className="cds-template-menu-wrap" style={{ position: 'relative' }}>
                    <button
                        className="cds-tb-btn"
                        onClick={() => setTemplateMenuOpen(o => !o)}
                        title="Load Template"
                        disabled={loadingTemplates}
                    >
                        {loadingTemplates
                            ? <Loader2 size={15} className="cds-spin" />
                            : <BookTemplate size={15} />
                        }
                        <span>Templates</span>
                        <ChevronDown size={12} />
                    </button>
                    {templateMenuOpen && (
                        <div className="cds-dropdown" onMouseLeave={closeMenu}>
                            <div className="cds-dropdown-header">Saved Templates</div>
                            {templates.length === 0 && (
                                <div className="cds-dropdown-empty">No templates yet</div>
                            )}
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    className={`cds-dropdown-item ${activeTemplate?.id === t.id ? 'active' : ''}`}
                                    onClick={() => { onLoadTemplate(t.id); closeMenu(); }}
                                >
                                    {t.name || t.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="cds-tb-divider" />

                {/* Save / Save As */}
                <button
                    className="cds-tb-btn cds-tb-btn--primary"
                    onClick={onSave}
                    title={activeTemplate ? 'Update Template (Ctrl+S)' : 'Save Template'}
                    disabled={savingTemplate}
                >
                    {savingTemplate
                        ? <Loader2 size={15} className="cds-spin" />
                        : <Save size={15} />
                    }
                    <span>{activeTemplate ? 'Update' : 'Save'}</span>
                </button>

                {activeTemplate && (
                    <button className="cds-tb-btn" onClick={onSaveAs} title="Save As New Template" disabled={savingTemplate}>
                        <Copy size={14} />
                        <span>Save As</span>
                    </button>
                )}

                {/* Delete active template */}
                {activeTemplate && (
                    <button
                        className="cds-tb-btn cds-tb-btn--danger"
                        onClick={onDeleteTemplate}
                        title="Delete Template"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default CDTopbar;
