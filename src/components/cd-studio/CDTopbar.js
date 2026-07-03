import {
    ArrowLeft, Undo2, Redo2, ZoomOut, ZoomIn, Maximize2,
    Grid3X3, Save, BookTemplate, Upload, Download,
    ChevronDown, Disc3
} from 'lucide-react';
import { useState } from 'react';

function CDTopbar({
    onBack, onUndo, onRedo, canUndo, canRedo,
    zoom, onZoomChange,
    onSave, onExportTemplate, onImportTemplate,
    templates, activeTemplate, onLoadTemplate,
}) {
    const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
    const zoomPct = Math.round(zoom * 100);

    const zoomOut = () => onZoomChange(Math.max(0.25, zoom - 0.1));
    const zoomIn = () => onZoomChange(Math.min(3, zoom + 0.1));

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
                        <div className="cds-brand-sub">DICOM Label Editor</div>
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
                <button className="cds-tb-btn" onClick={onImportTemplate} title="Import Template">
                    <Upload size={15} />
                    <span>Import</span>
                </button>
                <button className="cds-tb-btn" onClick={onExportTemplate} title="Export Template">
                    <Download size={15} />
                    <span>Export</span>
                </button>

                <div className="cds-tb-divider" />

                {/* Template menu */}
                <div className="cds-template-menu-wrap" style={{ position: 'relative' }}>
                    <button
                        className="cds-tb-btn"
                        onClick={() => setTemplateMenuOpen(o => !o)}
                        title="Templates"
                    >
                        <BookTemplate size={15} />
                        <span>Templates</span>
                        <ChevronDown size={12} />
                    </button>
                    {templateMenuOpen && (
                        <div className="cds-dropdown" onMouseLeave={() => setTemplateMenuOpen(false)}>
                            <div className="cds-dropdown-header">Templates</div>
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    className={`cds-dropdown-item ${t.id === activeTemplate ? 'active' : ''}`}
                                    onClick={() => { onLoadTemplate(t.id); setTemplateMenuOpen(false); }}
                                >
                                    {t.name}
                                    {t.isDefault && <span className="cds-dropdown-badge">Default</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button className="cds-tb-btn cds-tb-btn--primary" onClick={onSave} title="Save as Template">
                    <Save size={15} />
                    <span>Save</span>
                </button>
            </div>
        </div>
    );
}

export default CDTopbar;
