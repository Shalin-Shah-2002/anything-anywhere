import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BrowserCard, CamKey} from './BrowserCard';

export const CARD_W = 1060;
const TEXT_W = 600;
const MARGIN_TEXT = 120;
const MARGIN_CARD = 90;

/**
 * One feature beat: real product footage in a card on one side, the claim on the other.
 * `side` is where the text sits.
 */
export const FeatureScene: React.FC<{
  side: 'left' | 'right';
  text: React.ReactNode;
  clip: string;
  aspect: number;
  camera: CamKey[];
  glow?: number;
  extra?: React.ReactNode;
}> = ({side, text, clip, aspect, camera, glow, extra}) => {
  const cardH = Math.round(CARD_W / aspect);
  const cardLeft = side === 'left' ? 1920 - MARGIN_CARD - CARD_W : MARGIN_CARD;
  const textLeft = side === 'left' ? MARGIN_TEXT : 1920 - MARGIN_TEXT - TEXT_W;
  return (
    <AbsoluteFill>
      <BrowserCard
        src={clip}
        width={CARD_W}
        aspect={aspect}
        left={cardLeft}
        top={Math.round(540 - cardH / 2)}
        tilt={side === 'left' ? -1 : 1}
        camera={camera}
        glow={glow}
      />
      <div
        style={{
          position: 'absolute',
          left: textLeft,
          top: 0,
          bottom: 0,
          width: TEXT_W,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 30,
        }}
      >
        {text}
      </div>
      {extra}
    </AbsoluteFill>
  );
};
