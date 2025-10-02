import React, { useEffect, useMemo, useRef, useState } from "react";

/** —— RNG + weighted pick —— */
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | t);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function pickWeighted<T extends { weight: number }>(rng: () => number, items: T[]) {
  const total = items.reduce((s, x) => s + x.weight, 0);
  let r = rng() * total, acc = 0;
  for (const it of items) { acc += it.weight; if (r < acc) return it; }
  return items[items.length - 1];
}

/** —— Helpers for weighted PaySym picks —— */
function sum<T>(arr: T[], f: (x: T) => number) { return arr.reduce((s, x) => s + f(x), 0); }

function pickPaySymbolWeighted(rng: ()=>number, weights: Record<PaySym, number>): PaySym {
  const items = Object.entries(weights).map(([sym, weight]) => ({ sym: sym as PaySym, weight }));
  const total = sum(items, x=>x.weight);
  let r = rng() * total, acc = 0;
  for (const it of items) { acc += it.weight; if (r < acc) return it.sym; }
  return items[items.length - 1].sym;
}

function globalSymbolWeightsFromReels(pool = REEL_WEIGHTS_BY_REEL) {
  const w: Record<PaySym, number> = { "🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0 };
  for (const col of pool) {
    for (const {sym, weight} of col) {
      if (sym === "🎟️" || sym === "❓") continue;
      w[sym as PaySym] += weight;
    }
  }
  return w;
}

/** —— Slotkonfiguration —— */
const ROWS = 4;
const COLS = 6;

type PaySym = "🍒"|"🍋"|"🍇"|"🍊"|"🥝"|"🥥"|"🔔"|"⭐"|"💎"|"🍀";
type Sym = PaySym | "🎟️" | "❓"; // <<— INGA WILDS

// —— Sprites (just nu bara Cherry ersatt av symbol10.png) ——
const SPRITE_MAP: Partial<Record<Sym, string>> = {
  "🍒": "/assets/symbol10.png",
  "🍋": "/assets/symbolJ.png",
  "🍇": "/assets/symbolQ.png",
  "🍊": "/assets/symbolK.png",
  "🥝": "/assets/symbolA.png",
  "🥥": "/assets/premium4.png",
  "🔔": "/assets/premium2.png",
  "⭐": "/assets/premium3.png",
  "💎": "/assets/premium5.png",
  "🍀": "/assets/premium7.png",
  "❓": "/assets/Mystery.png",
};

function SymbolSprite({ sym }: { sym: Sym }) {
  const src = SPRITE_MAP[sym];
  const isSpecial = sym === "🎟️" || sym === "❓";

  if (!src) {
    return (
      <span
        style={{
          fontSize: isSpecial ? "2.2rem" : "1.7rem",
          lineHeight: 1,
        }}
      >
        {sym}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={sym}
      style={{
        width: isSpecial ? "100%" : 56,
        height: isSpecial ? "100%" : 56,
        objectFit: "contain",
        imageRendering: "auto",
        pointerEvents: "none",
      }}
      draggable={false}
    />
  );
}



// Per-hjul vikter 
const REEL_WEIGHTS_BY_REEL: Array<Array<{ sym: Sym; weight: number }>> = [
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
    { sym: "🎟️", weight: 1  }, { sym: "❓", weight: 2  },
  ],
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
    { sym: "🎟️", weight: 1  }, { sym: "❓", weight: 2  },
  ],
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
    { sym: "🎟️", weight: 1  }, { sym: "❓", weight: 2  },
  ],
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
    { sym: "🎟️", weight: 1  }, { sym: "❓", weight: 2  },
  ],
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
    { sym: "🎟️", weight: 1  }, { sym: "❓", weight: 2  },
  ],
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
    { sym: "🎟️", weight: 1  }, { sym: "❓", weight: 2  },
  ],
];

// Bonus-pool utan ❓ och 🎟️ (stabilitet)
const STRIP_POOL_BONUS = REEL_WEIGHTS_BY_REEL.map(col =>
  col.filter(x => x.sym !== "❓" && x.sym !== "🎟️")
);

/** —— PAYTABLE —— */
const PAY: Record<PaySym, Partial<Record<3|4|5|6, number>>> = {
  "🍒": {3:0.20, 4:0.35, 5:0.70, 6:1.40},
  "🍋": {3:0.20, 4:0.35, 5:0.70, 6:1.40},
  "🍇": {3:0.22, 4:0.40, 5:0.80, 6:1.60},
  "🍊": {3:0.22, 4:0.40, 5:0.80, 6:1.60},
  "🥝": {3:0.24, 4:0.45, 5:0.90, 6:1.80},
  "🥥": {3:0.24, 4:0.45, 5:0.90, 6:1.80},
  "🔔": {3:0.35, 4:0.80, 5:1.80, 6:3.60},
  "⭐":  {3:0.45, 4:1.10, 5:2.30, 6:4.80},
  "💎": {3:0.70, 4:1.60, 5:3.50, 6:7.50},
  "🍀": {3:0.90, 4:2.20, 5:5.00, 6:10.00},
};
const PAY_SYMBOLS = Object.keys(PAY) as PaySym[];
const isScatter = (s: Sym) => s === "🎟️";
const isMystery = (s: Sym) => s === "❓";
const key = (r:number,c:number)=>`${r},${c}`;

/** —— RTP/Balance tuning knobs —— */

// BONUS – grundtaper per kolumn, mild dämpning när kolumn får stickies
const BONUS_BASE_COL_SCALE = [1.00, 0.90, 0.85, 0.80, 0.76, 0.72]; // c=0..5
const BONUS_ON_STICK_COL_TAPER = 0.88;

// BONUS – mjuk cap (geometrisk)
const BONUS_PER_EXTRA_STICKY_IN_COL = 0.55;
const N_BONUS_SPINS = 7;

// Target-vikt vid bonusstart
const TARGET_PICK_WEIGHTS: Record<PaySym, number> = (() => {
  const w = globalSymbolWeightsFromReels(STRIP_POOL_BONUS);
  w["🍒"] *= 0.60; w["🍋"] *= 0.60; w["🍇"] *= 0.75; w["🍊"] *= 0.75;
  w["🥝"] *= 0.90; w["🥥"] *= 0.90;
  w["🔔"] *= 1.05; w["⭐"] *= 1.10; w["💎"] *= 1.10; w["🍀"] *= 1.10;
  return w;
})();

// BONUS – vilka symboler ❓ avslöjar per spin
const REVEAL_REVEAL_WEIGHTS: Record<PaySym, number> = {
  "🍒":1.30, "🍋":1.30, "🍇":1.15, "🍊":1.15, "🥝":1.05, "🥥":1.05,
  "🔔":0.95, "⭐":0.85, "💎":0.80, "🍀":0.75
};

// —— BASE —— mystery via burst (inte naturligt på remsan)
const BASE_STRIP_POOL = REEL_WEIGHTS_BY_REEL.map(col =>
  col.map(x => x.sym === "❓" ? { ...x, weight: 0 } : x)
);

