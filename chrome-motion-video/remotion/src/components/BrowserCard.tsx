import React from 'react';
import {OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {EASE, SHADOW_CARD, clamp, progress} from '../theme';

/** A camera key: at frame `f` the card shows the point (x, y) (fractions of the footage) at zoom `s`. */
export type CamKey = {f: number; s: number; x: number; y: number};

const cameraAt = (frame: number, keys: CamKey[]) => {
  if (keys.length === 0) return {s: 1, x: 0.5, y: 0.5};
  if (frame <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const p = interpolate(frame, [a.f, b.f], [0, 1], {...clamp, easing: EASE.camera});
      return {s: a.s + (b.s - a.s) * p, x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p};
    }
  }
  return keys[keys.length - 1];
};

export const BrowserCard: React.FC<{
  src: string;
  width: number;
  aspect: number; // width / height of the footage
  left: number;
  top: number;
  tilt: 1 | -1; // which way the card swings in from
  camera?: CamKey[];
  delay?: number;
  glow?: number; // 0..1, the agent-at-work outline
  radius?: number;
}> = ({src, width, aspect, left, top, tilt, camera = [], delay = 0, glow = 0, radius = 26}) => {
  const frame = useCurrentFrame();
  const height = Math.round(width / aspect);

  // Arrive slow: a long-tailed rise; the 3D swing levels out before the UI starts acting.
  const p = progress(frame, delay, 52, EASE.arrive);
  const opacity = interpolate(frame, [delay, delay + 14], [0, 1], clamp);
  const rotY = tilt * 11 * (1 - p);
  const rotX = 6 * (1 - p);
  const y = 120 * (1 - p);
  const scale = 0.9 + 0.1 * p;

  const cam = cameraAt(frame, camera);
  const maxShift = ((1 - 1 / cam.s) / 2) * 100;
  const tx = Math.max(-maxShift, Math.min(maxShift, (0.5 - cam.x) * 100));
  const ty = Math.max(-maxShift, Math.min(maxShift, (0.5 - cam.y) * 100));

  return (
    <div style={{position: 'absolute', left, top, width, height, perspective: 2200}}>
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: radius,
          overflow: 'hidden',
          background: '#ffffff',
          opacity,
          transform: `translateY(${y.toFixed(2)}px) scale(${scale.toFixed(4)}) rotateY(${rotY.toFixed(3)}deg) rotateX(${rotX.toFixed(3)}deg)`,
          boxShadow:
            glow > 0
              ? `${SHADOW_CARD}, 0 0 0 ${(5 * glow).toFixed(2)}px rgba(66,133,244,${(0.5 * glow).toFixed(3)}), 0 0 ${(70 * glow).toFixed(1)}px rgba(66,133,244,${(0.38 * glow).toFixed(3)})`
              : SHADOW_CARD,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${cam.s.toFixed(4)}) translate(${tx.toFixed(3)}%, ${ty.toFixed(3)}%)`,
            transformOrigin: '50% 50%',
          }}
        >
          <OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
        </div>
      </div>
    </div>
  );
};
