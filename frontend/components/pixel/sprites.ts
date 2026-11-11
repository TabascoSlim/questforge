// Original pixel art for QuestForge. Letters map to palette colors; "." is transparent.

const INK = '#1A1A2E';

// ---------- Quest items: one per category ----------
export const ITEMS = {
  focus: {
    name: 'Sword',
    rows: [
      '..........ww',
      '.........wsw',
      '........wsw.',
      '.......wsw..',
      '......wsw...',
      '.....wsw....',
      '..g.wsw.....',
      '...gsw......',
      '...ggg......',
      '..h.gg......',
      '.h....g.....',
      'h...........',
    ],
    palette: { w: '#EEF1FB', s: '#A9B8EE', g: '#F2C14E', h: '#8B5A2B' },
  },
  wellness: {
    name: 'Potion',
    rows: [
      '....kkkk....',
      '....kccK....',
      '.....kk.....',
      '....kwwk....',
      '...kwwwwk...',
      '..kwrrrrwk..',
      '.kwrRrrrrrk.',
      '.krrrrrrRrk.',
      '.krRrrrrrrk.',
      '.krrrrrrrrk.',
      '..krrrrrrk..',
      '...kkkkkk...',
    ],
    palette: { k: INK, c: '#C08A5B', K: '#8B5A2B', w: '#CDE7F5', r: '#E5506A', R: '#F7A0B0' },
  },
  social: {
    name: 'Scroll',
    rows: [
      '............',
      '.kkkkkkkkkk.',
      'kbbbbbbbbbbk',
      '.kppppppppk.',
      '.kplllllppk.',
      '.kppppppppk.',
      '.kplllllplk.',
      '.kppppppppk.',
      '.kpllllpppk.',
      'kbbbbbbbbbbk',
      '.kkkkkkkkkk.',
      '............',
    ],
    palette: { k: INK, b: '#C08A5B', p: '#F3E3B5', l: '#8B6B4A' },
  },
  misc: {
    name: 'Coin pouch',
    rows: [
      '....kk.kk...',
      '.....kgk....',
      '....kkkkk...',
      '...kbbbbbk..',
      '..kbbBbbbbk.',
      '.kbbbbbbBbbk',
      '.kbBbbbbbbbk',
      '.kbbbbbBbbbk',
      '.kbbbbbbbbbk',
      '..kbbbbbbbk.',
      '...kkkkkkk..',
      '............',
    ],
    palette: { k: INK, g: '#F2C14E', b: '#8B5A2B', B: '#B07A44' },
  },
} as const;

export type ItemCategory = keyof typeof ITEMS;

// ---------- Treasure chests ----------
const CHEST_PALETTE = { k: INK, w: '#8B5A2B', W: '#B07A44', g: '#F2C14E', d: '#3A2412', l: '#FFF2B0' };

export const CHEST_CLOSED = {
  rows: [
    '............',
    '............',
    '..kkkkkkkk..',
    '.kWWWWWWWWk.',
    '.kWwwwwwwWk.',
    'kggggggggggk',
    'kwwwwggwwwwk',
    'kwwwwgdgwwwk',
    'kWwwwggwwwWk',
    'kWwwwwwwwwWk',
    'kggggggggggk',
    '.kkkkkkkkkk.',
  ],
  palette: CHEST_PALETTE,
};

export const CHEST_OPEN = {
  rows: [
    '..kkkkkkkk..',
    '.kWWWWWWWWk.',
    '.kWwwwwwwWk.',
    '.kggggggggk.',
    'kddllllllddk',
    'kdlllllllldk',
    'kggggggggggk',
    'kwwwwwwwwwwk',
    'kWwwwwwwwwWk',
    'kWwwwwwwwwWk',
    'kggggggggggk',
    '.kkkkkkkkkk.',
  ],
  palette: CHEST_PALETTE,
};

// ---------- Campfire (streak): three sizes that grow with the streak ----------
const FIRE_PALETTE = { F: '#F8DA8A', f: '#F2703C', l: '#FFF7D6', s: '#F2C14E', w: '#6B4226', W: '#8B5A2B' };

// Kindling: 1-2 day streak
export const FIRE_SMALL = {
  rows: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '.....F......',
    '.....fF.....',
    '....ffF.....',
    '.ww.fff.ww..',
    '..wwwwwwww..',
    '.wwWwwwWww..',
    '..ww....ww..',
  ],
  palette: FIRE_PALETTE,
};

// Campfire: 3-6 day streak
export const FIRE_MEDIUM = {
  rows: [
    '.....F......',
    '.....FF.....',
    '....FfF.....',
    '...FffF.F...',
    '...ffFff....',
    '..fffFfff...',
    '..ffFFFff...',
    '...fFFFf....',
    '.ww.fff.ww..',
    '..wwwwwwww..',
    '.wwWwwwWww..',
    '..ww....ww..',
  ],
  palette: FIRE_PALETTE,
};

