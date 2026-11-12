# Chrome × Gemini, a 30-second motion spot

A 30-second motion design video about Google Chrome. It covers what Chrome does, its Gemini AI features
and the problems they solve. It uses Google's public product screenshots and demo footage, and is built with
**HyperFrames** (HTML + GSAP scenes) and **Remotion** (React compositor and final render).

Status: **storyboard v1, waiting for approval.** Nothing has been rendered yet.
Open `storyboard/storyboard.html` in a browser to review the nine shots.

## Story

| Shot | Time | On screen | Engine |
|---|---|---|---|
| 01 Problem | 0:00 | Too many tabs. / Endless forms. / Sneaky scams. | HyperFrames |
| 02 Answer | 0:04 | Meet Chrome. Now with Gemini built in. | Remotion |
| 03 Ask Gemini | 0:07 | Ask about any page. | Remotion |
| 04 Tabs | 0:10 | Make sense of all your tabs. | Remotion |
| 05 AI Mode | 0:13 | Ask anything from the address bar. | Remotion |
| 06 Auto browse | 0:17 | Hand off the busywork. | Remotion |
| 07 And more | 0:20 | Nano Banana, Connected apps, Google Lens, Skills | Remotion |
| 08 Safety | 0:23 | Safer, with AI on watch. | Remotion |
| 09 End card | 0:26 | Browse smarter. google.com/chrome | HyperFrames |

## Layout

- `research/downloads/`: every public screenshot, still, Lottie file and logo collected from Google's Chrome pages.
  Raw demo videos are git-ignored because of their size. Fetch them again with
  `bash research/scripts/download.sh research/sources.tsv research/downloads`.
- `research/sources.tsv`: every downloaded URL, grouped by source site.
- `remotion/`: the Remotion project. `public/clips/` holds the five trimmed 60 fps demo clips used in the spot,
  `public/img/` holds the stills and logos, and `public/fonts/` holds Google Sans Flex (OFL).
- `hyperframes/`: the HyperFrames project for shots 01 and 09.
- `storyboard/storyboard.html`: the storyboard for review.

## Sources

- https://blog.google/products-and-platforms/products/chrome/gemini-3-auto-browse/
- https://blog.google/products-and-platforms/products/chrome/new-ai-features-for-chrome/
- https://blog.google/products-and-platforms/products/chrome/bringing-chrome-ai-to-android/
- https://blog.google/products-and-platforms/products/chrome/chrome-expands-latin-america/
- https://www.google.com/chrome/ai-innovations/
- https://www.google.com/chrome/
- https://developer.chrome.com/blog/chrome-at-io26

Chrome, Gemini and the screenshots are Google's. They are used here to describe the product.
