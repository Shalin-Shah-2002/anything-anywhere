import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';

// Soft light stage in Chrome's four colours. The blobs orbit slowly so the world never freezes.
const BLOBS = [
  {rgb: '66,133,244', a: 0.24, x: 12, y: 16, w: 40, h: 54, ph: 0.0},
  {rgb: '52,168,83', a: 0.18, x: 90, y: 86, w: 36, h: 50, ph: 1.7},
  {rgb: '251,188,4', a: 0.2, x: 80, y: 8, w: 32, h: 42, ph: 3.1},
  {rgb: '234,67,53', a: 0.14, x: 26, y: 96, w: 32, h: 46, ph: 4.6},
];

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const layers = BLOBS.map((b) => {
    const x = b.x + 6 * Math.sin(t * 0.32 + b.ph);
    const y = b.y + 5 * Math.cos(t * 0.27 + b.ph);
    return `radial-gradient(${b.w}% ${b.h}% at ${x.toFixed(2)}% ${y.toFixed(2)}%, rgba(${b.rgb},${b.a}), transparent 70%)`;
  });
  return (
    <AbsoluteFill style={{background: [...layers, C.ground].join(',')}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(30, 40, 70, 0.075) 1.4px, transparent 1.6px)',
          backgroundSize: '30px 30px',
          backgroundPosition: `0px ${(-t * 6).toFixed(2)}px`,
          WebkitMaskImage: 'radial-gradient(70% 70% at 50% 50%, black 0%, transparent 85%)',
          maskImage: 'radial-gradient(70% 70% at 50% 50%, black 0%, transparent 85%)',
        }}
      />
    </AbsoluteFill>
  );
};