// —— BASE: burst-parametrar (håll dem här, vi rör dem inte nu) ——
const BASE_MYSTERY_BURST_CHANCE = 0.16;
const BASE_MYSTERY_BURST_MIN = 6;
const BASE_MYSTERY_BURST_MAX = 14;
const BASE_SECOND_BURST_CHANCE = 0.04;

// Startar kedjor oftare i kolumn 0, ibland i 1
const BASE_FORCE_COL0_IN_BURST_PROB = 0.60;
const BASE_FORCE_COL1_IN_BURST_PROB = 0.35;

// —— BASE: reveal-vikter (grundnivå) ——
const BASE_REVEAL_WEIGHTS: Record<PaySym, number> = {
  "🍒":1.08, "🍋":1.08,
  "🍇":1.18, "🍊":1.18,
  "🥝":1.15, "🥥":1.15,
  "🔔":1.02, "⭐":0.98, "💎":0.92, "🍀":0.90
};

// —— NYTT: kluster-reveal och kontextbias ——
// Sannolikhet att ett burst (kluster) använder EN gemensam symbol (ökar base-RTP)
const BASE_CLUSTER_SINGLE_REVEAL_PROB = 0.19;
// Hur hårt ❓ dras mot symbolen på samma rad i föregående hjul
const BASE_PREV_REEL_SAME_ROW_BOOST = 1.1;   // stark
// Mindre boost om symbolen även fanns på samma rad två hjul bak
const BASE_PREV2_REEL_SAME_ROW_BOOST = 1.4;  // mild
// Lätt global bias mot symboler som redan syns i reel 0 och 1 (tidiga hjul)
const BASE_REEL1_COUNT_ALIGNMENT = 0.15;
const BASE_REEL2_COUNT_ALIGNMENT = 0.15;

function spinGrid(rng: () => number, pool = REEL_WEIGHTS_BY_REEL): Sym[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, (_, c) => pickWeighted(rng, pool[c]).sym as Sym)
  );
}

/** —— Ways (exakt match, inga wilds) —— */
type WinPart = { amount: number; positions: Set<string>; label: string; };
type EvalResult = { total: number; parts: WinPart[]; breakdown: string[]; };

function evaluateWaysDetailed(grid: Sym[][], bet: number): EvalResult {
  const reels: Sym[][] = Array.from({ length: COLS }, (_, c) =>
    Array.from({ length: ROWS }, (_, r) => grid[r][c])
  );
  const bestBySymbol = new Map<string, WinPart>();

  for (const S of PAY_SYMBOLS) {
    if (!reels[0].some(x => x === S)) continue;

    const hitPosPerReel: number[][] = [];
    for (let c = 0; c < COLS; c++) {
      const hits: number[] = [];
      for (let r = 0; r < ROWS; r++) {
        const sym = reels[c][r];
        if (sym === S) hits.push(r);
      }
      if (hits.length === 0) break;
      hitPosPerReel.push(hits);
    }
    if (hitPosPerReel.length < 3) continue;

    let bestLen = 0;
    for (let L = hitPosPerReel.length; L >= 3; L--) {
      const pay = PAY[S]?.[L as 3|4|5|6] ?? 0;
      if (pay > 0) { bestLen = L; break; }
    }
    if (bestLen === 0) continue;

    let ways = 1;
    for (let i = 0; i < bestLen; i++) ways *= hitPosPerReel[i].length;
    const pay = PAY[S]![bestLen as 3|4|5|6]!;
    const amount = ways * pay * bet;

    const positions = new Set<string>();
    for (let c = 0; c < bestLen; c++) {
      for (const r of hitPosPerReel[c]) positions.add(key(r,c));
    }
    const label = `${S} ${bestLen} i rad: ${ways} ways × ${pay} × bet = ${amount.toFixed(2)}`;
    const prev = bestBySymbol.get(S);
    if (!prev || amount > prev.amount) bestBySymbol.set(S, { amount, positions, label });
  }

  const parts = Array.from(bestBySymbol.values()).sort((a,b)=>b.amount-a.amount);
  const total = parts.reduce((s,p)=>s+p.amount, 0);
  const breakdown = parts.map(p=>p.label);
  return { total, parts, breakdown };
}

/** —— Ljud —— */
function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState(false);

  function ensureCtx() {
    if (!ctxRef.current) {
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AC();
    }
    return ctxRef.current!;
  }
  async function enable() {
    const ctx = ensureCtx();
    if (ctx.state === "suspended") await ctx.resume();
    setEnabled(true);
  }
  function play(freq = 520, ms = 55, gain = 0.06, type: OscillatorType = "square") {
    if (!enabled || muted) return;
    const ctx = ensureCtx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(ctx.destination);
    const end = ctx.currentTime + ms / 1000;
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.stop(end + 0.02);
  }
  const click     = () => play(500, 60, 0.06);
  const tickSmall = () => play(780, 50, 0.05);
  const flipSound = () => play(680, 90, 0.07);
  function bling() {
    if (!enabled || muted) return;
    const ctx = ensureCtx();
    const notes = [880, 1200, 1600];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      g.gain.value = 0.06;
      osc.connect(g).connect(ctx.destination);
      const start = ctx.currentTime + i * 0.07;
      const stop = start + 0.12;
      osc.start(start);
      g.gain.exponentialRampToValueAtTime(0.0001, stop);
      osc.stop(stop + 0.01);
    });
  }
  return { enabled, enable, muted, setMuted, click, tickSmall, flipSound, bling };
}

/** —— Reel (kolumn) —— */
const CELL_H = 78;
const CELL_GAP = 6;
const COL_GAP = 12;

type ReelProps = {
  col: number;
  symbols: Sym[];
  offset: number;
  transitionMs: number;
  hl: Set<string>;
  pulse: Set<string>;
};

function Reel({ col, symbols, offset, transitionMs, hl, pulse }: ReelProps) {
  const visibleH = ROWS * CELL_H + (ROWS - 1) * CELL_GAP;

  // Startindex för de sista (synliga) ROWS cellerna i strippen
  const startVisibleIdx = Math.max(0, symbols.length - ROWS);

  return (
    <div
      className="reel"
      style={{
        position: "relative",
        height: visibleH,
        width: CELL_H,              // ✅ lås kolumnens bredd = kvadratiska celler
        overflow: "hidden",
        borderRadius: 16,
        background: "transparent",
      }}
    >
      <div
        className="strip"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: CELL_GAP,
          willChange: "transform",
          transform: `translateY(${offset}px)`,
          transition: transitionMs
            ? `transform ${transitionMs}ms cubic-bezier(.17,.9,.26,1)`
            : "none",
        }}
      >
        {symbols.map((sym, i) => {
          // Beräkna vilken synlig rad (0..ROWS-1) detta element motsvarar EFTER stopp
          const visRow = i - startVisibleIdx; // kan vara negativt / >= ROWS om ej synlig
          const k = visRow >= 0 && visRow < ROWS ? `${visRow},${col}` : null;

          const highlighted = k ? hl.has(k) : false;
          const pulsing = k ? pulse.has(k) : false;

          return (
            <div
              key={i}
              style={{
                width: CELL_H,         // ✅ kvadrat
                height: CELL_H,        // ✅ kvadrat
                boxSizing: "border-box",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.7rem",
                lineHeight: 1,
                background: highlighted ? "rgba(240,180,0,0.10)" : "transparent",
                border: highlighted ? "2px solid rgba(240,180,0,0.65)" : "1px solid rgba(255,255,255,0.12)",
                boxShadow: highlighted
                  ? "0 0 0 3px rgba(240,180,0,0.20)"
                  : "0 2px 10px rgba(0,0,0,0.25)",

                transform: pulsing ? "scale(1.04)" : "scale(1)",
                transition:
                  "background 120ms ease, transform 120ms ease, box-shadow 120ms ease, border 120ms ease",
                userSelect: "none",
              }}
              className={pulsing ? "pulse" : ""}
            >
              <SymbolSprite sym={sym} />
            </div>
          );
        })}
      </div>
    </div>
  );
}


