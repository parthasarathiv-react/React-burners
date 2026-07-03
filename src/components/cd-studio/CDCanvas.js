import { useRef, useState, useCallback, useEffect } from 'react';
import { resolveDicomPlaceholders } from './CDDesignStudio';
import { Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const CD_SIZE = 360;       // px — outer diameter on canvas

function CDCanvas({
    elements, selectedIds, onSelect, onUpdateElements,
    zoom, onZoomChange, showGrid, dicomData, discConfig,
    onDuplicate, onDelete, onBringForward, onSendBackward,
}) {
    const workspaceRef = useRef(null);
    const canvasRef = useRef(null);
    const [dragging, setDragging] = useState(null); // { id, startX, startY, origX, origY }
    const [resizing, setResizing] = useState(null);
    const [rotating, setRotating] = useState(null);
    // New state for rotating text path directly
    const [arcRotating, setArcRotating] = useState(null); // { id, startAngle, origAngle }

    const [contextMenu, setContextMenu] = useState(null);
    const [alignGuides, setAlignGuides] = useState([]);
    const [snapEnabled] = useState(true);
    const [backgroundEditId, setBackgroundEditId] = useState(null);

    const SNAP_THRESHOLD = 8;
    const CENTER_X = CD_SIZE / 2;
    const CENTER_Y = CD_SIZE / 2;

    // Map mm to px relative to the outer edge
    const pxPerMm = (CD_SIZE / 2) / (discConfig?.outerRadius || 60);
    const hubR = (discConfig?.innerRadius || 11) * pxPerMm;

    // Sort by zIndex for rendering
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

    const getCanvasPoint = useCallback((clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) / zoom,
            y: (clientY - rect.top) / zoom,
        };
    }, [zoom]);

    const snapToGuides = useCallback((x, y, elWidth) => {
        const guides = [];
        let snappedX = x;
        let snappedY = y;

        if (snapEnabled) {
            const elCenterX = x + (elWidth || 0) / 2;
            const distToCenter = Math.abs(elCenterX - CENTER_X);
            if (distToCenter < SNAP_THRESHOLD) {
                snappedX = CENTER_X - (elWidth || 0) / 2;
                guides.push({ type: 'v', pos: CENTER_X });
            }
            const distToCenterY = Math.abs(y - CENTER_Y);
            if (distToCenterY < SNAP_THRESHOLD) {
                snappedY = CENTER_Y;
                guides.push({ type: 'h', pos: CENTER_Y });
            }
        }
        return { x: snappedX, y: snappedY, guides };
    }, [snapEnabled, CENTER_X, CENTER_Y]);

    // --- Mouse Handlers ---
    const handleMouseDown = useCallback((e, elId) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const el = elements.find(el => el.id === elId);
        if (!el || el.locked) return;

        onSelect(e.shiftKey ? [...selectedIds, elId].filter((v, i, a) => a.indexOf(v) === i) : [elId]);

        // If it's an arc mode text, drag rotates the angle instead of x/y
        if (el.arcMode) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            // center of CD
            const cx = rect.left + (CD_SIZE / 2) * zoom;
            const cy = rect.top + (CD_SIZE / 2) * zoom;
            const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
            setArcRotating({ id: elId, startAngle: angle, origAngle: el.arcAngle || 0 });
            e.preventDefault();
            return;
        }

        const pt = getCanvasPoint(e.clientX, e.clientY);
        setDragging({ id: elId, startX: pt.x, startY: pt.y, origX: el.x, origY: el.y });
        e.preventDefault();
    }, [elements, selectedIds, onSelect, getCanvasPoint, zoom]);

    const handleMouseMove = useCallback((e) => {
        if (arcRotating) {
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const cx = rect.left + (CD_SIZE / 2) * zoom;
            const cy = rect.top + (CD_SIZE / 2) * zoom;
            const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
            let diff = currentAngle - arcRotating.startAngle;
            let newAngle = arcRotating.origAngle + diff;

            // Normalize to 0-360
            while (newAngle < 0) newAngle += 360;
            while (newAngle >= 360) newAngle -= 360;

            const newElements = elements.map(el =>
                el.id === arcRotating.id ? { ...el, arcAngle: Math.round(newAngle) } : el
            );
            onUpdateElements(newElements);
        }
        if (dragging) {
            const pt = getCanvasPoint(e.clientX, e.clientY);
            const dx = pt.x - dragging.startX;
            const dy = pt.y - dragging.startY;
            const rawX = dragging.origX + dx;
            const rawY = dragging.origY + dy;
            const el = elements.find(el => el.id === dragging.id);
            const { x, y, guides } = snapToGuides(rawX, rawY, el?.width);
            setAlignGuides(guides);

            const newElements = elements.map(el =>
                el.id === dragging.id ? { ...el, x, y } : el
            );
            onUpdateElements(newElements);
        }
        if (resizing) {
            const pt = getCanvasPoint(e.clientX, e.clientY);
            const el = elements.find(el => el.id === resizing.id);
            if (!el) return;
            const dx = pt.x - resizing.startX;
            const dy = pt.y - resizing.startY;
            const dir = resizing.dir || 'se';
            const minW = 20;
            const minH = 20;
            let x = resizing.origX;
            let y = resizing.origY;
            let newW = resizing.origW;
            let newH = resizing.origH;

            if (dir.includes('e')) {
                newW = Math.max(minW, resizing.origW + dx);
            }
            if (dir.includes('s')) {
                newH = Math.max(minH, resizing.origH + dy);
            }
            if (dir.includes('w')) {
                newW = Math.max(minW, resizing.origW - dx);
                x = resizing.origX + (resizing.origW - newW);
            }
            if (dir.includes('n')) {
                newH = Math.max(minH, resizing.origH - dy);
                y = resizing.origY + (resizing.origH - newH);
            }

            const newElements = elements.map(el =>
                el.id === resizing.id ? { ...el, x, y, width: newW, height: el.height !== undefined ? newH : el.height } : el
            );
            onUpdateElements(newElements);
        }
        if (rotating) {
            const el = elements.find(el => el.id === rotating.id);
            if (!el) return;
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const elCX = (el.x + (el.width || 0) / 2) * zoom + rect.left;
            const elCY = (el.y + 10) * zoom + rect.top;
            const angle = Math.atan2(e.clientY - elCY, e.clientX - elCX) * (180 / Math.PI) + 90;
            const newElements = elements.map(el =>
                el.id === rotating.id ? { ...el, rotation: angle } : el
            );
            onUpdateElements(newElements);
        }
    }, [dragging, arcRotating, resizing, rotating, elements, getCanvasPoint, snapToGuides, onUpdateElements, zoom]);

    const handleMouseUp = useCallback(() => {
        setDragging(null);
        setResizing(null);
        setRotating(null);
        setArcRotating(null);
        setAlignGuides([]);
    }, []);

    const handleCanvasClick = useCallback((e) => {
        if (e.target === canvasRef.current || e.target === workspaceRef.current) {
            onSelect([]);
            setBackgroundEditId(null);
        }
        setContextMenu(null);
    }, [onSelect]);

    const handleWheel = useCallback((e) => {
        if (!onZoomChange) return;
        e.preventDefault();
        const step = e.deltaY > 0 ? -0.08 : 0.08;
        onZoomChange(Math.min(3, Math.max(0.25, Number((zoom + step).toFixed(2)))));
    }, [onZoomChange, zoom]);

    const handleContextMenu = useCallback((e, elId) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect([elId]);
        setContextMenu({ x: e.clientX, y: e.clientY, elId });
    }, [onSelect]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // --- Render Elements ---
    const renderElement = (el) => {
        const isSelected = selectedIds.includes(el.id);
        const isLocked = el.locked;
        if (!el.visible) return null;

        const commonStyle = {
            position: 'absolute',
            left: el.x,
            top: el.y,
            opacity: el.opacity,
            transform: `rotate(${el.rotation || 0}deg)`,
            transformOrigin: `${(el.width || 0) / 2}px center`,
            cursor: isLocked ? 'default' : 'move',
            userSelect: 'none',
            zIndex: el.zIndex,
        };

        let content = null;

        const isLabel = el.type === 'label' || el.type === 'text' || el.type === 'dynamic' || el.type === 'media-label';

        if (isLabel) {
            const displayText = el.type === 'dynamic'
                ? resolveDicomPlaceholders(el.content, dicomData)
                : el.content;

            // Arc/circle mode — render text along a circular path
            if (el.arcMode) {
                const arcR = el.arcRadius || 120;
                // Center of arc is CD center (180, 180)
                const pathId = `arc-path-${el.id}`;
                // Arc: text curved along circle at arcRadius from cd center
                // Start angle offset so text is centered at arcAngle
                const startAngle = (el.arcAngle || 0) - 90;
                const endAngle = (el.arcAngle || 0) + 90;
                const toRad = (deg) => (deg - 90) * (Math.PI / 180);
                const sx = 180 + arcR * Math.cos(toRad(startAngle));
                const sy = 180 + arcR * Math.sin(toRad(startAngle));
                const ex = 180 + arcR * Math.cos(toRad(endAngle));
                const ey = 180 + arcR * Math.sin(toRad(endAngle));
                const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

                content = (
                    <svg
                        key={el.id}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: CD_SIZE,
                            height: CD_SIZE,
                            pointerEvents: 'none', // SVG itself shouldn't block clicks
                            zIndex: el.zIndex,
                            overflow: 'visible',
                        }}
                    >
                        <defs>
                            <path
                                id={pathId}
                                d={`M ${sx} ${sy} A ${arcR} ${arcR} 0 ${largeArc} 1 ${ex} ${ey}`}
                            />
                        </defs>
                        <text
                            style={{
                                cursor: isLocked ? 'default' : 'move',
                                userSelect: 'none',
                                pointerEvents: 'all' // Enable click on text itself
                            }}
                            fontFamily={el.fontFamily || 'Bai Jamjuree'}
                            fontSize={el.fontSize || 14}
                            fontWeight={el.fontWeight || '400'}
                            fill={el.color || '#000000'}
                            letterSpacing={el.letterSpacing || 0}
                            opacity={el.opacity ?? 1}
                            onMouseDown={(e) => handleMouseDown(e, el.id)}
                            onContextMenu={(e) => handleContextMenu(e, el.id)}
                        >
                            <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
                                {displayText}
                            </textPath>
                        </text>
                        {isSelected && !isLocked && (
                            // Simple highlight for circular text
                            <circle
                                cx={180} cy={180} r={arcR}
                                fill="none" stroke="#5fa6ff" strokeWidth={1} strokeDasharray="4 4"
                                opacity={0.5}
                            />
                        )}
                    </svg>
                );
            } else {
                content = (
                    <div
                        className={`cds-label-element ${isSelected ? 'cds-label-element--selected' : ''}`}
                        style={{
                            ...commonStyle,
                            width: el.width,
                            fontFamily: el.fontFamily || 'Bai Jamjuree',
                            fontSize: el.fontSize || 14,
                            fontWeight: el.fontWeight || '400',
                            color: el.color || '#000000',
                            textAlign: el.textAlign || 'center',
                            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                            lineHeight: el.lineHeight || 1.4,
                            backgroundColor: el.bgColor || undefined,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'all'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, el.id)}
                        onContextMenu={(e) => handleContextMenu(e, el.id)}
                    >
                        {displayText}
                    </div>
                );
            }
        } else if (el.type === 'image') {
            const isBackground = el.subtype === 'background';
            const isEditingBackground = isBackground && backgroundEditId === el.id;
            content = (
                <div style={{
                    ...commonStyle,
                    width: el.width,
                    height: el.height,
                    borderRadius: el.borderRadius || 0,
                    overflow: 'hidden',
                    boxShadow: el.shadow || undefined,
                    background: el.src ? undefined : 'rgba(95,166,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'all',
                }}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onDoubleClick={(e) => {
                        if (!isBackground) return;
                        e.stopPropagation();
                        onSelect([el.id]);
                        setBackgroundEditId(currentId => currentId === el.id ? null : el.id);
                    }}
                    onContextMenu={(e) => handleContextMenu(e, el.id)}
                >
                    {el.src
                        ? <img
                            src={el.src}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: isBackground ? 'fill' : (el.objectFit || 'contain'),
                            }}
                        />
                        : <span style={{ color: 'rgba(95,166,255,0.5)', fontSize: 11, textAlign: 'center', padding: 4 }}>
                            Image
                        </span>
                    }
                    {isEditingBackground && (
                        <div className="cds-bg-edit-pill">Move background</div>
                    )}
                    {isSelected && !isLocked && renderHandles(el)}
                </div>
            );
        }

        return <div key={el.id}>{content}</div>;
    };

    const renderHandles = (el) => {
        const w = el.width || 0;
        const h = el.height || 0;
        const startResize = (e, dir) => {
            e.stopPropagation();
            const pt = getCanvasPoint(e.clientX, e.clientY);
            setResizing({
                id: el.id,
                dir,
                startX: pt.x,
                startY: pt.y,
                origX: el.x,
                origY: el.y,
                origW: el.width || 0,
                origH: el.height || 0,
            });
        };

        return (
            <div className="cds-selection" style={{ width: w, height: Math.max(h, 1) }}>
                <div className="cds-handle cds-handle-n" onMouseDown={(e) => startResize(e, 'n')} />
                <div className="cds-handle cds-handle-s" onMouseDown={(e) => startResize(e, 's')} />
                <div className="cds-handle cds-handle-e" onMouseDown={(e) => startResize(e, 'e')} />
                <div className="cds-handle cds-handle-w" onMouseDown={(e) => startResize(e, 'w')} />
                <div className="cds-handle cds-handle-se" onMouseDown={(e) => startResize(e, 'se')} />
                <div className="cds-handle cds-handle-sw" onMouseDown={(e) => startResize(e, 'sw')} />
                <div className="cds-handle cds-handle-ne" onMouseDown={(e) => startResize(e, 'ne')} />
                <div className="cds-handle cds-handle-nw" onMouseDown={(e) => startResize(e, 'nw')} />
                {/* Rotate handle */}
                <div
                    className="cds-rotate-handle"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        setRotating({ id: el.id });
                    }}
                    title="Rotate"
                />
            </div>
        );
    };

    const editingBackground = sortedElements.find(el =>
        el.id === backgroundEditId && el.type === 'image' && el.subtype === 'background' && el.visible && el.src
    );

    return (
        <div
            ref={workspaceRef}
            className="cds-workspace"
            onClick={handleCanvasClick}
            onWheel={handleWheel}
        >
            {/* Canvas wrapper */}
            <div
                className="cds-canvas-wrap"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            >
                {editingBackground && (
                    <div
                        className="cds-bg-edit-preview"
                        style={{
                            left: editingBackground.x,
                            top: editingBackground.y,
                            width: editingBackground.width,
                            height: editingBackground.height,
                            transform: `rotate(${editingBackground.rotation || 0}deg)`,
                            opacity: Math.min(0.45, Math.max(0.18, editingBackground.opacity ?? 1)),
                            zIndex: 0,
                        }}
                    >
                        <img src={editingBackground.src} alt="" />
                    </div>
                )}


                {/* Main canvas */}
                <div
                    ref={canvasRef}
                    className="cds-canvas"
                    style={{
                        width: CD_SIZE, height: CD_SIZE, position: 'relative',
                        background: '#ffffff', borderRadius: '50%',
                        zIndex: 1,
                        // Fix for overflow cutting off content behind hub
                        isolation: 'isolate'
                    }}
                >
                    {/* Elements (Background images render first because of zIndex sort) */}
                    {sortedElements.map(el => renderElement(el))}


                    {/* CD Overlay guides — exactly matches the CD look */}
                    <svg
                        style={{ position: 'absolute', inset: 0, width: CD_SIZE, height: CD_SIZE, pointerEvents: 'none', zIndex: 9000 }}
                    >
                        {/* Inner hub clipping/ring - solid so elements don't show inside the hole */}
                        <circle cx={CD_SIZE / 2} cy={CD_SIZE / 2} r={hubR}
                            fill="#f0f0f4" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />

                        {/* Center hole */}
                        <circle cx={CD_SIZE / 2} cy={CD_SIZE / 2} r={8}
                            fill="#ffffff" stroke="rgba(0,0,0,0.2)" strokeWidth="1"
                            style={{ mixBlendMode: 'normal', opacity: 1, filter: 'drop-shadow(inset 0px 1px 3px rgba(0,0,0,0.3))' }}
                        />

                        {/* Alignment guides (snap feedback) */}
                        {alignGuides.map((g, i) => g.type === 'v'
                            ? <line key={i} x1={g.pos} y1={0} x2={g.pos} y2={CD_SIZE} stroke="rgba(0,120,255,0.5)" strokeWidth="1" strokeDasharray="4 2" />
                            : <line key={i} x1={0} y1={g.pos} x2={CD_SIZE} y2={g.pos} stroke="rgba(0,120,255,0.5)" strokeWidth="1" strokeDasharray="4 2" />
                        )}
                    </svg>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="cds-context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onMouseLeave={() => setContextMenu(null)}
                >
                    <button className="cds-ctx-item" onClick={() => { onDuplicate(); setContextMenu(null); }}>
                        <Copy size={13} /> Duplicate
                    </button>
                    <button className="cds-ctx-item" onClick={() => { onBringForward(); setContextMenu(null); }}>
                        <ArrowUp size={13} /> Bring Forward
                    </button>
                    <button className="cds-ctx-item" onClick={() => { onSendBackward(); setContextMenu(null); }}>
                        <ArrowDown size={13} /> Send Backward
                    </button>
                    <div className="cds-ctx-divider" />
                    <button className="cds-ctx-item cds-ctx-danger" onClick={() => { onDelete(); setContextMenu(null); }}>
                        <Trash2 size={13} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

export default CDCanvas;
