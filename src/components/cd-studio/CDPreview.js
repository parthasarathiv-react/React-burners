import React from 'react';
import { resolveDicomPlaceholders } from './CDDesignStudio';

const CD_SIZE = 360;

const CDPreview = ({ elements = [], discConfig, dicomData, zoom = 1 }) => {
    const pxPerMm = (CD_SIZE / 2) / (discConfig?.outerRadius || 60);
    const hubR = (discConfig?.innerRadius || 11) * pxPerMm;

    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

    const renderElement = (el) => {
        if (!el.visible) return null;

        const commonStyle = {
            position: 'absolute',
            left: el.x,
            top: el.y,
            opacity: el.opacity,
            transform: `rotate(${el.rotation || 0}deg)`,
            transformOrigin: `${(el.width || 0) / 2}px center`,
            zIndex: el.zIndex,
        };

        const isLabel = el.type === 'label' || el.type === 'text' || el.type === 'dynamic' || el.type === 'media-label';

        if (isLabel) {
            const displayText = el.type === 'dynamic'
                ? resolveDicomPlaceholders(el.content, dicomData)
                : el.content;

            if (el.arcMode) {
                const arcR = el.arcRadius || 120;
                const pathId = `preview-arc-path-${el.id}`;
                const startAngle = (el.arcAngle || 0) - 90;
                const endAngle = (el.arcAngle || 0) + 90;
                const toRad = (deg) => (deg - 90) * (Math.PI / 180);
                const sx = 180 + arcR * Math.cos(toRad(startAngle));
                const sy = 180 + arcR * Math.sin(toRad(startAngle));
                const ex = 180 + arcR * Math.cos(toRad(endAngle));
                const ey = 180 + arcR * Math.sin(toRad(endAngle));

                return (
                    <svg
                        key={el.id}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: CD_SIZE,
                            height: CD_SIZE,
                            zIndex: el.zIndex,
                            overflow: 'visible',
                        }}
                    >
                        <defs>
                            <path
                                id={pathId}
                                d={`M ${sx} ${sy} A ${arcR} ${arcR} 0 0 1 ${ex} ${ey}`}
                            />
                        </defs>
                        <text
                            fontFamily={el.fontFamily || 'Bai Jamjuree'}
                            fontSize={el.fontSize || 14}
                            fontWeight={el.fontWeight || '400'}
                            fill={el.color || '#000000'}
                            letterSpacing={el.letterSpacing || 0}
                            opacity={el.opacity ?? 1}
                        >
                            <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
                                {displayText}
                            </textPath>
                        </text>
                    </svg>
                );
            } else {
                return (
                    <div
                        key={el.id}
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
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {displayText}
                    </div>
                );
            }
        } else if (el.type === 'image') {
            const isBackground = el.subtype === 'background';
            return (
                <div
                    key={el.id}
                    style={{
                        ...commonStyle,
                        width: el.width,
                        height: el.height,
                        borderRadius: el.borderRadius || 0,
                        overflow: 'hidden',
                        boxShadow: el.shadow || undefined,
                    }}
                >
                    {el.src && (
                        <img
                            src={el.src}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: isBackground ? 'fill' : (el.objectFit || 'contain'),
                            }}
                        />
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div
            className="cd-preview-container"
            style={{
                width: CD_SIZE,
                height: CD_SIZE,
                position: 'relative',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left'
            }}
        >
            <div
                style={{
                    width: CD_SIZE, height: CD_SIZE, position: 'relative',
                    background: '#ffffff', borderRadius: '50%',
                    overflow: 'hidden',
                    isolation: 'isolate',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 0 1px rgba(0,0,0,0.5)'
                }}
            >
                {sortedElements.map(el => renderElement(el))}

                {/* Hub/Hole Overlay */}
                <svg
                    style={{ position: 'absolute', inset: 0, width: CD_SIZE, height: CD_SIZE, pointerEvents: 'none', zIndex: 9000 }}
                >
                    <circle cx={CD_SIZE / 2} cy={CD_SIZE / 2} r={hubR}
                        fill="#f0f0f4" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                    <circle cx={CD_SIZE / 2} cy={CD_SIZE / 2} r={8}
                        fill="#ffffff" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
                </svg>
            </div>
        </div>
    );
};

export default CDPreview;