// Bonfire: 7+ day streak
export const FIRE_LARGE = {
  rows: [
    '.s...F...s..',
    '....FF......',
    '...FfF.F....',
    '..FffFfF..s.',
    '..ffFFfff...',
    '.fffFFFfff..',
    '.ffFFFFFff..',
    'ffFFlFFFFff.',
    '.ffFFlFFff..',
    'wwfffFfffww.',
    '.wwWwwwwWww.',
    'ww........ww',
  ],
  palette: FIRE_PALETTE,
};

// Kept for existing imports
export const CAMPFIRE = FIRE_MEDIUM;

export function fireForStreak(days: number) {
  if (days >= 7) return { art: FIRE_LARGE, stage: 'Bonfire', size: 52, next: null as null | { stage: string; daysLeft: number } };
  if (days >= 3) return { art: FIRE_MEDIUM, stage: 'Campfire', size: 44, next: { stage: 'bonfire', daysLeft: 7 - days } };
  return { art: FIRE_SMALL, stage: 'Kindling', size: 36, next: { stage: 'campfire', daysLeft: 3 - days } };
}

export const CAMPFIRE_OUT = {
  rows: [
    '......s.....',
    '.....s......',
    '......s.....',
    '.....s......',
    '............',
    '............',
    '............',
    '............',
    '.ww......ww.',
    '..wwwwwwww..',
    '.wwWwwwWww..',
    '..ww....ww..',
  ],
  palette: { s: '#7D8CC9', w: '#6B4226', W: '#8B5A2B' },
};

// ---------- Hazel the owl (Game Master) ----------
export const OWL = {
  rows: [
    '..k......k..',
    '..kk....kk..',
    '..kbbbbbbk..',
    '.kbwwbbwwbk.',
    '.kbwebbwebk.',
    '.kbbbyybbbk.',
    '.kbBBbbBBbk.',
    '.kbBbBBbBbk.',
    '.kbbBbbBbbk.',
    '..kbbbbbbk..',
    '...kyk.kyk..',
    '............',
  ],
  palette: { k: INK, b: '#9C6B3F', B: '#C4935E', w: '#EEF1FB', e: INK, y: '#F2C14E' },
};

// ---------- Avatars (layered) ----------
export interface AvatarLook {
  skin: string;
  hair: string;
  hair_color: string;
  face: string;
  color: string;
  hat: string;
}

export const DEFAULT_LOOK: AvatarLook = {
  skin: 'peach', hair: 'short', hair_color: 'brown', face: 'smile', color: 'indigo', hat: 'none',
};

export const SKINS: Record<string, { label: string; base: string; mouth: string }> = {
  porcelain: { label: 'Porcelain', base: '#F7DCC8', mouth: '#C9786A' },
  peach: { label: 'Peach', base: '#F2C9A0', mouth: '#B5654F' },
  tan: { label: 'Tan', base: '#D9A273', mouth: '#9A5A3C' },
  olive: { label: 'Olive', base: '#C08A5B', mouth: '#7E4A2C' },
  brown: { label: 'Brown', base: '#8D5A3B', mouth: '#5A3422' },
  deep: { label: 'Deep', base: '#5E3A26', mouth: '#3A2014' },
};

export const HAIR_STYLES: Record<string, string> = {
  short: 'Short', long: 'Long', spiky: 'Spiky', ponytail: 'Ponytail', bald: 'Bald',
};

export const HAIR_COLORS: Record<string, { label: string; value: string }> = {
  black: { label: 'Black', value: '#2A2A33' },
  brown: { label: 'Brown', value: '#6B4226' },
  blonde: { label: 'Blonde', value: '#E8C15A' },
  red: { label: 'Red', value: '#B8432F' },
  silver: { label: 'Silver', value: '#C9CCD6' },
  blue: { label: 'Blue', value: '#3B5BD8' },
  pink: { label: 'Pink', value: '#E87BB0' },
};

export const FACES: Record<string, string> = {
  smile: 'Smile', determined: 'Determined', sleepy: 'Sleepy', surprised: 'Surprised', glasses: 'Glasses',
};

export const OUTFITS: Record<string, { label: string; main: string; shade: string }> = {
  saffron: { label: 'Saffron', main: '#E8A33C', shade: '#B87A1E' },
  indigo: { label: 'Indigo', main: '#5B6BC8', shade: '#3B4790' },
  sage: { label: 'Sage', main: '#8BAA6A', shade: '#617D47' },
  coral: { label: 'Coral', main: '#E07A5F', shade: '#B05A43' },
  plum: { label: 'Plum', main: '#9E5A8A', shade: '#6E3A60' },
  teal: { label: 'Teal', main: '#3EA8A4', shade: '#2B7672' },
  amber: { label: 'Amber', main: '#D9822B', shade: '#A85F18' },
  slate: { label: 'Slate', main: '#7A889A', shade: '#566273' },
};

