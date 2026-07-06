import {
    Image, Type,
    Database, UserSquare, Calendar, Monitor, Hash,
    Building2, FileText, ChevronDown, ChevronRight, Plus, Loader2
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { uploadImage } from '../../utils/templateApi';

const CD_SIZE = 360;

/**
 * DICOM placeholder fields — names match the backend spec exactly.
 * The backend replaces {{PatientName}} etc. during label generation.
 */
const DICOM_FIELDS = [
    { label: 'Patient Name',      icon: UserSquare, color: '#5fa6ff', preset: { content: '{{PatientName}}',      name: 'Patient Name'      } },
    { label: 'Patient ID',        icon: Hash,       color: '#5fa6ff', preset: { content: '{{PatientId}}',        name: 'Patient ID'        } },
    { label: 'Study Date',        icon: Calendar,   color: '#5fa6ff', preset: { content: '{{StudyDate}}',        name: 'Study Date'        } },
    { label: 'Modality',          icon: Monitor,    color: '#5fa6ff', preset: { content: '{{Modality}}',         name: 'Modality'          } },
    { label: 'Accession No.',     icon: Hash,       color: '#5fa6ff', preset: { content: '{{AccessionNumber}}',  name: 'Accession Number'  } },
    { label: 'Study Description', icon: FileText,   color: '#5fa6ff', preset: { content: '{{StudyDescription}}', name: 'Study Description' } },
    { label: 'Study Instance UID',icon: Database,   color: '#5fa6ff', preset: { content: '{{StudyInstanceUID}}', name: 'Study Instance UID'} },
];

const DEFAULT_ELEMENT_PROPS = {
    x: 150, y: 150, rotation: 0, opacity: 1,
    locked: false, visible: true,
};

const TYPE_DEFAULTS = {
    label:   { width: 200, content: 'Label Text', fontFamily: 'Arial', fontSize: 14, fontWeight: '500', color: '#222222', textAlign: 'center', letterSpacing: 0, lineHeight: 1.4 },
    dynamic: { width: 200, content: '{{PatientName}}', fontFamily: 'Arial', fontSize: 14, fontWeight: '500', color: '#222222', textAlign: 'center', letterSpacing: 0, lineHeight: 1.4 },
    image:   { width: 120, height: 120, src: '', source: '', borderRadius: 0, objectFit: 'contain' },
};

function CDElementsSidebar({ onAddElement }) {
    const [expanded, setExpanded] = useState({ images: true, text: true });
    const [showDicomFields, setShowDicomFields] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    /**
     * Upload image to backend → get back a relative path → add to canvas.
     * Falls back to base64 local preview if the API call fails.
     */
    const openFilePicker = (item) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const isBackground = item.subtype === 'background';

            // ── Measure natural dimensions using a local URL ──────────────────
            const localUrl = URL.createObjectURL(file);
            const img = await new Promise((resolve) => {
                const i = new window.Image();
                i.onload = () => resolve(i);
                i.onerror = () => resolve(null);
                i.src = localUrl;
            });

            let w = img ? img.width : 120;
            let h = img ? img.height : 120;
            if (isBackground) {
                const coverRatio = Math.max(CD_SIZE / w, CD_SIZE / h);
                w = Math.round(w * coverRatio);
                h = Math.round(h * coverRatio);
            } else {
                const maxDim = 140;
                if (w > maxDim || h > maxDim) {
                    const ratio = Math.min(maxDim / w, maxDim / h);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                }
            }

            // ── Upload to backend API ─────────────────────────────────────────
            setUploadingImage(true);
            let imagePath = localUrl; // fallback: use local blob URL for canvas preview

            try {
                const result = await uploadImage(file);
                // Backend returns { path: '/assets/logo.png' } or similar
                imagePath = result?.path || result?.url || result?.filePath || localUrl;
                toast.success('Image uploaded to server.');
            } catch (err) {
                console.warn('Image upload API failed, using local preview:', err.message);
                toast.warning('Image upload failed — showing local preview only.');
                // Still allow placement with base64 fallback via local URL
            } finally {
                setUploadingImage(false);
            }

            onAddElement({
                type: 'image',
                subtype: isBackground ? 'background' : 'custom',
                name: isBackground ? 'Background Image' : (file.name.replace(/\.[^.]+$/, '') || 'Image'),
                ...DEFAULT_ELEMENT_PROPS,
                ...TYPE_DEFAULTS.image,
                x: Math.round((CD_SIZE - w) / 2),
                y: Math.round((CD_SIZE - h) / 2),
                width: w,
                height: h,
                naturalWidth: img?.width,
                naturalHeight: img?.height,
                src: imagePath,       // used by canvas for display
                source: imagePath,    // stored in template JSON (relative path from backend)
                objectFit: isBackground ? 'fill' : 'contain',
                locked: false,
                zIndex: isBackground ? 0 : undefined,
            });

            URL.revokeObjectURL(localUrl);
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
                {uploadingImage && <Loader2 size={13} className="cds-spin" style={{ color: 'var(--cds-accent)' }} />}
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
                            {/* Background Image */}
                            <button
                                className="cds-element-item"
                                onClick={() => openFilePicker({ type: 'image', subtype: 'background' })}
                                title="Add Background Image — uploads to /assets/"
                                disabled={uploadingImage}
                            >
                                <span className="cds-element-icon-wrap" style={{ '--icon-color': '#5fa6ff' }}>
                                    <Image size={14} />
                                </span>
                                <span className="cds-element-label">Background Image</span>
                                <Plus size={12} className="cds-element-add" />
                            </button>

                            {/* Logo / Custom Image */}
                            <button
                                className="cds-element-item"
                                onClick={() => openFilePicker({ type: 'image', subtype: 'custom' })}
                                title="Add Logo/Image — uploads to /assets/"
                                disabled={uploadingImage}
                            >
                                <span className="cds-element-icon-wrap" style={{ '--icon-color': '#34d399' }}>
                                    <Image size={14} />
                                </span>
                                <span className="cds-element-label">Logo / Image</span>
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
                            {/* Custom Static Label */}
                            <button
                                className="cds-element-item"
                                onClick={addCustomText}
                                title="Add Static Text"
                            >
                                <span className="cds-element-icon-wrap" style={{ '--icon-color': '#fbbf24' }}>
                                    <Type size={14} />
                                </span>
                                <span className="cds-element-label">Custom Label</span>
                                <Plus size={12} className="cds-element-add" />
                            </button>

                            {/* Dynamic DICOM Placeholder — expand to sub-fields */}
                            <button
                                className="cds-element-item"
                                onClick={() => setShowDicomFields(v => !v)}
                                title="Dynamic DICOM Placeholder"
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

                            {/* DICOM sub-list */}
                            {showDicomFields && (
                                <div className="cds-dicom-sub-list">
                                    {DICOM_FIELDS.map((field) => {
                                        const FieldIcon = field.icon;
                                        return (
                                            <button
                                                key={field.label}
                                                className="cds-element-item cds-element-item--sub"
                                                onClick={() => addDynamicField(field)}
                                                title={`Insert ${field.preset.content}`}
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
