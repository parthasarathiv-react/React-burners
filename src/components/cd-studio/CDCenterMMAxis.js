import React from 'react';

const CD_SIZE = 360; // 360px = 120mm (3px / mm)
const MM_TOTAL = 120;
const SCALE = CD_SIZE / MM_TOTAL; // 3px per mm
const CENTER = CD_SIZE / 2; // 180px = 60mm

export function CDCenterMMAxis({ showGrid = true }) {
    if (!showGrid) return null;

    const ticks = [];
    for (let m = 0; m <= MM_TOTAL; m++) {
        ticks.push(m);
    }

    return (
        <g className="cd-center-mm-axis" style={{ pointerEvents: 'none' }}>
            <defs>
                <style>{`
                    .cd-axis-line { stroke: #2563eb; stroke-width: 1.5; opacity: 0.85; }
                    .cd-axis-grid-line { stroke: rgba(37, 99, 235, 0.12); stroke-width: 1; stroke-dasharray: 2 2; }
                    .cd-axis-tick-major { stroke: #1d4ed8; stroke-width: 1.5; }
                    .cd-axis-tick-med { stroke: #3b82f6; stroke-width: 1; }
                    .cd-axis-tick-minor { stroke: #60a5fa; stroke-width: 0.5; }
                    .cd-axis-text { font-family: Inter, system-ui, -apple-system, sans-serif; font-size: 8px; font-weight: 600; fill: #1e3a8a; }
                    .cd-axis-text-bg { fill: rgba(255, 255, 255, 0.9); rx: 2; }
                `}</style>
            </defs>

            {/* Subtle 10mm background grid lines */}
            {ticks.filter(m => m % 10 === 0 && m > 0 && m < MM_TOTAL).map(m => {
                const pos = m * SCALE;
                return (
                    <g key={`grid-${m}`}>
                        {/* Horizontal grid line */}
                        {m !== 60 && <line x1={0} y1={pos} x2={CD_SIZE} y2={pos} className="cd-axis-grid-line" />}
                        {/* Vertical grid line */}
                        {m !== 60 && <line x1={pos} y1={0} x2={pos} y2={CD_SIZE} className="cd-axis-grid-line" />}
                    </g>
                );
            })}

            {/* Main Horizontal Center Axis (Left to Right) */}
            <line x1={0} y1={CENTER} x2={CD_SIZE} y2={CENTER} className="cd-axis-line" />

            {/* Main Vertical Center Axis (Top to Bottom) */}
            <line x1={CENTER} y1={0} x2={CENTER} y2={CD_SIZE} className="cd-axis-line" />

            {/* Horizontal Axis Ticks and MM Labels (Left to Right) */}
            {ticks.map(m => {
                const x = m * SCALE;
                const isMajor = m % 10 === 0;
                const isMed = m % 5 === 0 && !isMajor;

                let tickLength = isMajor ? 6 : (isMed ? 4 : 2);
                let tickClass = isMajor ? "cd-axis-tick-major" : (isMed ? "cd-axis-tick-med" : "cd-axis-tick-minor");

                return (
                    <g key={`h-tick-${m}`}>
                        <line
                            x1={x}
                            y1={CENTER - tickLength}
                            x2={x}
                            y2={CENTER + tickLength}
                            className={tickClass}
                        />
                        {isMajor && (
                            <g transform={`translate(${x}, ${CENTER + 13})`}>
                                <rect x="-10" y="-6" width="20" height="9" className="cd-axis-text-bg" />
                                <text x="0" y="0" className="cd-axis-text" textAnchor="middle" dominantBaseline="middle">
                                    {m}mm
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}

            {/* Vertical Axis Ticks and MM Labels (Top to Bottom) */}
            {ticks.map(m => {
                const y = m * SCALE;
                const isMajor = m % 10 === 0;
                const isMed = m % 5 === 0 && !isMajor;

                let tickLength = isMajor ? 6 : (isMed ? 4 : 2);
                let tickClass = isMajor ? "cd-axis-tick-major" : (isMed ? "cd-axis-tick-med" : "cd-axis-tick-minor");

                return (
                    <g key={`v-tick-${m}`}>
                        <line
                            x1={CENTER - tickLength}
                            y1={y}
                            x2={CENTER + tickLength}
                            y2={y}
                            className={tickClass}
                        />
                        {isMajor && m !== 60 && (
                            <g transform={`translate(${CENTER - 14}, ${y})`}>
                                <rect x="-11" y="-5" width="22" height="9" className="cd-axis-text-bg" />
                                <text x="0" y="0" className="cd-axis-text" textAnchor="middle" dominantBaseline="middle">
                                    {m}mm
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}

            {/* Center Point Highlight */}
            <circle cx={CENTER} cy={CENTER} r={3.5} fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
        </g>
    );
}

export default CDCenterMMAxis;
