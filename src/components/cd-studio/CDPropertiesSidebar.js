import { useState } from 'react';
import { ChevronDown, Upload, Trash2, Circle } from 'lucide-react';

const FONT_FAMILIES = ['Bai Jamjuree', 'Inter', 'Roboto', 'Georgia', 'Courier New', 'Arial'];
const FONT_WEIGHTS = ['300', '400', '500', '600', '700', '800'];
const FIT_OPTIONS = [
    { value: 'cover', label: 'Fill (Cover)', desc: 'Fill completely' },
    { value: 'contain', label: 'Fit Inside', desc: 'Fit exactly inside boundary' },
    { value: 'fill', label: 'Stretch', desc: 'Stretch out to edges' },
];

function PanelSection({ label, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="cds-prop-section">
            <button className="cds-prop-section-header" onClick={() => setOpen(o => !o)}>
                <span>{label}</span>
                <ChevronDown size={13} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
            </button>
            {open && <div className="cds-prop-body">{children}</div>}
        </div>
    );
}

function PropRow({ label, children }) {
    return (
        <div className="cds-prop-row">
            <label className="cds-prop-label">{label}</label>
            <div className="cds-prop-control">{children}</div>
        </div>
    );
}

function NumberInput({ value, onChange, min, max, step = 1, suffix }) {
    return (
        <div className="cds-num-input">
            <input
                type="number"
                value={value?.toFixed ? Number(value).toFixed(step < 1 ? 1 : 0) : value}
                min={min} max={max} step={step}
                onChange={(e) => onChange(Number(e.target.value))}
                className="cds-input"
            />
            {suffix && <span className="cds-input-suffix">{suffix}</span>}
        </div>
    );
}

