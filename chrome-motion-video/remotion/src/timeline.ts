// Every duration is in frames at 60 fps. Neighbouring scenes overlap by T frames during a transition.
export const FPS = 60;
export const T = 24;

export const DUR = {
  problem: 230, // HyperFrames render, ends on a single white dot
  reveal: 190,
  ask: 220,
  tabs: 220,
  aimode: 220,
  autobrowse: 250,
  more: 200,
  safety: 210,
  endcard: 228, // HyperFrames render
} as const;

export type SceneId = keyof typeof DUR;
export const ORDER: SceneId[] = ['problem', 'reveal', 'ask', 'tabs', 'aimode', 'autobrowse', 'more', 'safety', 'endcard'];

// problem → reveal is a match cut on the white dot (no overlap); every later seam overlaps by T.
export const START = {} as Record<SceneId, number>;
{
  let t = 0;
  ORDER.forEach((id, i) => {
    START[id] = t;
    const next = ORDER[i + 1];
    t += DUR[id] - (next && i >= 1 ? T : 0);
  });
}

export const TOTAL_FRAMES = START.endcard + DUR.endcard; // 1800 = 30 s