/** —— BONUS taper helpers —— */
function clonePool(pool: Array<Array<{sym: Sym; weight: number}>>) {
  return pool.map(col => col.map(x => ({ sym: x.sym, weight: x.weight })));
}
function scaleTargetInCol(
  pool: Array<Array<{sym: Sym; weight: number}>>,
  colIdx: number,
  target: PaySym,
  factor: number
) {
  const col = pool[colIdx];
  for (const cell of col) {
    if (cell.sym === target) cell.weight *= factor;
  }
}

/** —— BASE helpers: skapa bursts —— */
type Pos = [number, number];
function randomWalkCluster(rng: ()=>number, n: number): Pos[] {
  const seen = new Set<string>();
  const cells: Pos[] = [];
  let cr = Math.floor(rng()*ROWS), cc = Math.floor(rng()*COLS);
  for (let i = 0; i < n; i++) {
    const k = `${cr},${cc}`;
    if (!seen.has(k)) {
      seen.add(k);
      cells.push([cr,cc]);
    }
    const step = [[1,0],[-1,0],[0,1],[0,-1]][Math.floor(rng()*4)];
    cr = Math.max(0, Math.min(ROWS-1, cr + step[0]));
    cc = Math.max(0, Math.min(COLS-1, cc + step[1]));
  }
  return cells;
}

