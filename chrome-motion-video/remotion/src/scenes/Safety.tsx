import React from 'react';
import {Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FeatureScene} from '../components/FeatureScene';
import {BlurWords, Chip, ShieldIcon, headlineStyle, subStyle} from '../components/Text';
import {FONT_FAMILY} from '../fonts';
import {C, EASE, clamp, progress} from '../theme';

const AlertCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - 34, fps, config: {damping: 13, stiffness: 110, mass: 1}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 630,
        top: 118,
        width: 400,
        borderRadius: 22,
        overflow: 'hidden',
        boxShadow: '0 34px 70px -18px rgba(120,20,20,0.40), 0 0 0 1px rgba(20,30,60,0.06)',
        opacity: interpolate(frame, [34, 44], [0, 1], clamp),
        transform: `translateY(${(-60 * (1 - s)).toFixed(2)}px) rotate(${(-5 - 14 * (1 - s)).toFixed(3)}deg) scale(${(0.8 + 0.2 * s).toFixed(4)})`,
        transformOrigin: '30% 0%',
      }}
    >
      <Img src={staticFile('img/malware-alert.webp')} style={{width: '100%', display: 'block'}} />
    </div>
  );
};

const StatChip: React.FC = () => {
  const frame = useCurrentFrame();
  const p = progress(frame, 84, 24, EASE.arrive);
  const count = interpolate(frame, [90, 138], [0, 3], {...clamp, easing: EASE.soft});
  const label = frame >= 138 ? '~3B' : `${count.toFixed(1)}B`;
  return (
    <div
      style={{
        position: 'absolute',
        right: 56,
        top: 724,
        width: 400,
        padding: '22px 28px 20px',
        borderRadius: 24,
        background: '#ffffff',
        boxShadow: '0 30px 60px -18px rgba(20,30,60,0.30), 0 0 0 1px rgba(20,30,60,0.06)',
        fontFamily: FONT_FAMILY,
        opacity: interpolate(p, [0, 0.5], [0, 1], clamp),
        transform: `translateY(${(50 * (1 - p)).toFixed(2)}px) scale(${(0.9 + 0.1 * p).toFixed(4)})`,
      }}
    >
      <div style={{fontSize: 76, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: C.action, fontVariantNumeric: 'tabular-nums'}}>{label}</div>
      <div style={{fontSize: 28, lineHeight: 1.25, color: C.ink, marginTop: 10}}>fewer spammy notifications a day*</div>
      <div style={{fontSize: 20, color: C.muted, marginTop: 8}}>*Chrome on Android, per Google</div>
    </div>
  );
};

// SC 08: a leaked password is fixed in one click; scam alerts and the notification stat land around it.
export const SafetyScene: React.FC = () => (
  <FeatureScene
    side="left"
    clip="clips/password.mp4"
    aspect={16 / 9}
    camera={[
      {f: 0, s: 1.55, x: 0.51, y: 0.3},
      {f: 50, s: 1.55, x: 0.51, y: 0.3},
      {f: 78, s: 1.7, x: 0.5, y: 0.12},
      {f: 160, s: 1.7, x: 0.5, y: 0.12},
      {f: 188, s: 1.6, x: 0.85, y: 0.25},
    ]}
    text={
      <>
        <Chip start={8} icon={<ShieldIcon size={30} />} label="Safety" />
        <BlurWords text="Safer, with AI on watch." start={14} style={headlineStyle} />
        <BlurWords text="Gemini Nano helps block scams. Leaked passwords get fixed in one click." start={34} stagger={2} style={subStyle} />
      </>
    }
    extra={
      <>
        <AlertCard />
        <StatChip />
      </>
    }
  />
);
