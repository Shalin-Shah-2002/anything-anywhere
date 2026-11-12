# Chrome × Gemini, a 30-second motion spot

A 30-second motion design video about Google Chrome: the problems it solves, what it does, and its
Gemini AI features. It is built from Google's own public product screenshots and demo footage.
**HyperFrames** (HTML + GSAP) renders the typography-heavy opener and end card, and **Remotion**
(React) builds the product scenes, transitions and sound, and renders the final cut.

**Final video:** [`final/chrome-ai-30s.mp4`](final/chrome-ai-30s.mp4) (1920 × 1080, 60 fps, H.264 + AAC, 30.0 s)

The approved storyboard is in `storyboard/storyboard.html`.

## Story

Shot 01 names three problems. The feature shots answer them in turn: tabs, then chores, then scams.

| Shot | Time | On screen | Footage | Engine |
|---|---|---|---|---|
| 01 Problem | 0:00.0 | Too many tabs. / Endless forms. / Sneaky scams. | drawn in HTML | HyperFrames |
| 02 Answer | 0:03.8 | Meet Chrome. Now with Gemini built in. | official logo | Remotion |
| 03 Ask Gemini | 0:06.8 | Ask about any page. | `gic-ask-intro_desktop.webm` | Remotion |
| 04 Tabs | 0:10.1 | Make sense of all your tabs. | `Multitab.mp4` | Remotion |
| 05 AI Mode | 0:13.3 | Ask anything from the address bar. | `ai-mode_desktop.webm` | Remotion |
| 06 Auto browse | 0:16.6 | Hand off the busywork. | `auto-browse_desktop.webm` | Remotion |
| 07 And more | 0:20.4 | Nano Banana, Connected apps, Google Lens, Skills | stills | Remotion |
| 08 Safety | 0:23.3 | Safer, with AI on watch. | `Safety_password_fix.mp4` | Remotion |
| 09 End card | 0:26.4 | Browse smarter. google.com/chrome | official logo | HyperFrames |

Transitions: a match cut on a white dot (01 → 02), zoom-blur, whip, recede, and a wipe of rings in
Chrome's four colours into the end card.

## Rebuild

```bash
# 1. HyperFrames: render the opener and end card (7.63 s at 60 fps), then split them for Remotion
cd hyperframes && npm install
npx hyperframes render -f 60 -q delivery -o renders/hf-scenes.mp4
ffmpeg -i renders/hf-scenes.mp4 -vf "trim=start_frame=0:end_frame=230,setpts=PTS-STARTPTS" -an -c:v libx264 -crf 12 ../remotion/public/hf/problem.mp4
ffmpeg -i renders/hf-scenes.mp4 -vf "trim=start_frame=230:end_frame=458,setpts=PTS-STARTPTS" -an -c:v libx264 -crf 12 ../remotion/public/hf/endcard.mp4

# 2. Soundtrack (needs numpy + ffmpeg)
cd ../remotion && npm install
python3 scripts/make_audio.py

# 3. Final render
npx remotion render ChromeAI out/chrome-ai-30s.mp4 --codec h264 --crf 16 --x264-preset slow --audio-codec aac --audio-bitrate 256k
```

Preview and tweak in Remotion Studio with `npm run studio`. Set `REMOTION_BROWSER_EXECUTABLE` if
Remotion cannot download its own Chrome Headless Shell.

## Layout

- `hyperframes/`: the HyperFrames project. `compositions/problem.html` is SC 01, `compositions/endcard.html` is SC 09.
- `remotion/src/`: the Remotion project. `timeline.ts` holds the shot timing, `scenes/` the shots,
  `transitions/` the custom transitions, and `components/` the browser card with camera moves, the text animations and the backdrop.
- `remotion/public/clips/`: the five product demos, trimmed and sped up to true 60 fps.
- `remotion/public/audio/`: `mix.wav`, `cues.json` (every sound effect and the picture it follows) and the sound effects themselves.
- `research/downloads/`: every public screenshot, still, Lottie file and logo collected from Google's Chrome pages.
  Raw demo videos are git-ignored because of their size. Fetch them again with
  `bash research/scripts/download.sh research/sources.tsv research/downloads`.

## Sound

The bed is synthesized in `remotion/scripts/make_audio.py`. It starts as a low drone with rising noise
under the problem, then becomes a D-major pad that changes chord on every cut, with a soft eighth-note
pluck at 120 BPM. Sound effects come from the HyperFrames bundle, sourced from Pixabay under the
Pixabay Content License, which allows commercial use without attribution
(`remotion/public/audio/sfx/CREDITS.md`). The mix is −15 LUFS integrated with a true peak of −1.5 dBTP.
It was measured, not listened to, so swap in your own track if you prefer.

## Sources

- https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/
- https://blog.google/products-and-platforms/products/chrome/new-ai-features-for-chrome/
- https://blog.google/products-and-platforms/products/chrome/bringing-chrome-ai-to-android/
- https://blog.google/products-and-platforms/products/chrome/chrome-expands-latin-america/
- https://www.google.com/chrome/ai-innovations/
- https://www.google.com/chrome/
- https://developer.chrome.com/blog/chrome-at-io26

The "~3 billion fewer unwanted notifications a day" figure is Google's, for Chrome on Android.
Chrome, Gemini, the logo and the product footage belong to Google. They are used here to describe the product.
