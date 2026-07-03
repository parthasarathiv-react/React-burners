import {
    Image, Type,
    Database, UserSquare, Calendar, Clock, Monitor, Hash,
    Building2, Stethoscope, FileText, ChevronDown, ChevronRight, Plus
} from 'lucide-react';
import { useState } from 'react';

const CD_SIZE = 360;

const DICOM_FIELDS = [
    { label: 'Patient Name', icon: UserSquare, color: '#5fa6ff', preset: { content: '{{patientName}}', name: 'Patient Name' } },
    { label: 'Patient ID', icon: Hash, color: '#5fa6ff', preset: { content: '{{patientId}}', name: 'Patient ID' } },
    { label: 'Study Date', icon: Calendar, color: '#5fa6ff', preset: { content: '{{studyDate}}', name: 'Study Date' } },
    { label: 'Study Time', icon: Clock, color: '#5fa6ff', preset: { content: '{{studyTime}}', name: 'Study Time' } },
    { label: 'Modality', icon: Monitor, color: '#5fa6ff', preset: { content: '{{modality}}', name: 'Modality' } },
    { label: 'Accession No.', icon: Hash, color: '#5fa6ff', preset: { content: '{{accessionNumber}}', name: 'Accession Number' } },
    { label: 'Hospital Name', icon: Building2, color: '#5fa6ff', preset: { content: '{{hospitalName}}', name: 'Hospital Name' } },
    { label: 'Referring Doctor', icon: Stethoscope, color: '#5fa6ff', preset: { content: '{{referringDoctor}}', name: 'Referring Doctor' } },
    { label: 'Study Description', icon: FileText, color: '#5fa6ff', preset: { content: '{{studyDescription}}', name: 'Study Description' } },
];

const DEFAULT_ELEMENT_PROPS = {
    x: 150, y: 150, rotation: 0, opacity: 1,
    locked: false, visible: true,
};

const TYPE_DEFAULTS = {
    label: { width: 200, content: 'Label', fontFamily: 'Bai Jamjuree', fontSize: 14, fontWeight: '500', color: '#222222', textAlign: 'center', letterSpacing: 0, lineHeight: 1.4 },
    dynamic: { width: 200, content: '{{patientName}}', fontFamily: 'Bai Jamjuree', fontSize: 14, fontWeight: '500', color: '#222222', textAlign: 'center', letterSpacing: 0, lineHeight: 1.4 },
    image: { width: 120, height: 120, src: '', borderRadius: 0, objectFit: 'contain' },
};

