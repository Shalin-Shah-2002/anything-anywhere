import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const FONT_FAMILY = 'Google Sans Flex';

loadFont({
  family: FONT_FAMILY,
  url: staticFile('fonts/GoogleSansFlex.woff2'),
  weight: '1 1000',
  format: 'woff2',
});