function CDPropertiesSidebar({ element, onUpdate }) {
    if (!element) {
        return (
            <div className="cds-props-empty">
                <div className="cds-props-empty-icon">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 12h6M12 9v6" />
                    </svg>
                </div>
                <p>Select an element to edit its properties</p>
            </div>
        );
    }

    const isText = element.type === 'label' || element.type === 'text' || element.type === 'dynamic' || element.type === 'media-label';
    const isImage = element.type === 'image';
    const isBackground = isImage && element.subtype === 'background';

    return (
        <div className="cds-properties custom-scrollbar">
            <div className="cds-panel-header">
                <span className="cds-panel-title">Properties</span>
                <span className="cds-element-type-badge">{element.type}</span>
            </div>

            {/* Position & Transform */}

            <PanelSection label="Transform">
                <div className="cds-prop-grid-2">
                    <PropRow label="X">
                        <NumberInput value={element.x} onChange={v => onUpdate({ x: v })} />
                    </PropRow>
                    <PropRow label="Y">
                        <NumberInput value={element.y} onChange={v => onUpdate({ y: v })} />
                    </PropRow>
                    {element.width !== undefined && (
                        <PropRow label="W">
                            <NumberInput value={element.width} onChange={v => onUpdate({ width: v })} min={10} />
                        </PropRow>
                    )}
                    {element.height !== undefined && (
                        <PropRow label="H">
                            <NumberInput value={element.height} onChange={v => onUpdate({ height: v })} min={1} />
                        </PropRow>
                    )}
                </div>

                {/* Simple Circle Label Toggle - one-click to enable */}
                {isText && (
                    <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <button
                                onClick={() => onUpdate({ arcMode: !element.arcMode })}
                                className="cds-circle-toggle-btn"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    border: element.arcMode ? '1.5px solid #5fa6ff' : '1.5px solid var(--cds-border)',
                                    background: element.arcMode ? 'rgba(95,166,255,0.12)' : 'var(--cds-input-bg)',
                                    color: element.arcMode ? '#5fa6ff' : 'var(--cds-text-muted)',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Circle size={14} style={{ opacity: element.arcMode ? 1 : 0.5 }} />
                                <span>{element.arcMode ? 'Circle Label ON' : 'Circle Label OFF'}</span>
                            </button>
                        </div>

                        {/* Arc options — only when arcMode is ON */}
                        {element.arcMode && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
                                <PropRow label="Angle">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input
                                            type="range"
                                            className="cds-slider"
                                            min={0} max={360} step={1}
                                            value={element.arcAngle || 0}
                                            onChange={e => onUpdate({ arcAngle: Number(e.target.value) })}
                                        />
                                        <span className="cds-slider-val">{Math.round(element.arcAngle || 0)}°</span>
                                    </div>
                                </PropRow>
                                <PropRow label="Radius">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input
                                            type="range"
                                            className="cds-slider"
                                            min={40} max={170} step={1}
                                            value={element.arcRadius || 120}
                                            onChange={e => onUpdate({ arcRadius: Number(e.target.value) })}
                                        />
                                        <span className="cds-slider-val">{element.arcRadius || 120}px</span>
                                    </div>
                                </PropRow>
                            </div>
                        )}
                    </div>
                )}
            </PanelSection>

            {/* Text Settings */}
            {isText && (
                <PanelSection label="Label">
                    <PropRow label="Value">
                        <textarea
                            className="cds-textarea"
                            value={element.content || ''}
                            onChange={(e) => onUpdate({ content: e.target.value })}
                            rows={2}
                        />
                    </PropRow>

                    <PropRow label="Font">
                        <select className="cds-select" value={element.fontFamily || ''} onChange={(e) => onUpdate({ fontFamily: e.target.value })}>
                            {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </PropRow>

                    <div className="cds-prop-grid-2">
                        <PropRow label="Size">
                            <NumberInput value={element.fontSize || 14} onChange={v => onUpdate({ fontSize: v })} min={6} max={72} suffix="px" />
                        </PropRow>
                        <PropRow label="Weight">
                            <select className="cds-select" value={element.fontWeight || '400'} onChange={(e) => onUpdate({ fontWeight: e.target.value })}>
                                {FONT_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
                            </select>
                        </PropRow>
                    </div>

                    <PropRow label="Color">
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input type="color" value={element.color || '#000000'} onChange={(e) => onUpdate({ color: e.target.value })} className="cds-color-picker" />
                            <input type="text" value={element.color || '#000000'} onChange={(e) => onUpdate({ color: e.target.value })} className="cds-input cds-color-hex" />
                        </div>
                    </PropRow>
                </PanelSection>
            )}

            {/* Background Image Settings */}
            {isBackground && (
                <PanelSection label="Background Image">
                    <div className="cds-image-preview-section">
                        {element.src ? (
                            <div className="cds-image-thumb-wrap">
                                <img src={element.src} alt="Background" className="cds-image-thumb" />
                                <div className="cds-image-thumb-actions">
                                    <button
                                        className="cds-image-action-btn"
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp';
                                            input.onchange = (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = (ev) => onUpdate({ src: ev.target.result });
                                                reader.readAsDataURL(file);
                                            };
                                            input.click();
                                        }}
                                        title="Change Image"
                                    >
                                        <Upload size={12} />
                                        Change
                                    </button>
                                    <button
                                        className="cds-image-action-btn cds-image-action-btn--danger"
                                        onClick={() => onUpdate({ src: '' })}
                                        title="Remove Image"
                                    >
                                        <Trash2 size={12} />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                className="cds-image-browse-btn"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp';
                                    input.onchange = (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (ev) => onUpdate({ src: ev.target.result });
                                        reader.readAsDataURL(file);
                                    };
                                    input.click();
                                }}
                            >
                                <Upload size={16} />
                                <span>Browse File</span>
                                <span className="cds-image-browse-hint">PNG, JPG, SVG, WebP</span>
                            </button>
                        )}
                    </div>

                    {/* Fit Mode */}
                    {/* <PropRow label="Fit Mode">
                        <div className="cds-fit-btns">
                            {FIT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    className={`cds-fit-btn ${(element.objectFit || 'cover') === opt.value ? 'active' : ''}`}
                                    onClick={() => onUpdate({ objectFit: opt.value })}
                                    title={opt.desc}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </PropRow> */}

                </PanelSection>
            )}

            {/* Regular Image Settings */}
            {isImage && !isBackground && (
                <PanelSection label="Image">
                    <div className="cds-image-preview-section">
                        {element.src ? (
                            <div className="cds-image-thumb-wrap">
                                <img src={element.src} alt="Preview" className="cds-image-thumb" />
                                <div className="cds-image-thumb-actions">
                                    <button
                                        className="cds-image-action-btn"
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp';
                                            input.onchange = (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    onUpdate({ src: ev.target.result });
                                                };
                                                reader.readAsDataURL(file);
                                            };
                                            input.click();
                                        }}
                                        title="Change Image"
                                    >
                                        <Upload size={12} />
                                        Change
                                    </button>
                                    <button
                                        className="cds-image-action-btn cds-image-action-btn--danger"
                                        onClick={() => onUpdate({ src: '' })}
                                        title="Remove Image"
                                    >
                                        <Trash2 size={12} />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                className="cds-image-browse-btn"
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/svg+xml,image/webp';
                                    input.onchange = (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            onUpdate({ src: ev.target.result });
                                        };
                                        reader.readAsDataURL(file);
                                    };
                                    input.click();
                                }}
                            >
                                <Upload size={16} />
                                <span>Browse File</span>
                                <span className="cds-image-browse-hint">PNG, JPG, SVG, WebP</span>
                            </button>
                        )}
                    </div>
                </PanelSection>
            )}
        </div>
    );
}

export default CDPropertiesSidebar;