export const HATS: Record<string, string> = {
  none: 'No hat', straw: 'Straw hat', beanie: 'Beanie', flowers: 'Flower crown', bandana: 'Bandana', cap: 'Cap',
};

// Base head and shoulders (no hair); hair, face, and hat are layered on top.
const BASE = [
  '............',
  '............',
  '...kkkkkk...',
  '..kssssssk..',
  '.kssssssssk.',
  '.kssssssssk.',
  '.kssessessk.',
  '.kssssssssk.',
  '..kssmmssk..',
  '...kkkkkk...',
  '..kcccccck..',
  '.kcccccccck.',
  '.kcCccccCck.',
  '.kkkkkkkkkk.',
];

// Layers: "_" keeps whatever is underneath; any other character paints over it.
type Layer = Record<number, string>;

const HAIR_LAYERS: Record<string, Layer> = {
  short: { 3: '___hhhhhh___', 4: '__hhhhhhhh__', 5: '__h______h__' },
  long: {
    3: '___hhhhhh___', 4: '__hhhhhhhh__', 5: '__h______h__',
    6: '_h________h_', 7: '_h________h_', 8: '_h________h_', 9: '_h________h_',
  },
  spiky: { 1: '__h_hh_hh_h_', 2: '__hhhhhhhh__', 3: '_hhhhhhhhhh_', 4: '__hhhhhhhh__', 5: '__h______h__' },
  ponytail: {
    3: '___hhhhhh___', 4: '__hhhhhhhh_h', 5: '__h______h_h', 6: '___________h', 7: '___________h',
  },
  bald: { 3: '____w_______' },
};

const FACE_LAYERS: Record<string, Layer> = {
  smile: { 8: '___smmmms___' },
  determined: { 5: '___ee__ee___', 8: '____mmmm____' },
  sleepy: { 6: '___ee__ee___', 8: '_____mm_____' },
  surprised: { 5: '____e__e____', 8: '_____ee_____' },
  glasses: { 6: '__GLeGGeLG__' },
};

const HAT_LAYERS: Record<string, Layer> = {
  none: {},
  straw: { 0: '____HHHH____', 1: '___HHHHHH___', 2: '__HbbbbbbH__', 3: 'HHHHHHHHHHHH' },
  beanie: { 0: '_____HH_____', 1: '___HHHHHH___', 2: '__HHHHHHHH__', 3: '_HbbbbbbbbH_' },
  flowers: { 3: '___fgfgfg___' },
  bandana: { 3: '__HHHHHHHH__', 4: '__HHbHHbHH__', 5: '___________H' },
  cap: { 2: '___HHHHHH___', 3: '__HHHHHHHH__', 4: '__________HH' },
};

const HAT_COLORS: Record<string, { H: string; b: string }> = {
  none: { H: INK, b: INK },
  straw: { H: '#E3C26B', b: '#E5506A' },
  beanie: { H: '#E5506A', b: '#A8304A' },
  flowers: { H: INK, b: INK },
  bandana: { H: '#2C9A60', b: '#EEF1FB' },
  cap: { H: '#3D6FA8', b: '#2B5080' },
};

function applyLayer(rows: string[], layer: Layer): string[] {
  return rows.map((row, i) => {
    const over = layer[i];
    if (!over) return row;
    return row
      .split('')
      .map((ch, x) => (over[x] && over[x] !== '_' ? over[x] : ch))
      .join('');
  });
}

export function avatarSprite(look: Partial<AvatarLook> | null | undefined) {
  const l = { ...DEFAULT_LOOK, ...(look ?? {}) };
  const skin = SKINS[l.skin] ?? SKINS.peach;
  const outfit = OUTFITS[l.color] ?? OUTFITS.indigo;
  const hatKey = HAT_LAYERS[l.hat] ? l.hat : 'none';

  let rows = BASE.slice();
  rows = applyLayer(rows, HAIR_LAYERS[l.hair] ?? HAIR_LAYERS.short);
  rows = applyLayer(rows, FACE_LAYERS[l.face] ?? FACE_LAYERS.smile);
  rows = applyLayer(rows, HAT_LAYERS[hatKey]);

  return {
    rows,
    palette: {
      k: INK,
      s: skin.base,
      m: skin.mouth,
      e: INK,
      w: '#FFFFFF',
      h: (HAIR_COLORS[l.hair_color] ?? HAIR_COLORS.brown).value,
      G: '#2A2A33',
      L: '#BFE3F5',
      c: outfit.main,
      C: outfit.shade,
      H: HAT_COLORS[hatKey].H,
      b: HAT_COLORS[hatKey].b,
      f: '#F29BB8',
      g: '#F2D24B',
    },
  };
}
