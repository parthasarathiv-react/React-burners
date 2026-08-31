import React from 'react';

const CD_SIZE = 360;

export function DefaultCDQRCodes({ discConfig }) {
    const pxPerMm = (CD_SIZE / 2) / (discConfig?.outerRadius || 60);
    const hubR = (discConfig?.innerRadius || 11) * pxPerMm;

    const qrHalfSize = 12; // Half size of the 20x20 QR code
    // Total length from big circle (hubR) to outer end of QR code is 1 cm (10 mm)
    const offset1cmPx = 10 * pxPerMm;
    const ringRadius = hubR + offset1cmPx - qrHalfSize;
    const count = 7;
    const cx = CD_SIZE / 2;
    const cy = CD_SIZE / 2;

    return (
        <g className="cd-default-qr-ring">
            <defs>
                <g id="cd-default-qr-symbol">
                    {/* Background white card */}
                    <rect x="-10" y="-10" width="20" height="20" fill="#ffffff" stroke="#000000" strokeWidth="0.6" rx="1" />
                    
                    {/* Top-Left Finder Pattern */}
                    <rect x="-8.5" y="-8.5" width="6" height="6" fill="#000000" />
                    <rect x="-7.5" y="-7.5" width="4" height="4" fill="#ffffff" />
                    <rect x="-6.5" y="-6.5" width="2" height="2" fill="#000000" />

                    {/* Top-Right Finder Pattern */}
                    <rect x="2.5" y="-8.5" width="6" height="6" fill="#000000" />
                    <rect x="3.5" y="-7.5" width="4" height="4" fill="#ffffff" />
                    <rect x="4.5" y="-6.5" width="2" height="2" fill="#000000" />

                    {/* Bottom-Left Finder Pattern */}
                    <rect x="-8.5" y="2.5" width="6" height="6" fill="#000000" />
                    <rect x="-7.5" y="3.5" width="4" height="4" fill="#ffffff" />
                    <rect x="-6.5" y="4.5" width="2" height="2" fill="#000000" />

                    {/* Matrix & Timing pattern dots */}
                    <rect x="-1" y="-8.5" width="2.2" height="1.8" fill="#000000" />
                    <rect x="-1" y="-4" width="2" height="2" fill="#000000" />
                    <rect x="-8.5" y="-1" width="1.8" height="2.2" fill="#000000" />
                    <rect x="-4" y="-1" width="2" height="2" fill="#000000" />
                    <rect x="3" y="-1" width="2" height="2" fill="#000000" />
                    <rect x="6.5" y="-1" width="2" height="2" fill="#000000" />
                    <rect x="-1" y="3" width="2" height="2" fill="#000000" />
                    <rect x="3" y="3" width="5.5" height="2" fill="#000000" />
                    <rect x="-4" y="6.5" width="6" height="2" fill="#000000" />
                    <rect x="4" y="6.5" width="4.5" height="2" fill="#000000" />
                    <rect x="3" y="-5" width="2" height="2.5" fill="#000000" />
                    <rect x="-4" y="-5.5" width="2.5" height="2" fill="#000000" />
                </g>
            </defs>
            {/* Light circle line over top of all 7 QR codes (at 1cm outer boundary) */}
            <circle
                cx={cx}
                cy={cy}
                r={hubR + offset1cmPx}
                fill="none"
                stroke="rgba(151, 151, 151, 0.25)"
                strokeWidth="1"
            />
            {Array.from({ length: count }).map((_, i) => {
                const angleDeg = i * (360 / count);
                const angleRad = (angleDeg - 90) * (Math.PI / 180);
                const qx = cx + ringRadius * Math.cos(angleRad);
                const qy = cy + ringRadius * Math.sin(angleRad);
                return (
                    <use
                        key={i}
                        href="#cd-default-qr-symbol"
                        transform={`translate(${qx.toFixed(2)}, ${qy.toFixed(2)}) rotate(${angleDeg.toFixed(2)})`}
                    />
                );
            })}
        </g>
    );
}

export default DefaultCDQRCodes;