/** —— App —— */
export default function App() {
  const [slowMode, setSlowMode] = useState(false);
  const speedFactor = slowMode ? 1.8 : 1;

  const [seed, setSeed] = useState(20250828);
  const rng = useMemo(() => mulberry32(seed), [seed]);

  // Reels
  const SPIN_EXTRA_ROWS = 18;
  const [reelStrips, setReelStrips] = useState<Sym[][]>(Array.from({length: COLS}, () => []));
  const [reelOffset, setReelOffset] = useState<number[]>(Array.from({length: COLS}, () => 0));
  const [reelDur, setReelDur] = useState<number[]>(Array.from({length: COLS}, () => 0));

  // Grid/Vinster/UI
  const [resultGrid, setResultGrid] = useState<Sym[][]>(() => spinGrid(rng));
  const [displayGrid, setDisplayGrid] = useState<Sym[][]>(resultGrid);
  const [balance, setBalance] = useState(100);
  const [bet, setBet] = useState(1);
  const [lastWin, setLastWin] = useState(0);
  const [hl, setHl] = useState<Set<string>>(new Set());
  const [breakdown, setBreakdown] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [pulseKeys, setPulseKeys] = useState<Set<string>>(new Set());
  const [flipKeys, setFlipKeys] = useState<Set<string>>(new Set());

  // BONUS state
  const [bonusActive, setBonusActive] = useState(false);
  const [bonusSpinsLeft, setBonusSpinsLeft] = useState(0);
  const [bonusSticky, setBonusSticky] = useState<Set<string>>(new Set()); // "r,c"
  const [bonusTotalWin, setBonusTotalWin] = useState(0);
  const [bonusTarget, setBonusTarget] = useState<PaySym | null>(null);

  // BUY modal
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyBet, setBuyBet] = useState<number>(1);

  // Overlay (bonus reveal)
  const [overlay, setOverlay] = useState<string | null>(null);

  const { enabled: soundOn, enable: enableSound, muted, setMuted, click, tickSmall, flipSound, bling } = useAudio();

  // Bet-ladder
  const format = (n:number) => n.toFixed(2);
  const BET_LADDER = [0.1, 0.2, 0.3, 0.5, 0.8, 1, 1.5, 2, 3, 5, 10, 20, 50, 100];
  const incBet = () => setBet(b => {
    const i = BET_LADDER.findIndex(x => x >= b - 1e-9);
    return i < BET_LADDER.length - 1 ? BET_LADDER[i+1] : BET_LADDER[i];
  });
  const decBet = () => setBet(b => {
    const i = BET_LADDER.findIndex(x => x >= b - 1e-9);
    return i > 0 ? BET_LADDER[i-1] : BET_LADDER[0];
  });
  const incBuy = () => setBuyBet(b => {
    const i = BET_LADDER.findIndex(x => x >= b - 1e-9);
    return i < BET_LADDER.length - 1 ? BET_LADDER[i+1] : BET_LADDER[i];
  });
  const decBuy = () => setBuyBet(b => {
    const i = BET_LADDER.findIndex(x => x >= b - 1e-9);
    return i > 0 ? BET_LADDER[i-1] : BET_LADDER[0];
  });

  // pulse reset
  useEffect(() => {
    if (hl.size === 0) return;
    setPulseKeys(new Set(hl));
    const t = setTimeout(() => setPulseKeys(new Set()), 700);
    return () => clearTimeout(t);
  }, [hl]);

  const delay = (ms:number) => new Promise(r => setTimeout(r, ms));

  async function animateToGrid(
    target: Sym[][],
    opts?: { pool?: Array<Array<{sym: Sym; weight: number}>> }
  ) {
    const pool = opts?.pool ?? REEL_WEIGHTS_BY_REEL;

    const strips: Sym[][] = [];
    for (let c = 0; c < COLS; c++) {
      const randRows: Sym[] = [];
      for (let i = 0; i < SPIN_EXTRA_ROWS; i++) {
        for (let r = 0; r < ROWS; r++) {
          randRows.push(pickWeighted(rng, pool[c]).sym as Sym);
        }
      }
      for (let r = 0; r < ROWS; r++) randRows.push(target[r][c]);
      strips.push(randRows);
    }

    setDisplayGrid(target);
    setReelStrips(strips);

    const VIEW_PAD = 4;
    const endOffsets = strips.map(
      s => -((s.length - ROWS) * (CELL_H + CELL_GAP)) - VIEW_PAD
    );
    const base = 900*speedFactor, step = 140*speedFactor;
    const durs = Array.from({ length: COLS }, (_, c) => base + c * step);

    setReelDur(Array(COLS).fill(0));
    setReelOffset(Array(COLS).fill(0));
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    setReelDur(durs);
    setReelOffset(endOffsets);
    durs.forEach(ms => setTimeout(() => click(), ms));
    await new Promise(r => setTimeout(r, durs[durs.length - 1] + 30));
  }

  /** ——— Bas-spinn ——— */
  async function spin() {
    if (spinning || balance < bet || bonusActive) return;
    setSpinning(true);
    setHl(new Set());
    setBreakdown([]);
    setLastWin(0);
    if (!soundOn) await enableSound();

    // Base spinn från BASE_STRIP_POOL (inga naturliga ❓)
    const target = spinGrid(rng, BASE_STRIP_POOL);
    setResultGrid(target);
    setSeed(s => (s + 1) | 0);
    await animateToGrid(target, { pool: BASE_STRIP_POOL });

    // — BASE mystery: BURSTS + ev. extra burst —
    let working = target.map(row => row.slice()) as Sym[][];
    const bursts: Pos[][] = [];

    if (rng() < BASE_MYSTERY_BURST_CHANCE) {
      const n = Math.floor(BASE_MYSTERY_BURST_MIN + rng()*(BASE_MYSTERY_BURST_MAX - BASE_MYSTERY_BURST_MIN + 1));
      const cells = randomWalkCluster(rng, n);
      // tryck in start i col 0 / 1 ibland
      if (rng() < BASE_FORCE_COL0_IN_BURST_PROB && !cells.some(([_,c]) => c===0)) {
        cells.push([Math.floor(rng()*ROWS), 0]);
      }
      if (rng() < BASE_FORCE_COL1_IN_BURST_PROB && !cells.some(([_,c]) => c===1)) {
        cells.push([Math.floor(rng()*ROWS), 1]);
      }
      bursts.push(cells);
    }
    if (rng() < BASE_SECOND_BURST_CHANCE) {
      const n2 = 3 + Math.floor(rng()*4);
      const cells2 = randomWalkCluster(rng, n2);
      if (rng() < 0.25 && !cells2.some(([_,c]) => c===0)) {
        cells2.push([Math.floor(rng()*ROWS), 0]);
      }
      bursts.push(cells2);
    }

    // applicera ❓
    for (const cluster of bursts) {
      for (const [r,c] of cluster) working[r][c] = "❓";
    }

    // —— Flippar ❓: kluster-reveal + kontextbias (rad + reel1/2 totals) ——
    const mystPos: Array<[number,number]> = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (isMystery(working[r][c])) mystPos.push([r,c]);
    }

    if (mystPos.length) {
      setFlipKeys(new Set(mystPos.map(([r,c])=>key(r,c))));
      flipSound();
      await delay(220*speedFactor);

      // global counts på reel 0 & 1
      const reel1: Record<PaySym, number> =
        {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
      const reel2: Record<PaySym, number> =
        {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
      for (let rr = 0; rr < ROWS; rr++) {
        const s0 = working[rr][0];
        const s1 = working[rr][1];
        if (s0 !== "❓" && s0 !== "🎟️") reel1[s0 as PaySym]++;
        if (s1 !== "❓" && s1 !== "🎟️") reel2[s1 as PaySym]++;
      }

      // hjälp-funktion för att bygga vikter för en cell
      function buildWeightsForCell(r:number, c:number): Record<PaySym, number> {
        const dyn: Record<PaySym, number> = { ...BASE_REVEAL_WEIGHTS };
        // global tidig-reel bias
        (Object.keys(dyn) as PaySym[]).forEach(sym => {
          dyn[sym] *= (1 + BASE_REEL1_COUNT_ALIGNMENT * reel1[sym]);
          dyn[sym] *= (1 + BASE_REEL2_COUNT_ALIGNMENT * reel2[sym]);
        });
        // samma rad – direkt vänster
        if (c > 0) {
          const left = working[r][c-1];
          if (left !== "❓" && left !== "🎟️") {
            dyn[left as PaySym] *= BASE_PREV_REEL_SAME_ROW_BOOST;
          }
        }
        // samma rad – två vänster
        if (c > 1) {
          const left2 = working[r][c-2];
          if (left2 !== "❓" && left2 !== "🎟️") {
            dyn[left2 as PaySym] *= BASE_PREV2_REEL_SAME_ROW_BOOST;
          }
        }
        return dyn;
      }

      // 1) för varje burst: ibland använd EN gemensam symbol
      for (const cluster of bursts) {
        if (cluster.length === 0) continue;
        if (rng() < BASE_CLUSTER_SINGLE_REVEAL_PROB) {
          // använd mitten-cellen för att hämta en representativ kontext
          const mid = cluster[Math.floor(cluster.length/2)];
          const dyn = buildWeightsForCell(mid[0], mid[1]);
          const sym = pickPaySymbolWeighted(rng, dyn);
          for (const [r,c] of cluster) {
            working[r][c] = sym;
          }
        } else {
          // oberoende – men med kontextbias per cell
          for (const [r,c] of cluster) {
            const dyn = buildWeightsForCell(r,c);
            working[r][c] = pickPaySymbolWeighted(rng, dyn);
          }
        }
      }

      setDisplayGrid(working);
      setTimeout(() => setFlipKeys(new Set()), 100);
    } else {
      setDisplayGrid(working);
    }

    // utvärdera
    const res = evaluateWaysDetailed(working, bet);
    setLastWin(res.total);
    setBalance(b => b - bet + res.total);

    // highlight
    if (res.parts.length > 0) {
      for (const part of res.parts) {
        setHl(part.positions);
        setBreakdown([part.label]);
        tickSmall();
        await delay(700*speedFactor);
      }
      const u = new Set<string>();
      res.parts.forEach(p => p.positions.forEach(x => u.add(x)));
      setHl(u);
      setBreakdown(res.breakdown);
      bling();
    } else {
      setHl(new Set());
      setBreakdown([]);
    }

    // SCATTER → bonus
    const scatters = working.flat().filter(isScatter).length;
    if (scatters >= 3) {
      const targetSym = pickPaySymbolWeighted(rng, TARGET_PICK_WEIGHTS);
      await enterBonusMystery(targetSym, false);
    }

    setSpinning(false);
  }

  /** ——— BONUS: Mystery Sticky med taper + mjuk cap —— */
  const [overlayShowSymbol, setOverlayShowSymbol] = useState<boolean>(false);
  const [overlaySymbol, setOverlaySymbol] = useState<PaySym | null>(null);

  async function enterBonusMystery(targetSym: PaySym, fromBuy: boolean) {
    setBonusActive(true);
    setBonusTarget(targetSym);
    setBonusSpinsLeft(N_BONUS_SPINS);
    setBonusSticky(new Set());
    setBonusTotalWin(0);
    setHl(new Set());
    setBreakdown([`${fromBuy ? "BONUS BUY" : "BONUS TRIGGER"} — Mystery Sticky Bonus`]);

    // 🎯 Dramatiskt target-reveal (endast i bonus)
    const revealSymbols = PAY_SYMBOLS;
    setOverlay("🎯 Choosing target...");
    await delay(500);
    for (let i = 0; i < 10; i++) {
      const fakeSym = revealSymbols[Math.floor(rng()*revealSymbols.length)];
      setOverlay(`🎯 Target: ${fakeSym}`);
      await delay(150 + i*30);
    }
    setOverlay(`🎯 Target: ${targetSym}`);
    bling();
    await delay(1200);
    setOverlay(null);

    let running = 0;
    let sticky = new Set<string>();
    const stickyCountByCol = Array(COLS).fill(0);

    // bonusPool som utarmar target
    let bonusPool = clonePool(STRIP_POOL_BONUS);
    for (let c = 1; c < COLS; c++) {
      scaleTargetInCol(bonusPool, c, targetSym, BONUS_BASE_COL_SCALE[c]);
    }

    for (let i = 0; i < N_BONUS_SPINS; i++) {
      const raw = spinGrid(rng, bonusPool);
      await animateToGrid(raw, { pool: bonusPool });

      const newStickyCols = new Map<number, number>(); // col -> antal nya
      for (let r = 0; r < ROWS; r++) for (let c = 1; c < COLS; c++) {
        if (raw[r][c] === targetSym) {
          const k = `${r},${c}`;
          if (!sticky.has(k)) {
            sticky.add(k);
            newStickyCols.set(c, (newStickyCols.get(c) || 0) + 1);
          }
        }
      }

      if (newStickyCols.size > 0) {
        for (const [c, newly] of newStickyCols) {
          // Grund-dämpning när kolumnen får stickies denna spin
          scaleTargetInCol(bonusPool, c, targetSym, BONUS_ON_STICK_COL_TAPER);
          // Geometrisk extra-dämpning per redan existerande sticky i kolumnen (mjuk cap)
          for (let k = 0; k < stickyCountByCol[c]; k++) {
            scaleTargetInCol(bonusPool, c, targetSym, BONUS_PER_EXTRA_STICKY_IN_COL);
          }
          stickyCountByCol[c] += newly;
        }
      }

      setBonusSticky(new Set(sticky));
      await delay(120*speedFactor);

      const revealSym = pickPaySymbolWeighted(rng, REVEAL_REVEAL_WEIGHTS);
      setOverlaySymbol(revealSym);
      setOverlayShowSymbol(true);

      const revealed = raw.map(row => row.slice()) as Sym[][];
      for (const k of sticky) {
        const [rr, cc] = k.split(",").map(Number);
        revealed[rr][cc] = revealSym;
      }

      flipSound();
      await delay(240*speedFactor);

      const res = evaluateWaysDetailed(revealed, bet);
      running += res.total;
      setBonusTotalWin(running);
      setLastWin(res.total);

      if (res.parts.length > 0) {
        for (const part of res.parts) {
          setHl(part.positions);
          setBreakdown([`Bonus ${i+1}/${N_BONUS_SPINS} — ` + part.label]);
          tickSmall();
          await delay(550*speedFactor);
        }
        const u = new Set<string>();
        res.parts.forEach(p => p.positions.forEach(x => u.add(x)));
        setHl(u);
        await delay(280*speedFactor);
      } else {
        setHl(new Set());
        setBreakdown([`Bonus ${i+1}/${N_BONUS_SPINS} — No win`]);
        await delay(240*speedFactor);
      }

      setOverlayShowSymbol(false);
      setBonusSpinsLeft(N_BONUS_SPINS - (i + 1));
    }

    setBalance(b => b + running);
    bling();
    setBreakdown([`BONUS ENDED — 🎯 ${targetSym} • Total: ${format(running)}`]);

    setBonusActive(false);
    setBonusSticky(new Set());
    setBonusSpinsLeft(0);
    setBonusTarget(null);
    setOverlaySymbol(null);
  }

  /** ——— BUY modal control ——— */
  function openBuy() {
    if (spinning || bonusActive) return;
    setBuyBet(bet);
    setBuyOpen(true);
  }
  async function confirmBuy() {
    if (spinning || bonusActive) return;
    const cost = 100 * buyBet;
    if (balance < cost) return;
    setBuyOpen(false);
    setBalance(b => b - cost);
    setBet(buyBet);
    const targetSym = pickPaySymbolWeighted(rng, TARGET_PICK_WEIGHTS);
    if (!soundOn) await enableSound();
    await enterBonusMystery(targetSym, true);
  }

  // —— quickSim (base, bonus, och total) ——
  useEffect(() => {
    // @ts-ignore
    window.quickSim = (spins = 10000, betSim = 1) => {
      const rngSim = mulberry32(123456);
      let totalWin = 0, hits = 0;
      for (let i = 0; i < spins; i++) {
        // Base spinn från BASE_STRIP_POOL (inga naturliga ❓)
        let grid = spinGrid(rngSim, BASE_STRIP_POOL);

        // bursts
        const burstsSim: Pos[][] = [];
        if (rngSim() < BASE_MYSTERY_BURST_CHANCE) {
          const n = Math.floor(BASE_MYSTERY_BURST_MIN + rngSim()*(BASE_MYSTERY_BURST_MAX - BASE_MYSTERY_BURST_MIN + 1));
          const cells = randomWalkCluster(rngSim, n);
          if (rngSim() < BASE_FORCE_COL0_IN_BURST_PROB && !cells.some(([_,c]) => c===0)) {
            cells.push([Math.floor(rngSim()*ROWS), 0]);
          }
          if (rngSim() < BASE_FORCE_COL1_IN_BURST_PROB && !cells.some(([_,c]) => c===1)) {
            cells.push([Math.floor(rngSim()*ROWS), 1]);
          }
          burstsSim.push(cells);
        }
        if (rngSim() < BASE_SECOND_BURST_CHANCE) {
          const n2 = 3 + Math.floor(rngSim()*4);
          const cells2 = randomWalkCluster(rngSim, n2);
          if (rngSim() < 0.25 && !cells2.some(([_,c]) => c===0)) {
            cells2.push([Math.floor(rngSim()*ROWS), 0]);
          }
          burstsSim.push(cells2);
        }
        for (const cl of burstsSim) for (const [r,c] of cl) grid[r][c] = "❓";

        // global reel 0/1 counts
        const reel1: Record<PaySym, number> =
          {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
        const reel2: Record<PaySym, number> =
          {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
        for (let rr = 0; rr < ROWS; rr++) {
          const s0 = grid[rr][0];
          const s1 = grid[rr][1];
          if (s0 !== "❓" && s0 !== "🎟️") reel1[s0 as PaySym]++;
          if (s1 !== "❓" && s1 !== "🎟️") reel2[s1 as PaySym]++;
        }
        function buildWeightsForCellSim(r:number, c:number): Record<PaySym, number> {
          const dyn: Record<PaySym, number> = { ...BASE_REVEAL_WEIGHTS };
          (Object.keys(dyn) as PaySym[]).forEach(sym => {
            dyn[sym] *= (1 + BASE_REEL1_COUNT_ALIGNMENT * reel1[sym]);
            dyn[sym] *= (1 + BASE_REEL2_COUNT_ALIGNMENT * reel2[sym]);
          });
          if (c > 0) {
            const left = grid[r][c-1];
            if (left !== "❓" && left !== "🎟️") dyn[left as PaySym] *= BASE_PREV_REEL_SAME_ROW_BOOST;
          }
          if (c > 1) {
            const left2 = grid[r][c-2];
            if (left2 !== "❓" && left2 !== "🎟️") dyn[left2 as PaySym] *= BASE_PREV2_REEL_SAME_ROW_BOOST;
          }
          return dyn;
        }

        // kluster-reveal
        for (const cl of burstsSim) {
          if (cl.length === 0) continue;
          if (rngSim() < BASE_CLUSTER_SINGLE_REVEAL_PROB) {
            const mid = cl[Math.floor(cl.length/2)];
            const dyn = buildWeightsForCellSim(mid[0], mid[1]);
            const sym = pickPaySymbolWeighted(rngSim, dyn);
            for (const [r,c] of cl) grid[r][c] = sym;
          } else {
            for (const [r,c] of cl) {
              const dyn = buildWeightsForCellSim(r,c);
              grid[r][c] = pickPaySymbolWeighted(rngSim, dyn);
            }
          }
        }

        const res = evaluateWaysDetailed(grid, betSim);
        totalWin += res.total;
        if (res.total > 0) hits++;
      }
      const out = {
        spins, bet: betSim, totalBet: spins * betSim,
        totalWin, hitRate: hits/spins,
        rtp: (totalWin/(spins*betSim))*100
      };
      console.log("Base quickSim", out);
      return out;
    };
  
    // @ts-ignore
    window.quickSimBonus = (rounds = 10000, betSim = 1) => {
      const rngSim = mulberry32(654321);
      let totalWin = 0;
      const byTarget: Record<PaySym, { rounds: number; sum: number }> =
        { "🍒":{rounds:0,sum:0},"🍋":{rounds:0,sum:0},"🍇":{rounds:0,sum:0},"🍊":{rounds:0,sum:0},
          "🥝":{rounds:0,sum:0},"🥥":{rounds:0,sum:0},"🔔":{rounds:0,sum:0},"⭐":{rounds:0,sum:0},"💎":{rounds:0,sum:0},"🍀":{rounds:0,sum:0} };
  
      for (let i = 0; i < rounds; i++) {
        const targetSym = pickPaySymbolWeighted(rngSim, TARGET_PICK_WEIGHTS);
        let sticky = new Set<string>();
        let running = 0;
        const stickyCountByCol = Array(COLS).fill(0);

        // Bonuspool + grundtaper
        let bonusPool = clonePool(STRIP_POOL_BONUS);
        for (let c = 1; c < COLS; c++) scaleTargetInCol(bonusPool, c, targetSym, BONUS_BASE_COL_SCALE[c]);

        for (let s = 0; s < N_BONUS_SPINS; s++) {
          const raw = spinGrid(rngSim, bonusPool);

          const newStickyCols = new Map<number, number>(); // col -> antal nya
          for (let r = 0; r < ROWS; r++) for (let c = 1; c < COLS; c++) {
            if (raw[r][c] === targetSym) {
              const k = `${r},${c}`;
              if (!sticky.has(k)) {
                sticky.add(k);
                newStickyCols.set(c, (newStickyCols.get(c) || 0) + 1);
              }
            }
          }
          if (newStickyCols.size > 0) {
            for (const [c, newly] of newStickyCols) {
              scaleTargetInCol(bonusPool, c, targetSym, BONUS_ON_STICK_COL_TAPER);
              for (let k = 0; k < stickyCountByCol[c]; k++) {
                scaleTargetInCol(bonusPool, c, targetSym, BONUS_PER_EXTRA_STICKY_IN_COL);
              }
              stickyCountByCol[c] += newly;
            }
          }
  
          const revealSym = pickPaySymbolWeighted(rngSim, REVEAL_REVEAL_WEIGHTS);
          const revealed = raw.map(row => row.slice()) as Sym[][];
          for (const k of sticky) {
            const [rr, cc] = k.split(",").map(Number);
            revealed[rr][cc] = revealSym;
          }
  
          const res = evaluateWaysDetailed(revealed, betSim);
          running += res.total;
        }
        totalWin += running;
        byTarget[targetSym].rounds++;
        byTarget[targetSym].sum += running;
      }
  
      const cost = 100 * betSim;
      const avgWin = totalWin / rounds;
      const rtp = (avgWin / cost) * 100;

      const perTarget = Object.fromEntries(Object.entries(byTarget).map(([sym, v]) => [sym, {
        avgWin: v.rounds ? v.sum/v.rounds : 0,
        rtp: v.rounds ? ((v.sum/v.rounds)/(cost))*100 : 0
      }]));
      console.log("Per-target stats", perTarget);
  
      const out = {
        rounds, bet: betSim, cost, avgWin, rtp, perTarget
      };
      console.log("Bonus quickSim", out);
      return out;
    };

    // @ts-ignore
    window.quickSimOverall = (spins = 20000, betSim = 1) => {
      const rngSim = mulberry32(777777);
      let totalBaseWin = 0;
      let totalBonusWin = 0;
      let triggers = 0;

      for (let i = 0; i < spins; i++) {
        // Base spinn ur BASE_STRIP_POOL
        let grid = spinGrid(rngSim, BASE_STRIP_POOL);

        // bursts
        const burstsSim: Pos[][] = [];
        if (rngSim() < BASE_MYSTERY_BURST_CHANCE) {
          const n = Math.floor(BASE_MYSTERY_BURST_MIN + rngSim()*(BASE_MYSTERY_BURST_MAX - BASE_MYSTERY_BURST_MIN + 1));
          const cells = randomWalkCluster(rngSim, n);
          if (rngSim() < BASE_FORCE_COL0_IN_BURST_PROB && !cells.some(([_,c]) => c===0)) {
            cells.push([Math.floor(rngSim()*ROWS), 0]);
          }
          if (rngSim() < BASE_FORCE_COL1_IN_BURST_PROB && !cells.some(([_,c]) => c===1)) {
            cells.push([Math.floor(rngSim()*ROWS), 1]);
          }
          burstsSim.push(cells);
        }
        if (rngSim() < BASE_SECOND_BURST_CHANCE) {
          const n2 = 3 + Math.floor(rngSim()*4);
          const cells2 = randomWalkCluster(rngSim, n2);
          if (rngSim() < 0.25 && !cells2.some(([_,c]) => c===0)) {
            cells2.push([Math.floor(rngSim()*ROWS), 0]);
          }
          burstsSim.push(cells2);
        }
        for (const cl of burstsSim) for (const [r,c] of cl) grid[r][c] = "❓";

        // reel 0/1 counts
        const reel1: Record<PaySym, number> =
          {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
        const reel2: Record<PaySym, number> =
          {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
        for (let rr = 0; rr < ROWS; rr++) {
          const s0 = grid[rr][0];
          const s1 = grid[rr][1];
          if (s0 !== "❓" && s0 !== "🎟️") reel1[s0 as PaySym]++;
          if (s1 !== "❓" && s1 !== "🎟️") reel2[s1 as PaySym]++;
        }
        function buildWeightsForCellSim(r:number, c:number): Record<PaySym, number> {
          const dyn: Record<PaySym, number> = { ...BASE_REVEAL_WEIGHTS };
          (Object.keys(dyn) as PaySym[]).forEach(sym => {
            dyn[sym] *= (1 + BASE_REEL1_COUNT_ALIGNMENT * reel1[sym]);
            dyn[sym] *= (1 + BASE_REEL2_COUNT_ALIGNMENT * reel2[sym]);
          });
          if (c > 0) {
            const left = grid[r][c-1];
            if (left !== "❓" && left !== "🎟️") dyn[left as PaySym] *= BASE_PREV_REEL_SAME_ROW_BOOST;
          }
          if (c > 1) {
            const left2 = grid[r][c-2];
            if (left2 !== "❓" && left2 !== "🎟️") dyn[left2 as PaySym] *= BASE_PREV2_REEL_SAME_ROW_BOOST;
          }
          return dyn;
        }
        // kluster-reveal
        for (const cl of burstsSim) {
          if (cl.length === 0) continue;
          if (rngSim() < BASE_CLUSTER_SINGLE_REVEAL_PROB) {
            const mid = cl[Math.floor(cl.length/2)];
            const dyn = buildWeightsForCellSim(mid[0], mid[1]);
            const sym = pickPaySymbolWeighted(rngSim, dyn);
            for (const [r,c] of cl) grid[r][c] = sym;
          } else {
            for (const [r,c] of cl) {
              const dyn = buildWeightsForCellSim(r,c);
              grid[r][c] = pickPaySymbolWeighted(rngSim, dyn);
            }
          }
        }

        // Base vinst
        const baseRes = evaluateWaysDetailed(grid, betSim);
        totalBaseWin += baseRes.total;

        // Naturlig bonus-trigger?
        const sc = grid.flat().filter(s => s === "🎟️").length;
        if (sc >= 3) {
          triggers++;

          // Bonusrunda (speglar quickSimBonus)
          const targetSym = pickPaySymbolWeighted(rngSim, TARGET_PICK_WEIGHTS);

          let bonusPool = STRIP_POOL_BONUS.map(col => col.map(x => ({...x})));
          for (let c = 1; c < COLS; c++) {
            for (const cell of bonusPool[c]) if (cell.sym === targetSym) cell.weight *= BONUS_BASE_COL_SCALE[c];
          }
          const sticky = new Set<string>();
          const stickyCountByCol = Array(COLS).fill(0);
          let roundWin = 0;

          for (let s = 0; s < N_BONUS_SPINS; s++) {
            const raw = spinGrid(rngSim, bonusPool);
            const newStickyCols = new Map<number, number>();
            for (let r = 0; r < ROWS; r++) for (let c = 1; c < COLS; c++) {
              if (raw[r][c] === targetSym) {
                const k = `${r},${c}`;
                if (!sticky.has(k)) {
                  sticky.add(k);
                  newStickyCols.set(c, (newStickyCols.get(c) || 0) + 1);
                }
              }
            }
            if (newStickyCols.size > 0) {
              for (const [c, newly] of newStickyCols) {
                for (const cell of bonusPool[c]) if (cell.sym === targetSym) cell.weight *= BONUS_ON_STICK_COL_TAPER;
                for (let k = 0; k < stickyCountByCol[c]; k++) {
                  for (const cell of bonusPool[c]) if (cell.sym === targetSym) cell.weight *= BONUS_PER_EXTRA_STICKY_IN_COL;
                }
                stickyCountByCol[c] += newly;
              }
            }

            const revealSym = pickPaySymbolWeighted(rngSim, REVEAL_REVEAL_WEIGHTS);
            const revealed = raw.map(row => row.slice()) as Sym[][];
            for (const k of sticky) {
              const [rr, cc] = k.split(",").map(Number);
              revealed[rr][cc] = revealSym;
            }
            const res = evaluateWaysDetailed(revealed, betSim);
            roundWin += res.total;
          }

          totalBonusWin += roundWin;
        }
      }

      const totalWin = totalBaseWin + totalBonusWin;
      const rtp = (totalWin / (spins * betSim)) * 100;
      const pTrigger = triggers / spins;
      return {
        spins, bet: betSim,
        baseWin: totalBaseWin, bonusWin: totalBonusWin,
        totalWin, rtp,
        triggerRate: pTrigger
      };
    };
  }, []);
  

  /** ——— UI —— */
  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", fontFamily: "system-ui, Arial" }}>
      <style>{`
        @keyframes pulseAnim { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
        .pulse { animation: pulseAnim 0.7s ease-out; }
        @keyframes flipAnim { 0%{transform:rotateX(0)} 50%{transform:rotateX(90deg)} 100%{transform:rotateX(0)} }
        .flip { animation: flipAnim 0.26s ease-in-out; }
      `}</style>
  
      <div style={{
        background: "linear-gradient(#0f1215,#0b0d10)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 18,
        padding: 16,
        color: "#f6f7f9",
        boxShadow: "0 20px 60px rgba(0,0,0,.45)"
      }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginBottom: 8 }}>
          <div style={{ fontSize: 22 }}>🎰</div>
          <h1 style={{ margin: 0, fontWeight: 800 }}>Crazy Slot — 6×4</h1>
  
          {/* Sound toggle */}
          <button
            onClick={() => { if (!soundOn) enableSound(); else setMuted(m => !m); }}
            style={{
              marginLeft: 12, padding: "6px 10px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,.12)",
              background: muted ? "#fde1e1" : "#dff7e6",
              cursor: "pointer", fontWeight: 700
            }}
          >
            {muted ? "🔇 Muted" : "🔊 Sound ON"}
          </button>
  
          <button
            onClick={() => setSlowMode(s => !s)}
            style={{
              marginLeft: 12, padding: "6px 10px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,.12)",
              background: slowMode ? "#ffe0b3" : "#e0e0e0",
              cursor: "pointer", fontWeight: 700
            }}
          >
            {slowMode ? "🐢 Slow Mode" : "⚡ Normal Speed"}
          </button>
        </div>
  
        {/* Reels + STICKY OVERLAY */}
        <div style={{ position: "relative", margin: "16px 0 18px" }}>
          <div
            style={{
              display:"grid",
              gridTemplateColumns:`repeat(${COLS}, ${CELL_H}px)`, // ✅ lås kolumnbredd
              gap: COL_GAP,
              alignItems: "start",
              justifyContent: "center", // ✅ centrera griden
            }}
          >
            {Array.from({ length: COLS }, (_, c) => (
              <Reel
                key={c}
                col={c}
                symbols={reelStrips[c].length ? reelStrips[c] : Array.from({length:ROWS},(_,i)=>displayGrid[i][c])}
                offset={reelStrips[c].length ? reelOffset[c] : 0}
                transitionMs={reelStrips[c].length ? reelDur[c] : 0}
                hl={hl}
                pulse={flipKeys.size ? flipKeys : pulseKeys}
              />
            ))}
          </div>
  
          {/* Sticky overlay (bonus) */}
          {bonusActive && bonusSticky.size > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                display: "grid",
                gridTemplateColumns: `repeat(${COLS}, ${CELL_H}px)`, // ✅ matcha kolumnbredd
                gap: `${COL_GAP}px`,
                justifyContent: "center", // ✅ centrera overlay-griden
              }}
            >
              {Array.from({ length: COLS }, (_, c) => (
                <div
                  key={c}
                  style={{
                    position:"relative",
                    width: CELL_H,                                              // ✅ match bredd
                    height: ROWS*CELL_H + (ROWS-1)*CELL_GAP
                  }}
                >
                  <div style={{
                    position:"absolute", inset:0,
                    display:"grid",
                    gridTemplateRows: `repeat(${ROWS}, ${CELL_H}px)`,
                    rowGap: `${CELL_GAP}px`,
                  }}>
                    {Array.from({ length: ROWS }, (_, r) => {
                      const k = key(r,c);
                      const isSticky = bonusSticky.has(k);
                      if (!isSticky) return <div key={r} />;
                      const showSym = overlayShowSymbol && overlaySymbol ? overlaySymbol : "❓";
                      return (
                        <div key={r} style={{
                          display:"flex", alignItems:"center", justifyContent:"center",
                          borderRadius: 14,
                          background: "transparent",
                          border: "2px solid rgba(100,160,255,0.70)",
                          boxShadow: "0 0 0 3px rgba(100,160,255,0.18)",

                          fontSize: "1.7rem",
                          fontWeight: 700,
                        }}>
                          <SymbolSprite sym={showSym as Sym} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        {/* Bottom bar */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center",
          gap: 16, background:"#0e1113", border:"1px solid rgba(255,255,255,.06)",
          borderRadius: 14, padding:"10px 14px"
        }}>
          {/* Bet */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:10 }}>
            <button onClick={decBet} disabled={spinning || bonusActive || bet<=BET_LADDER[0]}
              style={pillStyle}>−</button>
            <div style={betValueStyle}>{format(bet)}</div>
            <button onClick={incBet} disabled={spinning || bonusActive || bet>=BET_LADDER[BET_LADDER.length-1]}
              style={pillStyle}>+</button>
          </div>
  
          {/* Spin / Buy */}
          <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
            <button
              onClick={spin}
              disabled={spinning || bonusActive || balance < bet}
              style={{
                padding:"12px 22px", borderRadius:999,
                border:"1px solid rgba(255,255,255,.12)",
                fontWeight:800, background:"#e7f0ff", color:"#111",
                minWidth:140, boxShadow:"0 6px 18px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.7)",
                cursor: (!spinning && !bonusActive && balance >= bet) ? "pointer" : "not-allowed",
                opacity: (!spinning && !bonusActive && balance >= bet) ? 1 : 0.6
              }}
            >
              {spinning ? "SPIN..." : "SPIN"}
            </button>
  
            <button
              onClick={() => { if (!spinning && !bonusActive) setBuyOpen(true); }}
              disabled={spinning || bonusActive}
              style={{
                padding:"12px 18px", borderRadius:12,
                border:"1px solid rgba(255,255,255,.12)",
                fontWeight:800, background:"#ffe9b5", color:"#111",
                minWidth:140,
                cursor: (!spinning && !bonusActive) ? "pointer" : "not-allowed",
                opacity: (!spinning && !bonusActive) ? 1 : 0.6
              }}
              title="Buy Mystery Sticky Bonus — 100× bet"
            >
              BUY BONUS 100×
            </button>
          </div>
  
          {/* Stats */}
          <div style={{ display:"flex", justifyContent:"flex-end", gap:18 }}>
            {bonusActive && (
              <div>
                <b>Bonus:</b> {bonusSpinsLeft} kvar • {bonusTarget ? `🎯 ${bonusTarget}` : ""} • {format(bonusTotalWin)}
              </div>
            )}
            <div><b>Vinst:</b> {format(lastWin)}</div>
            <div><b>Saldo:</b> {format(balance)}</div>
          </div>
        </div>
      </div>
  
      {/* Breakdown */}
      {breakdown.length > 0 && (
        <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, background: "#fafafa", padding: 12, borderRadius: 8, color:"#111" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Detaljer:</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {breakdown.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </div>
      )}
  
      {/* Buy modal */}
      {buyOpen && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.55)",
          display:"grid", placeItems:"center", zIndex:1000
        }}>
          <div style={{
            width: 420, background:"#15181c", color:"#f6f7f9",
            border:"1px solid rgba(255,255,255,.12)", borderRadius:16, padding:18,
            boxShadow:"0 20px 70px rgba(0,0,0,.55)"
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <h3 style={{ margin:0, fontSize:20, fontWeight:800 }}>Buy Bonus</h3>
              <button onClick={()=>setBuyOpen(false)} style={{ background:"transparent", border:"none", color:"#aaa", fontSize:22, cursor:"pointer" }}>×</button>
            </div>
  
            <div style={{ marginTop:12, fontSize:14, opacity:.9 }}>
              Mystery Sticky — {N_BONUS_SPINS} free spins. 🎯 När target landar: symbolen syns först, sen läggs en ❓ ovanpå och blir sticky. Efter varje spin avslöjar alla ❓ en gemensam slumpad symbol.
            </div>
  
            <div style={{ marginTop:16, display:"flex", alignItems:"center", gap:10, justifyContent:"center" }}>
              <button onClick={decBuy} style={pillStyle}>−</button>
              <div style={betValueStyle}>{format(buyBet)}</div>
              <button onClick={incBuy} style={pillStyle}>+</button>
            </div>
  
            <div style={{ marginTop:12, textAlign:"center", fontWeight:700 }}>
              Cost: 100 × {format(buyBet)} = {format(100*buyBet)}
            </div>
  
            <div style={{ marginTop:16, display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={()=>setBuyOpen(false)} style={{
                padding:"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,.12)",
                background:"#242a30", color:"#f6f7f9", cursor:"pointer"
              }}>Cancel</button>
              <button onClick={confirmBuy} disabled={balance < 100*buyBet} style={{
                padding:"10px 18px", borderRadius:10, border:"1px solid rgba(255,255,255,.12)",
                background: balance >= 100*buyBet ? "#ffe9b5" : "#b9b19a",
                color:"#111", fontWeight:800, cursor: balance >= 100*buyBet ? "pointer" : "not-allowed"
              }}>BUY</button>
            </div>
          </div>
        </div>
      )}
  
      {/* Overlay text (bonus m.m.) */}
      {overlay && (
        <div style={{
          position:"fixed", inset:0, display:"grid", placeItems:"center",
          background:"rgba(0,0,0,.45)", zIndex: 2000
        }}>
          <div style={{
            padding:"14px 18px", borderRadius:12,
            background:"#111", color:"#fff", fontWeight:800, fontSize:22,
            border:"1px solid rgba(255,255,255,.15)"
          }}>
            {overlay}
          </div>
        </div>
      )}
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40, height: 40,
  borderRadius: 999,
  background: "#181c20",
  color: "#f6f7f9",
  border: "1px solid rgba(255,255,255,.12)",
  cursor: "pointer",
  fontSize: 18, fontWeight: 800,
  userSelect: "none"
};

const betValueStyle: React.CSSProperties = {
  minWidth: 70,
  textAlign: "center",
  background: "#fff",
  color: "#111",
  borderRadius: 10,
  padding: "6px 10px",
  boxShadow: "inset 0 1px 0 rgba(0,0,0,.08)",
  fontWeight: 700
};
