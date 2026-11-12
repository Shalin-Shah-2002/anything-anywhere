import React from 'react';
import {interpolate, interpolateColors, useCurrentFrame} from 'remotion';
import {FeatureScene} from '../components/FeatureScene';
import {BlurWords, Chip, GeminiSpark, InkWords, SearchIcon, Typewriter, headlineStyle, subStyle} from '../components/Text';
import {FONT_FAMILY} from '../fonts';
import {C, EASE, clamp, progress} from '../theme';

// SC 03: Gemini in the side panel turns a recipe page into a grocery list.
export const AskScene: React.FC = () => (
  <FeatureScene
    side="left"
    clip="clips/ask.mp4"
    aspect={1818 / 1208}
    camera={[
      {f: 0, s: 1, x: 0.5, y: 0.5},
      {f: 112, s: 1, x: 0.5, y: 0.5},
      {f: 150, s: 1.55, x: 0.84, y: 0.42},
    ]}
    text={
      <>
        <Chip start={8} icon={<GeminiSpark size={30} />} label="Gemini in Chrome" />
        <BlurWords text="Ask about any page." start={14} style={headlineStyle} />
        <BlurWords text="Summaries, answers and to-do lists, right in the side panel." start={34} stagger={2} style={subStyle} />
      </>
    }
  />
);

// SC 04: Gemini works across several open tabs at once.
export const TabsScene: React.FC = () => (
  <FeatureScene
    side="right"
    clip="clips/tabs.mp4"
    aspect={16 / 9}
    camera={[
      {f: 0, s: 1, x: 0.5, y: 0.5},
      {f: 16, s: 1, x: 0.5, y: 0.5},
      {f: 58, s: 2, x: 0.88, y: 0.3},
    ]}
    text={
      <>
        <Chip start={8} icon={<GeminiSpark size={30} />} label="Works across tabs" />
        <InkWords text="Make sense of all your tabs." start={14} style={headlineStyle} />
        <BlurWords text="Compare and summarize across sites in one go." start={40} stagger={2} style={subStyle} />
      </>
    }
  />
);

// SC 05: AI Mode, asked from the address bar; the headline types along with the query.
export const AIModeScene: React.FC = () => (
  <FeatureScene
    side="left"
    clip="clips/aimode.mp4"
    aspect={1818 / 1204}
    camera={[
      {f: 0, s: 1, x: 0.5, y: 0.5},
      {f: 44, s: 1, x: 0.5, y: 0.5},
      {f: 82, s: 1.6, x: 0.5, y: 0.33},
      {f: 166, s: 1.6, x: 0.5, y: 0.33},
      {f: 196, s: 1, x: 0.5, y: 0.5},
    ]}
    text={
      <>
        <Chip start={8} icon={<SearchIcon size={28} />} label="AI Mode" />
        <Typewriter text="Ask anything from the address bar." start={30} duration={84} style={headlineStyle} />
        <BlurWords text="Long, complex questions, with follow-ups." start={112} stagger={3} style={subStyle} />
      </>
    }
  />
);

const CheckRow: React.FC<{label: string; appear: number; done: number; kind?: 'done' | 'ask'}> = ({label, appear, done, kind = 'done'}) => {
  const frame = useCurrentFrame();
  const a = progress(frame, appear, 18, EASE.arrive);
  const d = progress(frame, done, 16, EASE.arrive);
  const tone = kind === 'ask' ? C.amber : C.action;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        fontFamily: FONT_FAMILY,
        fontSize: 33,
        fontWeight: 500,
        opacity: interpolate(a, [0, 0.6], [0, 1], clamp),
        filter: `blur(${(6 * (1 - a)).toFixed(2)}px)`,
        color: interpolateColors(d, [0, 1], ['#8a929e', C.ink]),
      }}
    >
      <div style={{position: 'relative', width: 40, height: 40, flex: 'none'}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #c9ced8'}} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: tone,
            transform: `scale(${(d < 1 ? d * 1.12 : 1).toFixed(3)})`,
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          {kind === 'ask' ? '!' : (
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path d="m4.5 12.5 5 5 10-11" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      {label}
    </div>
  );
};

// SC 06: auto browse shops Etsy on its own; the checklist ticks with the footage.
export const AutoBrowseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = progress(frame, 18, 36, EASE.soft);
  return (
    <FeatureScene
      side="right"
      clip="clips/autobrowse.mp4"
      aspect={1920 / 1078}
      glow={glow}
      camera={[
        {f: 0, s: 1, x: 0.5, y: 0.5},
        {f: 100, s: 1, x: 0.5, y: 0.5},
        {f: 140, s: 1.32, x: 0.72, y: 0.5},
      ]}
      text={
        <>
          <Chip start={8} icon={<GeminiSpark size={30} />} label="Auto browse" />
          <BlurWords text="Hand off the busywork." start={14} style={headlineStyle} />
          <div style={{display: 'flex', flexDirection: 'column', gap: 18, marginTop: 6}}>
            <CheckRow label="Finds the party supplies" appear={38} done={78} />
            <CheckRow label="Adds them to your cart" appear={46} done={196} />
            <CheckRow label="Asks you before it buys" appear={54} done={214} kind="ask" />
          </div>
        </>
      }
    />
  );
};
