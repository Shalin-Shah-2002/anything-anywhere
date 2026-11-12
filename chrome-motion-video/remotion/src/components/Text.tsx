import React from 'react';
import {interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {C, EASE, clamp, progress} from '../theme';
import {FONT_FAMILY} from '../fonts';

export const headlineStyle: React.CSSProperties = {
  fontFamily: FONT_FAMILY,
  fontSize: 84,
  lineHeight: 1.04,
  fontWeight: 650,
  letterSpacing: '-0.035em',
  color: C.ink,
  margin: 0,
  textWrap: 'balance',
};

export const subStyle: React.CSSProperties = {
  fontFamily: FONT_FAMILY,
  fontSize: 34,
  lineHeight: 1.35,
  fontWeight: 420,
  letterSpacing: '-0.005em',
  color: C.muted,
  margin: 0,
};

const wordBox: React.CSSProperties = {display: 'inline-block', whiteSpace: 'pre'};

/** Per word: blur 7px → 0 and opacity 0 → 1, words ~0.07 s apart, a short rise. */
export const BlurWords: React.FC<{
  text: string;
  start: number;
  stagger?: number;
  style?: React.CSSProperties;
  wordStyle?: (i: number, word: string) => React.CSSProperties | undefined;
}> = ({text, start, stagger = 4, style, wordStyle}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <p style={style}>
      {words.map((w, i) => {
        const p = progress(frame, start + i * stagger, 16, EASE.arrive);
        return (
          <span
            key={i}
            style={{
              ...wordBox,
              opacity: interpolate(p, [0, 0.6], [0, 1], clamp),
              filter: `blur(${(7 * (1 - p)).toFixed(2)}px)`,
              transform: `translateY(${(16 * (1 - p)).toFixed(2)}px)`,
              ...wordStyle?.(i, w),
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </p>
  );
};

/** Per word from light grey to ink, no movement. */
export const InkWords: React.FC<{text: string; start: number; stagger?: number; style?: React.CSSProperties}> = ({
  text,
  start,
  stagger = 5,
  style,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  return (
    <p style={style}>
      {words.map((w, i) => {
        const p = progress(frame, start + i * stagger, 14, EASE.soft);
        return (
          <span key={i} style={{...wordBox, opacity: interpolate(p, [0, 0.3], [0, 1], clamp), color: interpolateColors(p, [0, 1], ['#d5d9e0', C.ink])}}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </p>
  );
};

/** Characters typed in step with the footage, with a caret that leaves once typing ends. */
export const Typewriter: React.FC<{text: string; start: number; duration: number; style?: React.CSSProperties}> = ({
  text,
  start,
  duration,
  style,
}) => {
  const frame = useCurrentFrame();
  const n = Math.floor(interpolate(frame, [start, start + duration], [0, text.length], clamp));
  const caretOpacity = interpolate(frame, [start - 2, start, start + duration + 6, start + duration + 14], [0, 1, 1, 0], clamp);
  return (
    <p style={{...style, position: 'relative'}}>
      {/* the full text reserves the final layout, the typed part sits on top */}
      <span style={{visibility: 'hidden'}}>{text}</span>
      <span style={{position: 'absolute', left: 0, top: 0, right: 0}}>
        {text.slice(0, n)}
        <span
          style={{
            display: 'inline-block',
            width: 5,
            height: '0.9em',
            marginLeft: 4,
            transform: 'translateY(0.1em)',
            borderRadius: 3,
            background: C.action,
            opacity: caretOpacity,
          }}
        />
      </span>
    </p>
  );
};

export const GeminiSpark: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <defs>
      <linearGradient id="gspark" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4796e3" />
        <stop offset="0.55" stopColor="#9177c7" />
        <stop offset="1" stopColor="#ca6673" />
      </linearGradient>
    </defs>
    <path fill="url(#gspark)" d="M12 1.5c.55 5.6 4.9 9.95 10.5 10.5-5.6.55-9.95 4.9-10.5 10.5C11.45 16.9 7.1 12.55 1.5 12 7.1 11.45 11.45 7.1 12 1.5z" />
  </svg>
);

export const ShieldIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path fill={C.action} d="M12 1.8 20 5v6.2c0 5.1-3.4 9.6-8 11-4.6-1.4-8-5.9-8-11V5z" />
    <path fill="#fff" d="m10.6 15.3-3.2-3.2 1.4-1.4 1.8 1.8 4.6-4.6 1.4 1.4z" />
  </svg>
);

export const SearchIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="10" cy="10" r="6.4" fill="none" stroke={C.action} strokeWidth="2.6" />
    <path d="m15 15 5.6 5.6" stroke={C.action} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

/** The eyebrow pill above each feature headline. */
export const Chip: React.FC<{start: number; icon: React.ReactNode; label: string}> = ({start, icon, label}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, 22, EASE.arrive);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 24px 12px 18px',
        borderRadius: 999,
        background: '#ffffff',
        boxShadow: '0 10px 30px -8px rgba(20,30,60,0.18), 0 0 0 1px rgba(20,30,60,0.05)',
        fontFamily: FONT_FAMILY,
        fontSize: 29,
        fontWeight: 600,
        color: '#1f2a44',
        opacity: interpolate(p, [0, 0.5], [0, 1], clamp),
        transform: `translateY(${(14 * (1 - p)).toFixed(2)}px) scale(${(0.92 + 0.08 * p).toFixed(4)})`,
        transformOrigin: '0% 50%',
        alignSelf: 'flex-start',
      }}
    >
      {icon}
      {label}
    </div>
  );
};
