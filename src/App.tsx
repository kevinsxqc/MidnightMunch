import React, { useEffect, useMemo, useRef, useState } from "react";

//  Slot configuration & types (moved early so helpers can reference them)
const ROWS = 4;
const COLS = 6;

type PaySym = "🍒"|"🍋"|"🍇"|"🍊"|"🥝"|"🥥"|"🔔"|"⭐"|"💎"|"🍀";
type Sym = PaySym | "BonusSym" | "❓"; // <<— INGA WILDS

// RNG + weighted pick 
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
      if (sym === "BonusSym" || sym === "❓") continue;
      w[sym as PaySym] += weight;
    }
  }
  return w;
}

// Sprites 
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
  "BonusSym": "/assets/bonusSymb.png",
};

function SymbolSprite({ sym, size = 56 }: { sym: Sym; size?: number }) {
  const src = SPRITE_MAP[sym];
  const isSpecial = sym === "BonusSym" || sym === "❓";

  if (!src) {
    return (
      <span
        style={{
          fontSize: isSpecial ? "2.2rem" : `${Math.round(size * 0.9)}px`,
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
        width: isSpecial ? "100%" : size,
        height: isSpecial ? "100%" : size,
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
  { sym: "BonusSym", weight: 1  }, { sym: "❓", weight: 2  },
  ],
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
  { sym: "BonusSym", weight: 1  }, { sym: "❓", weight: 2  },
  ],
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
  { sym: "BonusSym", weight: 1  }, { sym: "❓", weight: 2  },
  ],
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
  { sym: "BonusSym", weight: 1  }, { sym: "❓", weight: 2  },
  ],
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
  { sym: "BonusSym", weight: 1  }, { sym: "❓", weight: 2  },
  ],
  [
    { sym: "🍒", weight: 18 }, { sym: "🍋", weight: 18 }, { sym: "🍇", weight: 16 }, { sym: "🍊", weight: 16 }, { sym: "🥝", weight: 14 },
    { sym: "🥥", weight: 14 }, { sym: "🔔", weight: 10 }, { sym: "⭐",  weight: 8  }, { sym: "💎", weight: 6  }, { sym: "🍀", weight: 6  },
  { sym: "BonusSym", weight: 1  }, { sym: "❓", weight: 2  },
  ],
];

// Bonus-pool utan ❓ och 🎟️ (stabilitet)
const STRIP_POOL_BONUS = REEL_WEIGHTS_BY_REEL.map(col =>
  col.filter(x => x.sym !== "❓" && x.sym !== "BonusSym")
);

/** —— PAYTABLE —— */
const PAY: Record<PaySym, Partial<Record<3|4|5|6, number>>> = {
  "🍒": {3:0.20, 4:0.35, 5:0.70, 6:1.40},
  "🍋": {3:0.21, 4:0.37, 5:0.75, 6:1.45},
  "🍇": {3:0.22, 4:0.40, 5:0.80, 6:1.60},
  "🍊": {3:0.23, 4:0.43, 5:0.85, 6:1.65},
  "🥝": {3:0.24, 4:0.45, 5:0.90, 6:1.80},
  "🥥": {3:0.24, 4:0.45, 5:0.90, 6:1.80},
  "🔔": {3:0.35, 4:0.80, 5:1.80, 6:3.60},
  "⭐":  {3:0.45, 4:1.10, 5:2.30, 6:4.80},
  "💎": {3:0.70, 4:1.60, 5:3.50, 6:7.50},
  "🍀": {3:0.90, 4:2.20, 5:5.00, 6:10.00},
};
const PAY_SYMBOLS = Object.keys(PAY) as PaySym[];
const isScatter = (s: Sym) => s === "BonusSym";
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
// --- WIN SCREEN threshold (gäller både base & bonus) ---
const BIG_WIN_MULT = 20; // visa Win Screen om vinst >= 20x bet

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

// --- sizes so we can truly center the slot ---
const SLOT_W = COLS * CELL_H + (COLS - 1) * COL_GAP;
const SLOT_H = ROWS * CELL_H + (ROWS - 1) * CELL_GAP;

function rowSetForCol(preBurstSet: Set<string>, col: number): Set<number> {
  const s = new Set<number>();
  preBurstSet.forEach(k => {
    const [r, c] = k.split(",").map(Number);
    if (c === col) s.add(r);
  });
  return s;
}

type ReelProps = {
  col: number;
  symbols: Sym[];
  offset: number;
  transitionMs: number;
  hl: Set<string>;
  pulse: Set<string>;
  preBurstRows?: Set<number>;  // NEW
  dim?: boolean;               // NEW
};

