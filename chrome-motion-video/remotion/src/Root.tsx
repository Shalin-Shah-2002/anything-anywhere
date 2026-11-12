import {Composition} from 'remotion';
import {ChromeAI} from './ChromeAI';
import {FPS, TOTAL_FRAMES} from './timeline';
import './fonts';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ChromeAI"
      component={ChromeAI}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
