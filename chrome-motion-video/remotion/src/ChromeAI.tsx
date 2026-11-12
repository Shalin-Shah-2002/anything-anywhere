import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, getStaticFiles, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Backdrop} from './components/Backdrop';
import {Reveal} from './scenes/Reveal';
import {AIModeScene, AskScene, AutoBrowseScene, TabsScene} from './scenes/Features';
import {MoreScene} from './scenes/More';
import {SafetyScene} from './scenes/Safety';
import {chromeWipe, recede, whip, zoomBlur} from './transitions';
import {C, EASE} from './theme';
import {DUR, START, T} from './timeline';

const timing = () => linearTiming({durationInFrames: T, easing: EASE.camera});

/** A scene rendered by HyperFrames (HTML + GSAP), played back full-frame. */
const HyperFramesClip: React.FC<{src: string}> = ({src}) => (
  <AbsoluteFill>
    <OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%'}} />
  </AbsoluteFill>
);

const hasMix = getStaticFiles().some((f) => f.name === 'audio/mix.wav');

export const ChromeAI: React.FC = () => {
  return (
    <AbsoluteFill style={{background: C.dark}}>
      {/* The light stage lives under every Remotion scene, continuous across cuts. */}
      <Sequence from={START.reveal} durationInFrames={START.endcard + T - START.reveal}>
        <Backdrop />
      </Sequence>

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={DUR.problem}>
          <HyperFramesClip src="hf/problem.mp4" />
        </TransitionSeries.Sequence>
        {/* match cut on the white dot */}
        <TransitionSeries.Sequence durationInFrames={DUR.reveal}>
          <Reveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomBlur()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={DUR.ask}>
          <AskScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={whip()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={DUR.tabs}>
          <TabsScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomBlur()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={DUR.aimode}>
          <AIModeScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={whip()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={DUR.autobrowse}>
          <AutoBrowseScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={recede()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={DUR.more}>
          <MoreScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomBlur()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={DUR.safety}>
          <SafetyScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={chromeWipe()} timing={timing()} />
        <TransitionSeries.Sequence durationInFrames={DUR.endcard}>
          <HyperFramesClip src="hf/endcard.mp4" />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {hasMix && <Audio src={staticFile('audio/mix.wav')} />}
    </AbsoluteFill>
  );
};
