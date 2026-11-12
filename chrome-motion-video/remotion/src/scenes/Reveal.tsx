import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BlurWords, GeminiSpark, headlineStyle} from '../components/Text';
import {FONT_FAMILY} from '../fonts';
import {C, EASE, clamp, progress} from '../theme';

const RINGS = [C.blue, C.red, C.yellow, C.green];

// SC 02: the white dot from SC 01 bursts open onto the light stage; the Chrome logo lands and rises.
export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // The dark stage opens from the dot (r = 12 px matches the last frame of SC 01).
  const hole = interpolate(frame, [2, 44], [12, 1180], {...clamp, easing: Easing2});
  const darkGone = frame > 44;

  // Logo: springs in on the dot, then glides up to make room for the line.
  const pop = spring({frame: frame - 8, fps, config: {damping: 14, stiffness: 120, mass: 1}});
  const spin = progress(frame, 8, 54, EASE.arrive);
  const rise = progress(frame, 38, 36, EASE.camera);
  const logoSize = 250;
  const logoY = 540 - 190 * rise;
  const logoScale = pop * (1 - 0.1 * rise);

  // Gemini line blurs in as a whole, its spark turns into place.
  const gem = progress(frame, 90, 18, EASE.arrive);
  const sparkTurn = progress(frame, 90, 40, EASE.arrive);

  return (
    <AbsoluteFill>
      {/* Dark stage with a growing hole */}
      {!darkGone && (
        <AbsoluteFill
          style={{
            background: C.dark,
            WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${hole.toFixed(1)}px, black ${(hole + 1.5).toFixed(1)}px)`,
            maskImage: `radial-gradient(circle at 50% 50%, transparent ${hole.toFixed(1)}px, black ${(hole + 1.5).toFixed(1)}px)`,
          }}
        />
      )}
      {/* Ripple rings in Chrome's colours */}
      {RINGS.map((color, k) => {
        const start = 5 + k * 4;
        const p = progress(frame, start, 64, EASE.arrive);
        const r = 18 + (620 + k * 90) * p;
        const o = interpolate(frame, [start, start + 5, start + 64], [0, 0.95, 0], clamp);
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: 960 - r,
              top: 540 - r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              border: `${(10 - 7 * p).toFixed(2)}px solid ${color}`,
              opacity: o,
            }}
          />
        );
      })}

      {frame < 4 && (
        <div style={{position: 'absolute', left: 948, top: 528, width: 24, height: 24, borderRadius: '50%', background: '#fff'}} />
      )}

      <Img
        src={staticFile('img/chrome-logo.svg')}
        style={{
          position: 'absolute',
          left: 960 - logoSize / 2,
          top: logoY - logoSize / 2,
          width: logoSize,
          height: logoSize,
          transform: `scale(${logoScale.toFixed(4)}) rotate(${(-110 * (1 - spin)).toFixed(2)}deg)`,
          filter: 'drop-shadow(0 18px 30px rgba(20,30,60,0.18))',
        }}
      />

      <div style={{position: 'absolute', left: 0, right: 0, top: 500, textAlign: 'center'}}>
        <BlurWords text="Meet Chrome." start={68} stagger={6} style={{...headlineStyle, fontSize: 128, fontWeight: 680, letterSpacing: '-0.045em'}} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 668,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 18,
          opacity: interpolate(gem, [0, 0.5], [0, 1], clamp),
          filter: `blur(${(9 * (1 - gem)).toFixed(2)}px)`,
        }}
      >
        <div style={{transform: `rotate(${(-120 * (1 - sparkTurn)).toFixed(2)}deg) scale(${(0.5 + 0.5 * sparkTurn).toFixed(3)})`, display: 'flex'}}>
          <GeminiSpark size={58} />
        </div>
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: 60,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            background: C.gemini,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            paddingBottom: 8,
          }}
        >
          Now with Gemini built in.
        </span>
      </div>
    </AbsoluteFill>
  );
};

// The hole opens slowly, then floods the frame.
function Easing2(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
