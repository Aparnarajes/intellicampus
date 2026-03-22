import React from 'react';

/**
 * IntelliCampus Brand Logo
 * A neural-network brain fused with a graduation cap —
 * represents AI-powered academic intelligence.
 */
const Logo = ({ size = 40, animated = true }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
        >
            {/* Glow filter */}
            <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="strongGlow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
                <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#0ea5e9" />
                </linearGradient>
            </defs>

            {/* --- Graduation Cap (top) --- */}
            {/* Cap board */}
            <polygon
                points="20,4 34,10 20,16 6,10"
                fill="url(#capGrad)"
                opacity="0.95"
                filter="url(#glow)"
            />
            {/* Cap top flat */}
            <rect x="18.5" y="3" width="3" height="1" rx="0.5" fill="#7dd3fc" />
            {/* Tassel string */}
            <line x1="34" y1="10" x2="34" y2="18" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="34" cy="19" r="1.5" fill="#0ea5e9" filter="url(#glow)" />

            {/* --- Neural network body --- */}
            {/* Connections */}
            <line x1="12" y1="23" x2="20" y2="28" stroke="#0ea5e9" strokeWidth="0.8" strokeOpacity="0.6" />
            <line x1="28" y1="23" x2="20" y2="28" stroke="#0ea5e9" strokeWidth="0.8" strokeOpacity="0.6" />
            <line x1="12" y1="23" x2="20" y2="19" stroke="#0ea5e9" strokeWidth="0.8" strokeOpacity="0.5" />
            <line x1="28" y1="23" x2="20" y2="19" stroke="#0ea5e9" strokeWidth="0.8" strokeOpacity="0.5" />
            <line x1="12" y1="23" x2="8" y2="29" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.4" />
            <line x1="28" y1="23" x2="32" y2="29" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.4" />
            <line x1="20" y1="28" x2="14" y2="34" stroke="#0ea5e9" strokeWidth="0.7" strokeOpacity="0.4" />
            <line x1="20" y1="28" x2="26" y2="34" stroke="#0ea5e9" strokeWidth="0.7" strokeOpacity="0.4" />
            {/* Horizontal links */}
            <line x1="12" y1="23" x2="28" y2="23" stroke="#0ea5e9" strokeWidth="0.6" strokeOpacity="0.35" />

            {/* Nodes - hidden layer */}
            <circle cx="12" cy="23" r="2.2" fill="url(#nodeGrad)" filter="url(#glow)" />
            <circle cx="28" cy="23" r="2.2" fill="url(#nodeGrad)" filter="url(#glow)" />

            {/* Nodes - center/output */}
            <circle cx="20" cy="19" r="1.8" fill="#38bdf8" opacity="0.8" filter="url(#glow)" />
            <circle cx="20" cy="28" r="2.8" fill="url(#nodeGrad)" filter="url(#strongGlow)" />

            {/* Nodes - outer */}
            <circle cx="8" cy="29" r="1.4" fill="#0ea5e9" opacity="0.6" />
            <circle cx="32" cy="29" r="1.4" fill="#0ea5e9" opacity="0.6" />
            <circle cx="14" cy="34" r="1.2" fill="#38bdf8" opacity="0.5" />
            <circle cx="26" cy="34" r="1.2" fill="#38bdf8" opacity="0.5" />

            {/* Center pulse dot */}
            <circle cx="20" cy="28" r="1.2" fill="white" opacity="0.9" />
        </svg>
    );
};

export default Logo;
