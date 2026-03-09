import { useId } from "react";
import { Link } from "react-router-dom";

const ApnaGharLogo = ({ subtitle = "" }) => {
  const uid = useId().replace(/:/g, "");
  const roofGradientId = `roofGradient${uid}`;
  const sunGradientId = `sunGradient${uid}`;
  const wordGradientId = `wordGradient${uid}`;

  return (
    <Link to="/" className="apn-ghar-logo" aria-label="Go to home page">
      <svg className="apn-ghar-svg" viewBox="0 0 280 88" role="img" aria-hidden="true">
        <defs>
          <linearGradient id={roofGradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2656ff" />
            <stop offset="100%" stopColor="#4b2cff" />
          </linearGradient>
          <linearGradient id={sunGradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffbf52" />
            <stop offset="100%" stopColor="#ff7f2a" />
          </linearGradient>
          <linearGradient id={wordGradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#153fb9" />
            <stop offset="55%" stopColor="#2f57de" />
            <stop offset="100%" stopColor="#ff6b2c" />
          </linearGradient>
          <filter id={`logoGlow${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1f3da0" floodOpacity="0.25" />
          </filter>
        </defs>

        <g filter={`url(#logoGlow${uid})`}>
          <circle cx="39" cy="43" r="30" fill="#f4f7ff" stroke="#d8e2ff" strokeWidth="2" />
          <circle cx="53" cy="26" r="8" fill={`url(#${sunGradientId})`} opacity="0.95" />
          <path d="M16 45 L39 26 L62 45" fill="none" stroke={`url(#${roofGradientId})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="23" y="44" width="32" height="19" rx="5" fill="#ffffff" stroke="#c9d6ff" strokeWidth="2" />
          <rect x="35" y="50" width="8" height="13" rx="2" fill="#2656ff" />
          <rect x="26.5" y="48.5" width="6" height="6" rx="1.5" fill="#dce7ff" />
          <rect x="45.5" y="48.5" width="6" height="6" rx="1.5" fill="#dce7ff" />
        </g>

        <text
          x="82"
          y="37"
          className="apna-back"
          style={{ fontFamily: "Segoe UI, Trebuchet MS, sans-serif", letterSpacing: "0.5px" }}
        >
          Apna
        </text>

        <text
          x="82"
          y="70"
          className="ghar-front"
          style={{ fontFamily: "Segoe UI, Trebuchet MS, sans-serif", letterSpacing: "0.4px", fill: `url(#${wordGradientId})` }}
        >
          Ghar
        </text>
      </svg>

      {subtitle ? <span className="apn-ghar-subtitle">{subtitle}</span> : null}
    </Link>
  );
};

export default ApnaGharLogo;