function Reel({ col, symbols, offset, transitionMs, hl, pulse, preBurstRows, dim }: ReelProps) {
  const visibleH = ROWS * CELL_H + (ROWS - 1) * CELL_GAP;

  // Startindex för de sista (synliga) ROWS cellerna i strippen
  const startVisibleIdx = Math.max(0, symbols.length - ROWS);

  return (
    <div
      className="reel"
      style={{
        position: "relative",
        height: visibleH,
        width: CELL_H,
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

          const isMysteryCell = sym === "❓";
          const isBonusCell = sym === "BonusSym";
          return (
            <div
              key={i}
              style={{
                width: CELL_H,
                height: CELL_H,
                boxSizing: "border-box",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.7rem",
                lineHeight: 1,
                // Darken the cell rectangles so the PNG behind reads through
                background: isBonusCell
                  ? "rgba(28,6,6,0.9)"
                  : highlighted
                    ? "rgba(90,0,120,0.35)"      // darker purple background when highlighted
                    : isMysteryCell
                      ? "rgba(15,20,28,0.9)"
                      : "rgba(10,10,14,0.65)",   // slightly darker overall for contrast
                border: isBonusCell
                  ? "2px solid rgba(255,70,70,0.95)"
                  : highlighted
                    ? "2px solid rgba(200,120,255,0.9)"  // brighter purple border
                    : isMysteryCell
                      ? "2px solid rgba(100,160,255,0.85)"
                      : "1px solid rgba(255,255,255,0.08)",
                boxShadow: isBonusCell
                  ? "0 0 18px 6px rgba(255,60,60,0.32), inset 0 0 8px rgba(255,100,100,0.06)"
                  : highlighted
                    ? "0 0 16px 5px rgba(180,100,255,0.45)" // glowing purple outline
                    : "0 2px 10px rgba(0,0,0,0.35)",
                // subtle inner-shadow / depth (optional) via drop-shadow filter
                filter: isBonusCell
                  ? "drop-shadow(0 0 8px rgba(255,80,80,0.5))"
                  : highlighted
                    ? "drop-shadow(0 0 4px rgba(200,150,255,0.4))"
                    : "drop-shadow(0 0 2px rgba(0,0,0,0.6))",

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
      {/* Dimmer just for this reel (only when dim is true) */}
      {dim && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            borderRadius: 16,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Pre-burst ❓ overlay for this reel */}
      {preBurstRows && preBurstRows.size > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              gridTemplateRows: `repeat(${ROWS}, ${CELL_H}px)`,
              rowGap: `${CELL_GAP}px`,
              pointerEvents: "none",
            }}
          >
            {Array.from({ length: ROWS }, (_, r) => (
              preBurstRows.has(r) ? (
                <div
                  key={r}
                  style={{
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: CELL_H,
                    height: CELL_H,
                    borderRadius: 14,
                    background: "#0b0f14",
                    border: "2px solid rgba(100,160,255,0.85)",
                    boxShadow: "0 0 0 3px rgba(100,160,255,0.22)",
                    transform: "scale(0.9)",
                    animation: "popIn 180ms ease-out forwards",
                  }}
                >
                  <SymbolSprite sym={"❓"} />
                </div>
              ) : (
                <div key={r} />
              )
            ))}
          </div>
        )}
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

// Pool that can replace a cell WITHOUT placing BonusSym
const NO_BONUS_POOL = REEL_WEIGHTS_BY_REEL.map(col =>
  col.map(x => x.sym === "BonusSym" ? { ...x, weight: 0 } : x)
);

/** Replace extra BonusSym in a column so only 1 remains. */
function enforceOneBonusPerColumn(grid: Sym[][], rng: () => number) {
  for (let c = 0; c < COLS; c++) {
    const rows: number[] = [];
    for (let r = 0; r < ROWS; r++) if (grid[r][c] === "BonusSym") rows.push(r);
    if (rows.length > 1) {
      // keep one randomly, replace the rest with a non-bonus symbol from this reel
      const keep = rows[Math.floor(rng() * rows.length)];
      for (const r of rows) if (r !== keep) {
        grid[r][c] = pickWeighted(rng, NO_BONUS_POOL[c]).sym as Sym;
      }
    }
  }
  return grid;
}

/** —— App —— */
export default function App() {
  const [fastMode, setFastMode] = useState(false);
  const speedFactor = fastMode ? 0.7 : 1; // 0.7 = faster animations

  const [seed, setSeed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("rngSeed");
      if (saved) return (parseInt(saved, 10) | 0) >>> 0;
      // strong random init
      let s = 0;
      if (window.crypto && (window.crypto as any).getRandomValues) {
        const a = new Uint32Array(1);
        (window.crypto as any).getRandomValues(a);
        s = a[0] >>> 0;
      } else {
        // fallback
        s = ((Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0);
      }
      localStorage.setItem("rngSeed", String(s));
      return s;
    } catch {
      return ((Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0);
    }
  });
  // Keep seed persisted if it changes (we still do +1 per spin)
  useEffect(() => {
    try { localStorage.setItem("rngSeed", String(seed >>> 0)); } catch {}
  }, [seed]);

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
  // --- WIN SCREEN state & helpers ---
  const [winVisible, setWinVisible] = useState(false);
  const [winLabel, setWinLabel] = useState<string>("WIN!");
  const [winCurrent, setWinCurrent] = useState(0);

  const rafRef = useRef<number | null>(null);
  const winResolveRef = useRef<(() => void) | null>(null);

  function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  function startCountUp(from: number, to: number, duration = 1200) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    setWinCurrent(from);
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const v = from + (to - from) * easeOutCubic(p);
      setWinCurrent(v);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setWinCurrent(to);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  /** Visa Win Screen och vänta på klick för att fortsätta. */
  function showWinScreen(amount: number, label = "WIN!", from = 0, duration = 1200): Promise<void> {
    const to = Math.max(0, amount);
  setWinLabel(label);
    setWinVisible(true);
    startCountUp(from, to, duration);

    return new Promise<void>((resolve) => {
      winResolveRef.current = () => {
        setWinVisible(false);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        resolve();
      };
    });
  }
  const [spinning, setSpinning] = useState(false);
  const [pulseKeys, setPulseKeys] = useState<Set<string>>(new Set());
  const [flipKeys, setFlipKeys] = useState<Set<string>>(new Set());

  // BONUS state
  const [bonusActive, setBonusActive] = useState(false);
  const [, setBonusSpinsLeft] = useState(0);
  const [bonusSticky, setBonusSticky] = useState<Set<string>>(new Set()); // "r,c"
  const [, setBonusTotalWin] = useState(0);
  const [bonusTarget, setBonusTarget] = useState<PaySym | null>(null);
  // Track current bonus spin (0 when not running, 1..N during bonus)
  const [bonusSpin, setBonusSpin] = useState(0);

  // BUY modal
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyBet, setBuyBet] = useState<number>(1);

  // Debug: force exactly one mystery burst on the next base spin
  const [forceBurstOnce, setForceBurstOnce] = useState(false);

  // Dim the slot area during an incoming burst while spinning
  const [dimSpin, setDimSpin] = useState(false);

  // Overlay: during spin, show ❓ popping one-by-one over the spinning reels
  const [preBurstSet, setPreBurstSet] = useState<Set<string>>(new Set());

  // NEW – dedicated target overlay that can show the PNG sprite
  const [showTargetOverlay, setShowTargetOverlay] = useState(false);
  const [targetOverlaySym, setTargetOverlaySym] = useState<PaySym | null>(null);

  // (we'll reveal `bonusTarget` only after the overlay completes)

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

  // keep `breakdown` referenced so we can keep using it internally
  // (UI card was removed; this prevents unused-variable lint errors)
  useEffect(() => {
    if (breakdown.length > 0) {
      // intentionally no-op in production; useful for debugging
      // eslint-disable-next-line no-console
      console.debug("breakdown:", breakdown);
    }
  }, [breakdown]);

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

    const VIEW_PAD = 0;
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
    // single final click when the last reel stops to avoid stacked sounds
    setTimeout(() => click(), durs[durs.length - 1]);
    await new Promise(r => setTimeout(r, durs[durs.length - 1] + 30));
  }

  /** ——— Bas-spinn ——— */
  async function spin(forceBurst: boolean = false) {
    if (spinning || balance < bet || bonusActive) return;
    setSpinning(true);
    // prevent leftover pulses/flip animations from previous spin
    // clear both pulse and flip keys immediately so nothing pops during spin
    setPulseKeys(new Set());
    setFlipKeys(new Set());
    setHl(new Set());
    setBreakdown([]);
    setLastWin(0);
    if (!soundOn) await enableSound();

  // Base spinn från BASE_STRIP_POOL (inga naturliga ❓)
  let target = spinGrid(rng, BASE_STRIP_POOL);
  target = enforceOneBonusPerColumn(target, rng);   // ensure max 1 BonusSym per column
    setResultGrid(target);
    setSeed(s => (s + 1) | 0);

    // — BASE mystery: exactly ONE burst (or none) —
    let working = target.map(row => row.slice()) as Sym[][];
    const bursts: Pos[][] = [];

    const wantBurst = forceBurst || forceBurstOnce || (rng() < BASE_MYSTERY_BURST_CHANCE);
    if (forceBurstOnce) setForceBurstOnce(false);

    // Precompute ONE cluster if needed (we decide before animation so overlay can pop)
    if (wantBurst) {
      const n = Math.floor(
        BASE_MYSTERY_BURST_MIN + rng() * (BASE_MYSTERY_BURST_MAX - BASE_MYSTERY_BURST_MIN + 1)
      );
      const cells = randomWalkCluster(rng, n);
      if (rng() < BASE_FORCE_COL0_IN_BURST_PROB && !cells.some(([_, c]) => c === 0)) {
        cells.push([Math.floor(rng() * ROWS), 0]);
      }
      if (rng() < BASE_FORCE_COL1_IN_BURST_PROB && !cells.some(([_, c]) => c === 1)) {
        cells.push([Math.floor(rng() * ROWS), 1]);
      }
      bursts.push(cells);
    }

    // If we will have a burst, dim the slot area while the reels spin
    if (wantBurst) setDimSpin(true);

  // start the spin animation now (do not await yet)
    const animP = animateToGrid(target, { pool: BASE_STRIP_POOL });

    // 🔮 while reels are spinning, pop the ❓ overlay a bit after start
    let popP: Promise<void> | null = null;
    if (wantBurst && bursts.length) {
      const seq = bursts[0].slice(); // one cluster by design
      popP = (async () => {
        setPreBurstSet(new Set());
        await delay(300 * speedFactor);          // small head-start so pops occur during spin
        for (let i = 0; i < seq.length; i++) {
          const [r, c] = seq[i];
          const k = key(r, c);
          setPreBurstSet(prev => {
            const s = new Set(prev);
            s.add(k);
            return s;
          });
          await delay(90 * speedFactor);         // pleasing stagger while reels still spinning
        }
      })();
    }

    // ⏳ wait for both the spin and the pop overlay
    if (popP) await popP;
    await animP;

    // commit to stopped state
    setReelStrips(Array.from({ length: COLS }, () => []));
    setReelOffset(Array(COLS).fill(0));
    setReelDur(Array(COLS).fill(0));

  // 1) stop dimming, but keep the pre-burst overlay visible (don't clear it yet)
  setDimSpin(false);

  // 2) write the real ❓ into the working grid while the overlay still covers it
  for (const [r, c] of (bursts[0] ?? [])) working[r][c] = "❓";
  setDisplayGrid(working);

  // ensure the ❓ frame has been painted before removing the overlay (avoid a flash)
  await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));

  // now it is safe to clear the pre-burst overlay
  setPreBurstSet(new Set());

    // collect mystery positions and animate a single flip pulse before reveal
    const mystPos: Array<[number, number]> = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (isMystery(working[r][c])) mystPos.push([r, c]);
    }

    if (mystPos.length) {
      setFlipKeys(new Set(mystPos.map(([r, c]) => key(r, c))));
      flipSound();
      await delay(200 * speedFactor);

      // pick ONE symbol for the cluster (center-weighted)
      const cluster = bursts[0];
      if (cluster && cluster.length > 0) {
        const mid = cluster[Math.floor(cluster.length / 2)];
        // build weights as before (local helper inline)
        function buildWeightsForCell(r:number, c:number): Record<PaySym, number> {
          const dyn: Record<PaySym, number> = { ...BASE_REVEAL_WEIGHTS };
          // bias by reel 0/1 counts
          const reel1: Record<PaySym, number> = {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
          const reel2: Record<PaySym, number> = {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
          for (let rr = 0; rr < ROWS; rr++) {
            const s0 = working[rr][0];
            const s1 = working[rr][1];
            if (s0 !== "❓" && s0 !== "BonusSym") reel1[s0 as PaySym]++;
            if (s1 !== "❓" && s1 !== "BonusSym") reel2[s1 as PaySym]++;
          }
          (Object.keys(dyn) as PaySym[]).forEach(sym => {
            dyn[sym] *= (1 + BASE_REEL1_COUNT_ALIGNMENT * reel1[sym]);
            dyn[sym] *= (1 + BASE_REEL2_COUNT_ALIGNMENT * reel2[sym]);
          });
          if (c > 0) {
            const left = working[r][c-1];
            if (left !== "❓" && left !== "BonusSym") dyn[left as PaySym] *= BASE_PREV_REEL_SAME_ROW_BOOST;
          }
          if (c > 1) {
            const left2 = working[r][c-2];
            if (left2 !== "❓" && left2 !== "BonusSym") dyn[left2 as PaySym] *= BASE_PREV2_REEL_SAME_ROW_BOOST;
          }
          return dyn;
        }

        const dyn = buildWeightsForCell(mid[0], mid[1]);
        const picked = pickPaySymbolWeighted(rng, dyn);
        for (const [r, c] of cluster) working[r][c] = picked;
        setDisplayGrid(working);

        // clear flip pulse shortly after
        setTimeout(() => setFlipKeys(new Set()), 100);
      }
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

    // --- Win screen i BASE om ≥ 20x bet ---
    if (res.total >= BIG_WIN_MULT * bet) {
      await showWinScreen(res.total, "BIG WIN");
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
  // do not set bonusTarget yet — keep sidebar empty while the target overlay spins
  setBonusTarget(null);
    setBonusSpinsLeft(N_BONUS_SPINS);
    setBonusSticky(new Set());
    setBonusTotalWin(0);
    setHl(new Set());
    setBreakdown([`${fromBuy ? "BONUS BUY" : "BONUS TRIGGER"} — Mystery Sticky Bonus`]);
    // initialize bonus spin counter
    setBonusSpin(0);

    // 🎯 Dramatiskt target-reveal (endast i bonus) — now with PNG sprites
    setShowTargetOverlay(true);
    setTargetOverlaySym(null);

    // quick “Choosing…” pause
    await delay(500);

    // spin through a few fake symbols using PNG sprites
    for (let i = 0; i < 10; i++) {
      const fakeSym = PAY_SYMBOLS[Math.floor(rng() * PAY_SYMBOLS.length)];
      setTargetOverlaySym(fakeSym);
      await delay(150 + i * 30);
    }

    // land on the real target
    setTargetOverlaySym(targetSym);
    bling();
    await delay(1200);

    // hide overlay first
    setShowTargetOverlay(false);
    setTargetOverlaySym(null);

  // now reveal the chosen target in the sidebar
    setBonusTarget(targetSym);

    let running = 0;
    let sticky = new Set<string>();
    const stickyCountByCol = Array(COLS).fill(0);

    // bonusPool som utarmar target
    let bonusPool = clonePool(STRIP_POOL_BONUS);
    for (let c = 1; c < COLS; c++) {
      scaleTargetInCol(bonusPool, c, targetSym, BONUS_BASE_COL_SCALE[c]);
    }

    for (let i = 0; i < N_BONUS_SPINS; i++) {
      // show 1-based spin index in the UI
      setBonusSpin(i + 1);
      setHl(new Set()); // clear any previous highlights before spinning
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

      // --- Win screen i BONUS om ≥ 20x bet ---
      if (res.total >= BIG_WIN_MULT * bet) {
        await showWinScreen(res.total, "BONUS BIG WIN");
      }

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

  // --- Alltid visa total vinst efter bonus ---
  await showWinScreen(running, "BONUS TOTAL", 0, 1400);
  setBonusActive(false);
  setBonusSticky(new Set());
  setBonusSpinsLeft(0);
  setBonusTarget(null);
  // reset bonus spin counter
  setBonusSpin(0);
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
    if (!soundOn) await enableSound();

    // 1) Build a "natural trigger" spin result
    let g = spinGrid(rng, BASE_STRIP_POOL);
    g = enforceOneBonusPerColumn(g, rng);

    // choose 3–5 distinct columns to show BonusSym (one per column)
    const colsShuffled = Array.from({ length: COLS }, (_, i) => i)
      .sort(() => rng() - 0.5);
    const k = 3 + Math.floor(rng() * 3); // 3..5 scatters
    const chosenCols = colsShuffled.slice(0, k);

    for (const c of chosenCols) {
      const r = Math.floor(rng() * ROWS);
      g[r][c] = "BonusSym";
    }
    // safety: still guarantee 1 per column
    g = enforceOneBonusPerColumn(g, rng);

    // 2) Animate that trigger spin like normal reels stopping
    setSpinning(true);
    await animateToGrid(g, { pool: BASE_STRIP_POOL });
    setSpinning(false);

    // 3) Now start the bonus exactly like a natural trigger
    const targetSym = pickPaySymbolWeighted(rng, TARGET_PICK_WEIGHTS);
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
  grid = enforceOneBonusPerColumn(grid, rngSim);

        // bursts (exactly one cluster at most)
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
        for (const cl of burstsSim) for (const [r,c] of cl) grid[r][c] = "❓";

        // global reel 0/1 counts
        const reel1: Record<PaySym, number> =
          {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
        const reel2: Record<PaySym, number> =
          {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
        for (let rr = 0; rr < ROWS; rr++) {
          const s0 = grid[rr][0];
          const s1 = grid[rr][1];
          if (s0 !== "❓" && s0 !== "BonusSym") reel1[s0 as PaySym]++;
          if (s1 !== "❓" && s1 !== "BonusSym") reel2[s1 as PaySym]++;
        }
        function buildWeightsForCellSim(r:number, c:number): Record<PaySym, number> {
          const dyn: Record<PaySym, number> = { ...BASE_REVEAL_WEIGHTS };
          (Object.keys(dyn) as PaySym[]).forEach(sym => {
            dyn[sym] *= (1 + BASE_REEL1_COUNT_ALIGNMENT * reel1[sym]);
            dyn[sym] *= (1 + BASE_REEL2_COUNT_ALIGNMENT * reel2[sym]);
          });
          if (c > 0) {
            const left = grid[r][c-1];
            if (left !== "❓" && left !== "BonusSym") dyn[left as PaySym] *= BASE_PREV_REEL_SAME_ROW_BOOST;
          }
          if (c > 1) {
            const left2 = grid[r][c-2];
            if (left2 !== "❓" && left2 !== "BonusSym") dyn[left2 as PaySym] *= BASE_PREV2_REEL_SAME_ROW_BOOST;
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
  grid = enforceOneBonusPerColumn(grid, rngSim);

        // bursts (exactly one cluster at most)
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
        for (const cl of burstsSim) for (const [r,c] of cl) grid[r][c] = "❓";

        // reel 0/1 counts
        const reel1: Record<PaySym, number> =
          {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
        const reel2: Record<PaySym, number> =
          {"🍒":0,"🍋":0,"🍇":0,"🍊":0,"🥝":0,"🥥":0,"🔔":0,"⭐":0,"💎":0,"🍀":0};
        for (let rr = 0; rr < ROWS; rr++) {
          const s0 = grid[rr][0];
          const s1 = grid[rr][1];
          if (s0 !== "❓" && s0 !== "BonusSym") reel1[s0 as PaySym]++;
          if (s1 !== "❓" && s1 !== "BonusSym") reel2[s1 as PaySym]++;
        }
        function buildWeightsForCellSim(r:number, c:number): Record<PaySym, number> {
          const dyn: Record<PaySym, number> = { ...BASE_REVEAL_WEIGHTS };
          (Object.keys(dyn) as PaySym[]).forEach(sym => {
            dyn[sym] *= (1 + BASE_REEL1_COUNT_ALIGNMENT * reel1[sym]);
            dyn[sym] *= (1 + BASE_REEL2_COUNT_ALIGNMENT * reel2[sym]);
          });
          if (c > 0) {
            const left = grid[r][c-1];
            if (left !== "❓" && left !== "BonusSym") dyn[left as PaySym] *= BASE_PREV_REEL_SAME_ROW_BOOST;
          }
          if (c > 1) {
            const left2 = grid[r][c-2];
            if (left2 !== "❓" && left2 !== "BonusSym") dyn[left2 as PaySym] *= BASE_PREV2_REEL_SAME_ROW_BOOST;
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
  const sc = grid.flat().filter(s => s === "BonusSym").length;
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "24px auto", fontFamily: "system-ui, Arial" }}>
      <style>{`
        @keyframes pulseAnim { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
        .pulse { animation: pulseAnim 0.7s ease-out; }
        @keyframes flipAnim { 0%{transform:rotateX(0)} 50%{transform:rotateX(90deg)} 100%{transform:rotateX(0)} }
        .flip { animation: flipAnim 0.26s ease-in-out; }
        @keyframes popIn { to { transform: scale(1); } }
        @keyframes winPopIn {
          0%   { transform: translateY(6px) scale(0.96); opacity: 0; }
          60%  { transform: translateY(0)    scale(1.02); opacity: 1; }
          100% { transform: translateY(0)    scale(1.00); opacity: 1; }
        }
      `}</style>
  
      <div style={{
        // use the PNG on the panel and clip to rounded corners
        width: 'min(1200px, 96vw)',
        minHeight: SLOT_H + 220,
        margin: '24px auto',
        backgroundImage: 'url("/assets/background.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#0b0d10",

        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 18,
        overflow: "hidden",
        padding: 16,
        paddingBottom: 22,
        color: "#f6f7f9",
        boxShadow: "0 20px 60px rgba(0,0,0,.45)"
      }}>
        {/* Header: only the centered logo */}
        <div style={{ display:"grid", placeItems:"center", marginBottom: 6 }}>
          <img
            src="/assets/mmLogo.png"
            alt="Midnight Munch"
            style={{
              width: 340, maxWidth: "88%", height: "auto",
              filter: "drop-shadow(0 0 12px rgba(255,0,200,.32)) drop-shadow(0 0 20px rgba(120,0,255,.22))"
            }}
            draggable={false}
          />
        </div>
  
        {/* SLOT AREA (centered) + right sidebar (absolute) */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center", margin: "16px 0 12px" }}>
          {/* Centered slot frame with fixed width */}
          <div style={{ position: "relative", width: SLOT_W }}>
            {/* The reels grid */}
            <div
              style={{
                display:"grid",
                gridTemplateColumns:`repeat(${COLS}, ${CELL_H}px)`,
                gap: COL_GAP,
                alignItems:"start",
                justifyContent:"center",
                width: SLOT_W,
                height: SLOT_H,
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
                  pulse={spinning ? new Set() : (flipKeys.size ? flipKeys : pulseKeys)}
                  preBurstRows={rowSetForCol(preBurstSet, c)}
                  dim={dimSpin}
                />
              ))}
            </div>

            {/* Sticky overlay (unchanged) */}
            {bonusActive && bonusSticky.size > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  display: "grid",
                  gridTemplateColumns: `repeat(${COLS}, ${CELL_H}px)`,
                  gap: `${COL_GAP}px`,
                  justifyContent: "center",
                }}
              >
                {/* ... your existing overlay cell mapping ... */}
                {Array.from({ length: COLS }, (_, c) => (
                  <div key={c} style={{ position: "relative", width: CELL_H, height: ROWS*CELL_H + (ROWS-1)*CELL_GAP }}>
                    <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateRows: `repeat(${ROWS}, ${CELL_H}px)`, rowGap: `${CELL_GAP}px` }}>
                      {Array.from({ length: ROWS }, (_, r) => {
                        const k = key(r,c);
                        const isSticky = bonusSticky.has(k);
                        if (!isSticky) return <div key={r} />;
                        const showSym = overlayShowSymbol && overlaySymbol ? overlaySymbol : "❓";
                        return (
                          <div key={r} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: CELL_H, height: CELL_H, borderRadius: 14, background: "#0b0f14", border: "2px solid rgba(100,160,255,0.85)", boxShadow: "0 0 0 3px rgba(100,160,255,0.22)", zIndex: 5 }}>
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

          {/* RIGHT SIDEBAR — panel bredvid slotten */}
          <div
            style={{
              position: "absolute",
              left: `calc(50% + ${SLOT_W / 2}px + 16px)`,
              top: 0,
            }}
          >
            <div style={{ width: 210, ...sidePanelBox }}>
              <button onClick={openBuy} disabled={spinning || bonusActive} style={neonBtn}>
                BONUS
              </button>

              <button
                onClick={() => spin(true)}
                disabled={spinning || bonusActive || forceBurstOnce}
                style={neonBtnBlue}
                title="Force a mystery burst this base spin"
              >
                Mystery Spin
              </button>

              {/* Target visas bara när bonus är aktiv OCH target är bestämd och overlay inte visas */}
              {bonusActive && bonusTarget && !showTargetOverlay && (
                <div style={targetPanelStyle}>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Target</div>
                  <div style={targetBoxStyle}>
                    <SymbolSprite sym={bonusTarget} size={40} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

  {/* Controls under the slot removed — using bottom bar center cluster instead */}

  {/* per-reel dimming and pre-burst overlays are rendered inside each Reel now */}

  {/* Space mellan slot & bottenbar */}
  <div style={{ height: 18 }} />

  {/* Bottom bar */}
        <div style={{
          display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center",
          gap: 16, background:"#0e1113", border:"1px solid rgba(255,255,255,.06)",
          borderRadius: 14, padding:"10px 14px", marginTop: 18
        }}>
          {/* Bet */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:10 }}>
            <button onClick={decBet} disabled={spinning || bonusActive || bet<=BET_LADDER[0]}
              style={pillStyle}>−</button>
            <div style={betValueStyle}>{format(bet)}</div>
            <button onClick={incBet} disabled={spinning || bonusActive || bet>=BET_LADDER[BET_LADDER.length-1]}
              style={pillStyle}>+</button>
          </div>
  
          {/* CENTER: Sound — Spin — Speed */}
          <div style={{ display:"flex", gap:12, alignItems:"center", justifyContent:"center" }}>
            {/* Sound: grön när på, röd när muted */}
            <button
              onClick={() => { if (!soundOn) enableSound(); else setMuted(m => !m); }}
              style={muted ? neonBtnRed : neonBtnGreen}
              title="Toggle sound"
            >
              Sound
            </button>

            {/* SPIN (centrerad) */}
            <button
              onClick={() => spin()}
              disabled={spinning || bonusActive || balance < bet}
              style={{
                ...neonBtn,
                minWidth: 180,
                opacity: (!spinning && !bonusActive && balance >= bet) ? 1 : 0.6
              }}
            >
              {spinning ? "SPIN..." : "SPIN"}
            </button>

            {/* Speed (Speed / Speed +) */}
            <button
              onClick={() => setFastMode(v => !v)}
              style={neonBtnBlue}
              title="Toggle spin animation speed"
            >
              {fastMode ? "Speed +" : "Speed"}
            </button>
          </div>
  
          {/* Stats */}
          <div style={{ display:"flex", justifyContent:"flex-end", gap:18 }}>
            {bonusActive && (
              <div style={{ color: "#9ef7ff", fontWeight: 800, letterSpacing: .5, textShadow: "0 0 10px rgba(120,200,255,.4)" }}>
                {`Spins: ${bonusSpin}/${N_BONUS_SPINS}`}
              </div>
            )}
            <div><b>Vinst:</b> {format(lastWin)}</div>
            <div><b>Saldo:</b> {format(balance)}</div>
          </div>
        </div>
      </div>
  
      {/* Breakdown UI removed per request */}

      {/* debug card removed */}
  
      {/* Buy modal */}
      {buyOpen && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(6,8,12,.55)",
          backdropFilter:"blur(2px)", display:"grid", placeItems:"center", zIndex:1000
        }}>
          <div style={neonPanel}>
            <div style={neonTitle}>BUY BONUS</div>

            {/* Bet-stegrare */}
            <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:10, justifyContent:"center" }}>
              <button onClick={decBuy} style={pillStyle}>−</button>
              <div style={betValueStyle}>{format(buyBet)}</div>
              <button onClick={incBuy} style={pillStyle}>+</button>
            </div>

            {/* Endast slutpriset */}
            <div style={{ marginTop:12, textAlign:"center", fontWeight:800, color:"#fff8e6",
              textShadow:"0 0 10px rgba(255,220,160,.45)" }}>
              Cost: {format(100 * buyBet)}
            </div>

            {/* Knappar */}
            <div style={{ marginTop:16, display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={()=>setBuyOpen(false)} style={neonBtnBlue}>Cancel</button>
              <button onClick={confirmBuy} disabled={balance < 100*buyBet}
                style={{ ...(balance >= 100*buyBet ? neonBtnGold : {...neonBtnGold, opacity:.6, cursor:"not-allowed"}) }}>
                BUY
              </button>
            </div>
          </div>
        </div>
      )}
  
      {/* WIN SCREEN OVERLAY — NEON MEDIUM */}
      {winVisible && (
        <div
          onClick={() => winResolveRef.current?.()}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            display: "grid",
            placeItems: "center",
            // mörk halvtransparent bakgrund + lite blur
            background: "rgba(6, 8, 12, 0.55)",
            backdropFilter: "blur(2.5px)",
            cursor: "pointer",
            userSelect: "none",
            padding: 16,
          }}
          title="Click anywhere to continue"
        >
          <div
            style={{
              width: "min(92vw, 520px)",
              minWidth: 320,
              padding: "18px 20px",
              borderRadius: 18,
              // ❌ inga vita borders/innerstrokes
              border: "none",
              // neon-panel: mörk glas + svag gradient
              background:
                "linear-gradient(180deg, rgba(15,16,28,0.92), rgba(10,12,20,0.92))",
              // neon-glow (rosa/lila/cyan blandning)
              boxShadow:
                "0 0 38px rgba(255, 60, 180, 0.25), 0 0 60px rgba(70, 180, 255, 0.18)",
              textAlign: "center",
              color: "#e9f4ff",
              animation: "winPopIn 340ms cubic-bezier(.2,.85,.2,1) both",
            }}
          >
            {/* RUBRIK — utan summa */}
            <div
              style={{
                fontSize: 14,
                letterSpacing: 1,
                marginBottom: 8,
                // neon-text med gradient
                background: "linear-gradient(90deg,#b25cff,#ff5fb7,#5ce1ff,#8ac6ff)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                textShadow: "0 0 10px rgba(178,92,255,0.35)",
                fontWeight: 800,
              }}
            >
              {winLabel}
            </div>

            {/* SUMMAN — stor, varm neon-glow */}
            <div
              style={{
                fontWeight: 900,
                fontSize: 44,
                lineHeight: 1.08,
                letterSpacing: 0.4,
                color: "#fff8e6",
                textShadow:
                  "0 0 8px rgba(255,220,160,.55), 0 0 22px rgba(255,120,200,.35), 0 0 30px rgba(80,180,255,.28)",
              }}
            >
              {format(winCurrent)}
            </div>

            {/* Liten hinttext i cyan */}
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#c8f4ff",
                textShadow: "0 0 10px rgba(80,200,255,.35)",
                opacity: 0.9,
              }}
            >
              Click anywhere to continue
            </div>
          </div>
        </div>
      )}

      {/* PNG target overlay */}
      {showTargetOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,.45)",
            zIndex: 2000,
          }}
        >
          {/* 🔧 Ny wrapper som matchar slot-bredden */}
          <div
            style={{
              width: SLOT_W,
              maxWidth: "calc(96vw - 64px)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                transform: "translate(18px, -5%)",
                padding: 16,
                borderRadius: 14,
                background: "#111",
                color: "#fff",
                border: "1px solid rgba(255,255,255,.15)",
                display: "grid",
                gap: 10,
                justifyItems: "center",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 20 }}>Target</div>

              <div
                style={{
                  width: 110,
                  height: 110,
                  display: "grid",
                  placeItems: "center",
                  background: "#0b0f14",
                  border: "2px solid rgba(100,160,255,0.85)",
                  borderRadius: 16,
                  boxShadow: "0 0 0 4px rgba(100,160,255,0.18)",
                }}
              >
                {targetOverlaySym && <SymbolSprite sym={targetOverlaySym} size={72} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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

const neonBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 140,
  height: 46,
  padding: "8px 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255, 0, 140, 0.12)",
  color: "#ffe6ff",
  fontWeight: 800,
  letterSpacing: .4,
  textShadow: "0 0 8px rgba(255,0,180,.85), 0 0 18px rgba(120,0,255,.55)",
  boxShadow:
    "0 10px 28px rgba(0,0,0,.45), inset 0 0 14px rgba(255,0,180,.25), 0 0 12px rgba(120,0,255,.35)",
  cursor: "pointer",
  userSelect: "none",
};

const neonBtnBlue: React.CSSProperties = {
  ...neonBtn,
  background: "rgba(0, 150, 255, 0.12)",
  color: "#e8f3ff",
  textShadow: "0 0 8px rgba(0,160,255,.9), 0 0 18px rgba(120,0,255,.45)",
  boxShadow:
    "0 10px 28px rgba(0,0,0,.45), inset 0 0 14px rgba(0,160,255,.25), 0 0 12px rgba(120,0,255,.35)",
};

const neonBtnGreen: React.CSSProperties = {
  ...neonBtn,
  background: "rgba(0, 255, 170, 0.12)",
  color: "#eaffe9",
  textShadow: "0 0 8px rgba(0,255,170,.9), 0 0 18px rgba(120,0,255,.45)",
  boxShadow:
    "0 10px 28px rgba(0,0,0,.45), inset 0 0 14px rgba(0,255,170,.25), 0 0 12px rgba(120,0,255,.35)",
};

const neonBtnRed: React.CSSProperties = {
  ...neonBtn,
  minWidth: 120,
  background: "rgba(255,30,80,.12)",
  color: "#ffe9ef",
  textShadow: "0 0 8px rgba(255,60,120,.95), 0 0 18px rgba(255,120,200,.45)",
  boxShadow:
    "0 10px 28px rgba(0,0,0,.45), inset 0 0 14px rgba(255,40,100,.25), 0 0 12px rgba(255,120,200,.30)",
};


const sidePanelBox: React.CSSProperties = {
  padding: 12,
  borderRadius: 18,
  backdropFilter: "blur(3px)",
  background:
    "linear-gradient(180deg, rgba(10,12,20,.55), rgba(8,10,16,.42))",
  boxShadow:
    "0 8px 28px rgba(0,0,0,.45), 0 0 28px rgba(120,0,255,.18)",
  border: "1px solid rgba(255,255,255,.08)",
  display: "grid",
  gap: 10,
};

const targetPanelStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 14,
  background: 'radial-gradient(120% 120% at 50% -20%, rgba(255,0,100,.20), rgba(15,16,24,.75) 60%)',
  border: '1px solid rgba(255,0,120,.28)',
  boxShadow: '0 0 24px rgba(255,0,140,.25), inset 0 0 10px rgba(255,0,120,.15)',
  color: '#ffe6f3'
};

const targetBoxStyle: React.CSSProperties = {
  width: 64, height: 64,
  display: 'grid', placeItems: 'center',
  borderRadius: 12,
  background: 'rgba(15,16,24,.9)',
  border: '2px solid rgba(255,80,160,.85)',
  boxShadow: '0 0 0 4px rgba(255,80,160,.18)'
};

const neonPanel: React.CSSProperties = {
  width: 420,
  borderRadius: 16,
  padding: 18,
  background: "linear-gradient(180deg, rgba(15,16,28,.92), rgba(10,12,20,.92))",
  boxShadow: "0 0 38px rgba(255, 60, 180, .22), 0 0 60px rgba(70, 180, 255, .16)",
  color: "#e9f4ff",
  border: "none",
  textAlign: "center"
};

const neonTitle: React.CSSProperties = {
  fontWeight: 900,
  letterSpacing: 1,
  fontSize: 18,
  background: "linear-gradient(90deg,#b25cff,#ff5fb7,#5ce1ff)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  textShadow: "0 0 10px rgba(178,92,255,.35)"
};

const neonBtnGold: React.CSSProperties = {
  ...neonBtn,
  background: "rgba(255,190,0,.14)",
  color: "#fff7da",
  textShadow: "0 0 8px rgba(255,210,120,.9), 0 0 18px rgba(255,120,200,.35)",
  boxShadow: "0 10px 28px rgba(0,0,0,.45), inset 0 0 14px rgba(255,170,0,.28), 0 0 12px rgba(255,120,200,.28)"
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