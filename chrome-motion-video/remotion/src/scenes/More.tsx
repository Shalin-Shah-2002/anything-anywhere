import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {InkWords, headlineStyle} from '../components/Text';
import {FONT_FAMILY} from '../fonts';
import {C, clamp} from '../theme';

const CARDS = [
  {img: 'img/nano-banana.webp', title: 'Nano Banana', sub: 'Reimagine any image with a prompt', pos: '50% 50%'},
  {img: 'img/google-apps.webp', title: 'Connected apps', sub: 'Gmail, Calendar, Maps and YouTube', pos: '50% 40%'},
  {img: 'img/lens.webp', title: 'Google Lens', sub: 'Search what you see', pos: '62% 50%'},
  {img: 'img/skills.webp', title: 'Skills', sub: 'Save prompts as one-click tools', pos: '40% 50%'},
];

const W = 380;
const GAP = 40;
const LEFT = (1920 - (W * 4 + GAP * 3)) / 2;

// SC 07: four extras spring up one after another, then drift at different depths.
export const MoreScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 92, textAlign: 'center'}}>
        <InkWords text="Create, connect, explore." start={4} stagger={6} style={{...headlineStyle, fontSize: 88, textWrap: 'nowrap'}} />
      </div>
      {CARDS.map((c, i) => {
        const s = spring({frame: frame - (14 + i * 7), fps, config: {damping: 15, stiffness: 115, mass: 1}});
        const settle = interpolate(frame - (14 + i * 7), [0, 12], [0, 1], clamp);
        const depth = [1, 1.5, 1.2, 1.7][i];
        const drift = -frame * 0.09 * depth;
        const tilt = (i % 2 === 0 ? -1 : 1) * 6 * (1 - s);
        const baseY = i % 2 === 0 ? 270 : 300;
        return (
          <div
            key={c.title}
            style={{
              position: 'absolute',
              left: LEFT + i * (W + GAP),
              top: baseY,
              width: W,
              height: 640,
              borderRadius: 30,
              overflow: 'hidden',
              background: '#ffffff',
              boxShadow: '0 40px 80px -24px rgba(20,30,60,0.26), 0 0 0 1px rgba(20,30,60,0.06)',
              opacity: settle,
              transform: `translateY(${(170 * (1 - s) + drift).toFixed(2)}px) rotate(${tilt.toFixed(3)}deg) scale(${(0.86 + 0.14 * s).toFixed(4)})`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{height: 470, overflow: 'hidden', background: '#eef1f6'}}>
              <Img src={staticFile(c.img)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: c.pos, display: 'block'}} />
            </div>
            <div style={{padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: FONT_FAMILY}}>
              <div style={{fontSize: 36, fontWeight: 650, letterSpacing: '-0.02em', color: C.ink}}>{c.title}</div>
              <div style={{fontSize: 28, lineHeight: 1.25, color: C.muted}}>{c.sub}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