function CDElementsSidebar({ onAddElement }) {
    const [expanded, setExpanded] = useState({ images: true, text: true });
    const [showDicomFields, setShowDicomFields] = useState(false);

    const openFilePicker = (item) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const isBackground = item.subtype === 'background';
                const img = new window.Image();
                img.onload = () => {
                    const maxDim = 140;
                    let w = img.width;
                    let h = img.height;
                    if (isBackground) {
                        const coverRatio = Math.max(CD_SIZE / w, CD_SIZE / h);
                        w = Math.round(w * coverRatio);
                        h = Math.round(h * coverRatio);
                    } else if (w > maxDim || h > maxDim) {
                        const ratio = Math.min(maxDim / w, maxDim / h);
                        w = Math.round(w * ratio);
                        h = Math.round(h * ratio);
                    }
                    onAddElement({
                        type: 'image',
                        subtype: isBackground ? 'background' : 'custom',
                        name: isBackground ? 'Background Image' : file.name.replace(/\.[^.]+$/, '') || 'Image',
                        ...DEFAULT_ELEMENT_PROPS,
                        ...TYPE_DEFAULTS.image,
                        x: Math.round((CD_SIZE - w) / 2),
                        y: Math.round((CD_SIZE - h) / 2),
                        width: w,
                        height: h,
                        naturalWidth: img.width,
                        naturalHeight: img.height,
                        src: ev.target.result,
                        borderRadius: 0,
                        objectFit: isBackground ? 'fill' : 'contain',
                        locked: false,
                        zIndex: isBackground ? 0 : undefined,
                    });
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const addDynamicField = (field) => {
        onAddElement({
            type: 'dynamic',
            name: field.preset.name,
            ...DEFAULT_ELEMENT_PROPS,
            ...TYPE_DEFAULTS.dynamic,
            ...field.preset,
            x: 120 + Math.random() * 60,
            y: 120 + Math.random() * 60,
        });
    };

    const addCustomText = () => {
        onAddElement({
            type: 'label',
            name: 'Custom Label',
            ...DEFAULT_ELEMENT_PROPS,
            ...TYPE_DEFAULTS.label,
            x: 120 + Math.random() * 60,
            y: 120 + Math.random() * 60,
        });
    };

    return (
        <aside className="cds-left-panel custom-scrollbar">
            <div className="cds-panel-header">
                <span className="cds-panel-title">Elements</span>
            </div>

            <div className="cds-elements-list">
                {/* ─── IMAGES ─── */}
                <div className="cds-section">
                    <button
                        className="cds-section-header"
                        onClick={() => setExpanded(e => ({ ...e, images: !e.images }))}
                    >
                        <div className="cds-section-header-left">
                            <Image size={14} />
                            <span>Images</span>
                        </div>
                        {expanded.images ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                    {expanded.images && (
                        <div className="cds-section-items">
                            <button
                                className="cds-element-item"
                                onClick={() => openFilePicker({ type: 'image', subtype: 'background' })}
                                title="Add Background Image"
                            >
                                <span className="cds-element-icon-wrap" style={{ '--icon-color': '#5fa6ff' }}>
                                    <Image size={14} />
                                </span>
                                <span className="cds-element-label">Background Image</span>
                                <Plus size={12} className="cds-element-add" />
                            </button>
                            <button
                                className="cds-element-item"
                                onClick={() => openFilePicker({ type: 'image', subtype: 'custom' })}
                                title="Add Image"
                            >
                                <span className="cds-element-icon-wrap" style={{ '--icon-color': '#34d399' }}>
                                    <Image size={14} />
                                </span>
                                <span className="cds-element-label">Image</span>
                                <Plus size={12} className="cds-element-add" />
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── TEXT ─── */}
                <div className="cds-section">
                    <button
                        className="cds-section-header"
                        onClick={() => setExpanded(e => ({ ...e, text: !e.text }))}
                    >
                        <div className="cds-section-header-left">
                            <Type size={14} />
                            <span>Labels</span>
                        </div>
                        {expanded.text ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                    {expanded.text && (
                        <div className="cds-section-items">
                            {/* Custom Label */}
                            <button
                                className="cds-element-item"
                                onClick={addCustomText}
                                title="Add Custom Label"
                            >
                                <span className="cds-element-icon-wrap" style={{ '--icon-color': '#fbbf24' }}>
                                    <Type size={14} />
                                </span>
                                <span className="cds-element-label">Custom Label</span>
                                <Plus size={12} className="cds-element-add" />
                            </button>

                            {/* Dynamic Label — click to expand DICOM fields */}
                            <button
                                className="cds-element-item"
                                onClick={() => setShowDicomFields(v => !v)}
                                title="Dynamic Label - click to see DICOM fields"
                            >
                                <span className="cds-element-icon-wrap" style={{ '--icon-color': '#f472b6' }}>
                                    <Database size={14} />
                                </span>
                                <span className="cds-element-label">Dynamic Label</span>
                                <ChevronDown
                                    size={12}
                                    className="cds-element-add"
                                    style={{
                                        transform: showDicomFields ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s',
                                        opacity: 1,
                                        color: 'var(--cds-text-muted)',
                                    }}
                                />
                            </button>

                            {/* DICOM Fields sub-list */}
                            {showDicomFields && (
                                <div className="cds-dicom-sub-list">
                                    {DICOM_FIELDS.map((field) => {
                                        const FieldIcon = field.icon;
                                        return (
                                            <button
                                                key={field.label}
                                                className="cds-element-item cds-element-item--sub"
                                                onClick={() => addDynamicField(field)}
                                                title={`Add ${field.label}`}
                                            >
                                                <span className="cds-element-icon-wrap cds-element-icon-wrap--sm" style={{ '--icon-color': field.color }}>
                                                    <FieldIcon size={12} />
                                                </span>
                                                <span className="cds-element-label">{field.label}</span>
                                                <Plus size={11} className="cds-element-add" />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </aside>
    );
}

export default CDElementsSidebar;
