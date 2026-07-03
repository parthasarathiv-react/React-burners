import { useState } from 'react';
import {
    Eye, EyeOff, Lock, Unlock, Trash2, GripVertical,
    ChevronUp, ChevronDown, Edit3, Check, X
} from 'lucide-react';

const TYPE_ICON_COLOR = {
    label: '#fbbf24',
    text: '#fbbf24',
    dynamic: '#f472b6',
    rectangle: '#6ee7b7',
    circle: '#93c5fd',
    line: '#fca5a5',
    image: '#5fa6ff',
    qrcode: '#c4b5fd',
    barcode: '#fdba74',
};

function CDLayersPanel({ elements, selectedIds, onSelect, onUpdate }) {
    const [renamingId, setRenamingId] = useState(null);
    const [renameVal, setRenameVal] = useState('');

    // Sort descending (top layer first)
    const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

    const toggleVisible = (id) => {
        const newEls = elements.map(e => e.id === id ? { ...e, visible: !e.visible } : e);
        onUpdate(newEls);
    };
    const toggleLock = (id) => {
        const newEls = elements.map(e => e.id === id ? { ...e, locked: !e.locked } : e);
        onUpdate(newEls);
    };
    const deleteLayer = (id) => {
        const newEls = elements.filter(e => e.id !== id);
        onUpdate(newEls);
    };
    const moveUp = (id) => {
        const el = elements.find(e => e.id === id);
        if (!el) return;
        const newEls = elements.map(e => e.id === id ? { ...e, zIndex: e.zIndex + 1 } : e);
        onUpdate(newEls);
    };
    const moveDown = (id) => {
        const el = elements.find(e => e.id === id);
        if (!el) return;
        const newEls = elements.map(e => e.id === id ? { ...e, zIndex: Math.max(0, e.zIndex - 1) } : e);
        onUpdate(newEls);
    };
    const startRename = (el) => {
        setRenamingId(el.id);
        setRenameVal(el.name);
    };
    const commitRename = () => {
        if (!renamingId) return;
        const newEls = elements.map(e => e.id === renamingId ? { ...e, name: renameVal } : e);
        onUpdate(newEls);
        setRenamingId(null);
    };

    return (
        <div className="cds-layers">
            <div className="cds-panel-header">
                <span className="cds-panel-title">Layers</span>
                <span className="cds-layer-count">{elements.length}</span>
            </div>

            <div className="cds-layers-list custom-scrollbar">
                {sorted.map((el) => {
                    const isSelected = selectedIds.includes(el.id);
                    const color = TYPE_ICON_COLOR[el.type] || '#a7bedf';
                    const isRenaming = renamingId === el.id;

                    return (
                        <div
                            key={el.id}
                            className={`cds-layer-item ${isSelected ? 'cds-layer-selected' : ''} ${!el.visible ? 'cds-layer-hidden' : ''}`}
                            onClick={() => onSelect(el.id)}
                        >
                            {/* Drag grip */}
                            <GripVertical size={13} className="cds-layer-grip" />

                            {/* Type indicator */}
                            <div className="cds-layer-type-dot" style={{ backgroundColor: color }} />

                            {/* Name / Rename input */}
                            <div className="cds-layer-name" onDoubleClick={() => startRename(el)}>
                                {isRenaming ? (
                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                        <input
                                            autoFocus
                                            className="cds-layer-rename-input"
                                            value={renameVal}
                                            onChange={(e) => setRenameVal(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null); }}
                                        />
                                        <button className="cds-layer-action cds-layer-action--ok" onClick={commitRename}><Check size={11} /></button>
                                        <button className="cds-layer-action" onClick={() => setRenamingId(null)}><X size={11} /></button>
                                    </div>
                                ) : (
                                    <span title={el.name}>{el.name}</span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="cds-layer-actions">
                                <button className="cds-layer-action" title="Move Up" onClick={(e) => { e.stopPropagation(); moveUp(el.id); }}>
                                    <ChevronUp size={12} />
                                </button>
                                <button className="cds-layer-action" title="Move Down" onClick={(e) => { e.stopPropagation(); moveDown(el.id); }}>
                                    <ChevronDown size={12} />
                                </button>
                                <button className="cds-layer-action" title="Rename" onClick={(e) => { e.stopPropagation(); startRename(el); }}>
                                    <Edit3 size={12} />
                                </button>
                                <button
                                    className="cds-layer-action"
                                    title={el.visible ? 'Hide' : 'Show'}
                                    onClick={(e) => { e.stopPropagation(); toggleVisible(el.id); }}
                                >
                                    {el.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                                </button>
                                <button
                                    className="cds-layer-action"
                                    title={el.locked ? 'Unlock' : 'Lock'}
                                    onClick={(e) => { e.stopPropagation(); toggleLock(el.id); }}
                                >
                                    {el.locked ? <Lock size={12} className="cds-locked-icon" /> : <Unlock size={12} />}
                                </button>
                                <button
                                    className="cds-layer-action cds-layer-action--danger"
                                    title="Delete"
                                    onClick={(e) => { e.stopPropagation(); deleteLayer(el.id); }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {elements.length === 0 && (
                    <div className="cds-layers-empty">No layers yet. Add elements from the left panel.</div>
                )}
            </div>
        </div>
    );
}

export default CDLayersPanel;
