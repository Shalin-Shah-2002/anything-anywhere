import {Easing, interpolate} from 'remotion';

export const C = {
  ground: '#f7f8fb',
  dark: '#0b0d12',
  ink: '#16191e',
  muted: '#5c6470',
  blue: '#4285f4',
  red: '#ea4335',
  yellow: '#fbbc04',
  green: '#34a853',
  action: '#1a73e8',
  amber: '#f29900',
  gemini: 'linear-gradient(90deg, #4796e3 0%, #9177c7 55%, #ca6673 100%)',
};

// Eases by role: arrivals land on a long tail, camera moves ease both ways, exits accelerate.
export const EASE = {
  arrive: Easing.bezier(0.16, 1, 0.3, 1),
  camera: Easing.bezier(0.65, 0, 0.35, 1),
  exit: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 over [start, start+dur] with an ease. */
export const progress = (frame: number, start: number, dur: number, ease = EASE.arrive) =>
  interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: ease});

export const SHADOW_CARD =
  '0 50px 100px -20px rgba(20, 30, 60, 0.28), 0 18px 36px -12px rgba(20, 30, 60, 0.18), 0 0 0 1px rgba(20, 30, 60, 0.07)';
