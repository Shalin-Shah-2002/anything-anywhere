import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {C} from '../theme';

type P = Record<string, never>;
type Props = TransitionPresentationComponentProps<P>;

/** Blur swap through a zoom: the old scene pushes past the camera, the new one settles in from behind. */
const ZoomBlur: React.FC<Props> = ({children, presentationDirection, presentationProgress: p}) => {
  const exiting = presentationDirection === 'exiting';
  const style: React.CSSProperties = exiting
    ? {transform: `scale(${1 + 0.14 * p})`, filter: `blur(${(16 * p).toFixed(2)}px)`, opacity: 1 - p}
    : {transform: `scale(${0.88 + 0.12 * p})`, filter: `blur(${(16 * (1 - p)).toFixed(2)}px)`, opacity: p};
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/** Whip: both scenes slide left together with a smear; the arriving one sharpens as it lands. */
const Whip: React.FC<Props> = ({children, presentationDirection, presentationProgress: p}) => {
  const exiting = presentationDirection === 'exiting';
  const x = exiting ? -38 * p : 38 * (1 - p);
  const blur = exiting ? 18 * p : 18 * (1 - p);
  const opacity = exiting ? 1 - p * p : 1 - (1 - p) * (1 - p);
  return (
    <AbsoluteFill style={{transform: `translateX(${x.toFixed(3)}%)`, filter: `blur(${blur.toFixed(2)}px)`, opacity}}>{children}</AbsoluteFill>
  );
};

/** The old scene recedes into the stage; the new one brings its own entrance. */
const Recede: React.FC<Props> = ({children, presentationDirection, presentationProgress: p}) => {
  if (presentationDirection === 'entering') return <AbsoluteFill style={{opacity: Math.min(1, p * 2)}}>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${(70 * p).toFixed(2)}px) scale(${(1 - 0.16 * p).toFixed(4)})`,
        filter: `blur(${(12 * p).toFixed(2)}px)`,
        opacity: 1 - p,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Chrome's four colours flood out from the centre in rings; the end card opens inside the last one. */
const ChromeWipe: React.FC<Props> = ({children, presentationDirection, presentationProgress: p}) => {
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill style={{transform: `scale(${(1 - 0.05 * p).toFixed(4)})`}}>{children}</AbsoluteFill>;
  }
  const R = 1180;
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const r = (k: number) => R * ease(Math.max(0, Math.min(1, (p - k * 0.09) / 0.64)));
  const colors = [C.blue, C.red, C.yellow, C.green];
  return (
    <AbsoluteFill>
      {colors.map((c, k) => {
        const rr = r(k);
        return (
          <div
            key={c}
            style={{position: 'absolute', left: 960 - rr, top: 540 - rr, width: rr * 2, height: rr * 2, borderRadius: '50%', background: c}}
          />
        );
      })}
      <AbsoluteFill style={{clipPath: `circle(${r(4).toFixed(1)}px at 50% 50%)`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

const make = (component: React.FC<Props>): TransitionPresentation<P> => ({component, props: {} as P});

export const zoomBlur = () => make(ZoomBlur);
export const whip = () => make(Whip);
export const recede = () => make(Recede);
export const chromeWipe = () => make(ChromeWipe);
