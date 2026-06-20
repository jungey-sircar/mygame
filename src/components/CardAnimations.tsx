import { useRef, useEffect } from "react";

const TAU = Math.PI * 2;
const CANVAS_CLASS = "w-full h-28 sm:h-32 rounded-lg pointer-events-none";

function useLoop(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf: number;
    const loop = () => {
      const canvas = ref.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);
        draw(ctx, w, h, performance.now() / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);
  return ref;
}

// 1. Spin The Wheel
export const SpinWheelAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.35;
    const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#e67e22"];
    const seg = TAU / colors.length;
    const rot = t * 1.5;
    colors.forEach((c, i) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, rot + i * seg, rot + (i + 1) * seg);
      ctx.fillStyle = c;
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, TAU);
    ctx.fillStyle = "#fff";
    ctx.fill();
    // pointer
    ctx.beginPath();
    ctx.moveTo(cx + r + 5, cy);
    ctx.lineTo(cx + r + 14, cy - 6);
    ctx.lineTo(cx + r + 14, cy + 6);
    ctx.fillStyle = "#fff";
    ctx.fill();
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 2. Rock Paper Scissors
export const RPSAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const icons = ["✊", "✋", "✌️"];
    const idx = Math.floor(t * 2) % 3;
    ctx.font = `${Math.min(w, h) * 0.45}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const bounce = Math.sin(t * 6) * 5;
    ctx.fillText(icons[idx], w / 2, h / 2 + bounce);
    // VS text
    ctx.font = "bold 14px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("VS", w / 2 + 35, h / 2 - 20);
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 3. Personality Arena (spotlight)
export const SpotlightAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, cy = h * 0.7;
    const angle = Math.sin(t * 0.8) * 0.6;
    const bx = cx + Math.sin(angle) * w * 0.4;
    const grad = ctx.createRadialGradient(bx, 0, 5, bx, cy, h * 0.8);
    grad.addColorStop(0, "rgba(255,220,100,0.5)");
    grad.addColorStop(1, "rgba(255,220,100,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(bx - 5, 0);
    ctx.lineTo(bx - w * 0.2, cy);
    ctx.lineTo(bx + w * 0.2, cy);
    ctx.lineTo(bx + 5, 0);
    ctx.fill();
    // stage
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(0, cy, w, h - cy);
    // person silhouette
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.arc(cx, cy - 20, 8, 0, TAU);
    ctx.fill();
    ctx.fillRect(cx - 5, cy - 12, 10, 15);
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 4. Social Arena (network nodes)
export const NetworkAnim = () => {
  const nodesRef = useRef(
    Array.from({ length: 8 }, () => ({
      a: Math.random() * TAU,
      r: 0.2 + Math.random() * 0.25,
      s: 0.3 + Math.random() * 0.4,
    }))
  );
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, cy = h / 2;
    const nodes = nodesRef.current;
    const pts = nodes.map(n => ({
      x: cx + Math.cos(n.a + t * n.s) * n.r * w,
      y: cy + Math.sin(n.a + t * n.s) * n.r * h,
    }));
    // lines
    ctx.strokeStyle = "rgba(130,80,255,0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 80) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    // dots
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, TAU);
      ctx.fillStyle = "rgba(0,200,200,0.8)";
      ctx.fill();
    });
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 5. Visionary Arena (rocket)
export const RocketAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, rocketY = h * 0.5 + Math.sin(t * 2) * 10;
    // flame
    const flameH = 12 + Math.sin(t * 15) * 5;
    ctx.fillStyle = `rgba(255, ${100 + Math.sin(t * 10) * 50}, 50, 0.8)`;
    ctx.beginPath();
    ctx.moveTo(cx - 6, rocketY + 18);
    ctx.lineTo(cx, rocketY + 18 + flameH);
    ctx.lineTo(cx + 6, rocketY + 18);
    ctx.fill();
    // body
    ctx.fillStyle = "#e0e0e0";
    ctx.beginPath();
    ctx.moveTo(cx, rocketY - 20);
    ctx.lineTo(cx + 8, rocketY + 15);
    ctx.lineTo(cx - 8, rocketY + 15);
    ctx.fill();
    // window
    ctx.beginPath();
    ctx.arc(cx, rocketY, 4, 0, TAU);
    ctx.fillStyle = "#3498db";
    ctx.fill();
    // stars
    for (let i = 0; i < 12; i++) {
      const sx = ((i * 37 + t * 30) % w);
      const sy = ((i * 53 + t * 20) % h);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(t * 3 + i) * 0.2})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 6. Trolley Simulator
export const TrolleyAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const trackY = h * 0.6;
    // tracks
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, trackY);
    ctx.lineTo(w * 0.55, trackY);
    ctx.stroke();
    // fork
    ctx.beginPath();
    ctx.moveTo(w * 0.55, trackY);
    ctx.lineTo(w, trackY - 25);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.55, trackY);
    ctx.lineTo(w, trackY + 25);
    ctx.stroke();
    // trolley
    const tx = ((t * 30) % (w * 0.5)) + 10;
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(tx - 12, trackY - 16, 24, 12);
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(tx - 7, trackY - 2, 3, 0, TAU);
    ctx.arc(tx + 7, trackY - 2, 3, 0, TAU);
    ctx.fill();
    // people
    ctx.font = "12px serif";
    ctx.fillText("🧑", w * 0.8, trackY - 35);
    ctx.fillText("🧑🧑🧑", w * 0.75, trackY + 18);
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 7. Programming Quiz (typing code)
export const CodeTypingAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    ctx.font = "11px monospace";
    const lines = [
      "def solve(n):",
      "  if n <= 1:",
      "    return n",
      "  return solve(n-1)",
      "  + solve(n-2)",
    ];
    const totalChars = lines.join("").length;
    const pos = Math.floor(t * 8) % (totalChars + 20);
    let charCount = 0;
    lines.forEach((line, i) => {
      const y = 20 + i * 18;
      const visible = Math.max(0, Math.min(line.length, pos - charCount));
      charCount += line.length;
      ctx.fillStyle = i === 0 ? "rgba(86,156,214,0.9)" : "rgba(200,200,200,0.7)";
      ctx.fillText(line.substring(0, visible), 15, y);
    });
    // cursor blink
    if (Math.sin(t * 6) > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillRect(15 + Math.min(pos, totalChars) * 6.6 % (w - 30), 10, 1.5, 14);
    }
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 8. Settle This (balance scale)
export const ScaleAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, base = h * 0.8;
    const tilt = Math.sin(t * 1.2) * 0.3;
    // pillar
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, base);
    ctx.lineTo(cx, base - 50);
    ctx.stroke();
    // beam
    ctx.save();
    ctx.translate(cx, base - 50);
    ctx.rotate(tilt);
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.lineTo(40, 0);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // pans
    [-40, 40].forEach((px, i) => {
      ctx.fillStyle = i === 0 ? "rgba(231,76,60,0.6)" : "rgba(52,152,219,0.6)";
      ctx.beginPath();
      ctx.arc(px, 15, 12, 0, Math.PI);
      ctx.fill();
    });
    ctx.restore();
    // labels
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.textAlign = "center";
    ctx.fillText("A", cx - 40, base - 25);
    ctx.fillText("B", cx + 40, base - 25);
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 9. Auction Challenge (gavel)
export const GavelAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, cy = h / 2;
    const angle = Math.abs(Math.sin(t * 3)) * -0.6;
    ctx.save();
    ctx.translate(cx, cy + 10);
    ctx.rotate(angle);
    // handle
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(-3, -35, 6, 30);
    // head
    ctx.fillStyle = "#5c3317";
    ctx.fillRect(-12, -40, 24, 10);
    ctx.restore();
    // base
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(cx - 15, cy + 12, 30, 6);
    // money signs
    ctx.font = "16px serif";
    ctx.fillStyle = "rgba(241,196,15,0.5)";
    const bounce = Math.sin(t * 2) * 3;
    ctx.fillText("💰", cx - 40, cy + bounce);
    ctx.fillText("💰", cx + 30, cy - bounce);
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 10. Who Was Alive (timeline)
export const TimelineAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const y = h / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(w - 20, y);
    ctx.stroke();
    const years = [1800, 1850, 1900, 1950, 2000];
    years.forEach((yr, i) => {
      const x = 30 + (i / (years.length - 1)) * (w - 60);
      const active = Math.floor(t * 0.8) % years.length === i;
      ctx.fillStyle = active ? "rgba(0,200,200,0.9)" : "rgba(255,255,255,0.3)";
      ctx.beginPath();
      ctx.arc(x, y, active ? 6 : 4, 0, TAU);
      ctx.fill();
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(yr), x, y + 16);
    });
    // figure
    const ai = Math.floor(t * 0.8) % years.length;
    const ax = 30 + (ai / (years.length - 1)) * (w - 60);
    ctx.font = "14px serif";
    ctx.fillText("👤", ax - 7, y - 16);
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 11. Spend Money (falling coins)
export const MoneyRainAnim = () => {
  const coinsRef = useRef(
    Array.from({ length: 15 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.5 + Math.random(),
      r: Math.random() * TAU,
    }))
  );
  const ref = useLoop((ctx, w, h, t) => {
    const coins = coinsRef.current;
    const symbols = ["💵", "💰", "🪙", "💸"];
    coins.forEach((c, i) => {
      const y = ((c.y + t * c.s * 0.1) % 1) * h;
      const x = c.x * w;
      ctx.font = `${12 + c.s * 6}px serif`;
      ctx.globalAlpha = 0.7;
      ctx.fillText(symbols[i % symbols.length], x, y);
    });
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 12. Draw Circle
export const DrawCircleAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.3;
    const progress = (t * 0.8) % 2;
    const drawAmt = Math.min(progress, 1) * TAU;
    // guide circle
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();
    // drawn circle (wobbly)
    if (progress < 1.5) {
      ctx.strokeStyle = "rgba(0,200,200,0.7)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let a = 0; a < drawAmt; a += 0.05) {
        const wobble = Math.sin(a * 5) * 2;
        const px = cx + Math.cos(a - Math.PI / 2) * (r + wobble);
        const py = cy + Math.sin(a - Math.PI / 2) * (r + wobble);
        if (a === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    }
    // score
    if (progress >= 1 && progress < 1.5) {
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "rgba(0,255,200,0.8)";
      ctx.textAlign = "center";
      ctx.fillText("92%", cx, cy);
    }
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 13. Memory Match (flipping cards)
export const MemoryMatchAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cols = 4, rows = 2;
    const cw = 22, ch = 28, gap = 6;
    const totalW = cols * (cw + gap) - gap;
    const totalH = rows * (ch + gap) - gap;
    const ox = (w - totalW) / 2, oy = (h - totalH) / 2;
    const icons = ["🐍", "⚡", "🎯", "🧩", "🐍", "⚡", "🎯", "🧩"];
    const flipIdx = Math.floor(t * 1.5) % 8;
    const flipIdx2 = (flipIdx + 4) % 8;
    for (let i = 0; i < 8; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = ox + col * (cw + gap), y = oy + row * (ch + gap);
      const isFlipped = i === flipIdx || i === flipIdx2;
      ctx.fillStyle = isFlipped ? "rgba(52,152,219,0.6)" : "rgba(255,255,255,0.12)";
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, cw, ch, 4);
      ctx.fill();
      ctx.stroke();
      if (isFlipped) {
        ctx.font = "13px serif";
        ctx.textAlign = "center";
        ctx.fillText(icons[i], x + cw / 2, y + ch / 2 + 5);
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("?", x + cw / 2, y + ch / 2 + 4);
      }
    }
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 14. Life Progress (progress bars)
export const LifeProgressAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const bars = [
      { label: "Life", pct: 0.35 + Math.sin(t * 0.3) * 0.05, color: "rgba(46,204,113,0.7)" },
      { label: "Year", pct: (t * 0.05) % 1, color: "rgba(52,152,219,0.7)" },
      { label: "Day", pct: (t * 0.2) % 1, color: "rgba(155,89,182,0.7)" },
    ];
    bars.forEach((b, i) => {
      const y = 18 + i * 30;
      const bw = w - 60;
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.textAlign = "left";
      ctx.fillText(b.label, 10, y + 4);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(50, y - 5, bw, 12);
      ctx.fillStyle = b.color;
      ctx.fillRect(50, y - 5, bw * b.pct, 12);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.textAlign = "right";
      ctx.fillText(`${Math.floor(b.pct * 100)}%`, w - 5, y + 4);
    });
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 15. Universe Forecast (stars & nebula)
export const UniverseAnim = () => {
  const starsRef = useRef(
    Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      s: 0.5 + Math.random() * 2,
      b: Math.random(),
    }))
  );
  const ref = useLoop((ctx, w, h, t) => {
    // nebula
    const grad = ctx.createRadialGradient(w * 0.4, h * 0.5, 10, w * 0.4, h * 0.5, w * 0.4);
    grad.addColorStop(0, "rgba(100,50,150,0.2)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    starsRef.current.forEach(star => {
      const blink = 0.3 + Math.sin(t * 2 + star.b * 10) * 0.4;
      ctx.fillStyle = `rgba(255,255,255,${blink})`;
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, star.s, 0, TAU);
      ctx.fill();
    });
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 16. Password Challenge
export const PasswordAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, cy = h / 2;
    // lock
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 12, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(cx - 16, cy - 2, 32, 24);
    // keyhole
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 4, 0, TAU);
    ctx.fill();
    // typing password below
    const chars = "●●●●●●●●●●";
    const visible = Math.floor(t * 3) % (chars.length + 3);
    ctx.font = "14px monospace";
    ctx.fillStyle = "rgba(0,200,200,0.7)";
    ctx.textAlign = "center";
    ctx.fillText(chars.substring(0, Math.min(visible, chars.length)), cx, cy + 40);
    // cursor
    if (Math.sin(t * 6) > 0 && visible <= chars.length) {
      const cursorX = cx + (visible - chars.length / 2) * 8.5;
      ctx.fillRect(cursorX, cy + 30, 2, 14);
    }
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 17. Imposter (suspicious eyes)
export const ImposterAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const faces = [
      { x: w * 0.2, y: h * 0.5 },
      { x: w * 0.4, y: h * 0.4 },
      { x: w * 0.6, y: h * 0.5 },
      { x: w * 0.8, y: h * 0.45 },
    ];
    const imposterIdx = 2;
    faces.forEach((f, i) => {
      // face
      ctx.fillStyle = i === imposterIdx ? "rgba(231,76,60,0.4)" : "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.arc(f.x, f.y, 16, 0, TAU);
      ctx.fill();
      // eyes
      const lookX = Math.sin(t * 1.5 + i) * 3;
      const lookY = Math.cos(t * 1.2 + i) * 1.5;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(f.x - 5, f.y - 3, 4, 3, 0, 0, TAU);
      ctx.ellipse(f.x + 5, f.y - 3, 4, 3, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = i === imposterIdx ? "#e74c3c" : "#333";
      ctx.beginPath();
      ctx.arc(f.x - 5 + lookX, f.y - 3 + lookY, 1.8, 0, TAU);
      ctx.arc(f.x + 5 + lookX, f.y - 3 + lookY, 1.8, 0, TAU);
      ctx.fill();
      // mouth
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (i === imposterIdx) {
        ctx.arc(f.x, f.y + 4, 4, 0.2, Math.PI - 0.2);
      } else {
        ctx.arc(f.x, f.y + 7, 4, Math.PI + 0.3, -0.3);
      }
      ctx.stroke();
    });
    // question mark
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.sin(t * 3) * 0.1})`;
    ctx.textAlign = "center";
    ctx.fillText("?", w / 2, h * 0.85);
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 18. Word Bingo
export const WordBingoAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const letters = "BINGO".split("");
    letters.forEach((l, i) => {
      const x = 15 + i * (w - 30) / 4;
      const bounce = Math.sin(t * 2 + i * 0.8) * 5;
      const active = Math.floor(t) % 5 === i;
      ctx.font = `bold ${active ? 28 : 22}px sans-serif`;
      ctx.fillStyle = active ? "rgba(241,196,15,0.9)" : "rgba(255,255,255,0.3)";
      ctx.textAlign = "center";
      ctx.fillText(l, x, h / 2 + bounce);
    });
    // grid below
    const gridSize = 3, cs = 14;
    const gox = (w - gridSize * (cs + 3)) / 2, goy = h * 0.7;
    for (let r = 0; r < gridSize; r++)
      for (let c = 0; c < gridSize; c++) {
        const marked = (r + c + Math.floor(t)) % 3 === 0;
        ctx.fillStyle = marked ? "rgba(46,204,113,0.5)" : "rgba(255,255,255,0.07)";
        ctx.fillRect(gox + c * (cs + 3), goy + r * (cs + 3), cs, cs);
      }
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 19. Number Bingo
export const NumberBingoAnim = () => {
  const ballsRef = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      num: Math.floor(Math.random() * 75) + 1,
      x: 0.15 + (i / 5) * 0.7,
      phase: Math.random() * TAU,
    }))
  );
  const ref = useLoop((ctx, w, h, t) => {
    ballsRef.current.forEach((b, i) => {
      const x = b.x * w;
      const y = h * 0.45 + Math.sin(t * 1.5 + b.phase) * 12;
      const active = Math.floor(t * 0.7) % 6 === i;
      // ball
      ctx.beginPath();
      ctx.arc(x, y, active ? 16 : 13, 0, TAU);
      ctx.fillStyle = active ? "rgba(231,76,60,0.8)" : "rgba(255,255,255,0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // number
      ctx.font = `bold ${active ? 12 : 10}px sans-serif`;
      ctx.fillStyle = active ? "#fff" : "rgba(255,255,255,0.5)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(b.num), x, y);
    });
    ctx.textBaseline = "alphabetic";
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 20. Impromptu Speaking
export const SpeakingAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, cy = h * 0.55;
    // microphone
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.beginPath();
    ctx.arc(cx, cy - 12, 10, Math.PI, 0);
    ctx.fillRect(cx - 10, cy - 12, 20, 12);
    ctx.fill();
    ctx.fillRect(cx - 2, cy, 4, 16);
    ctx.fillRect(cx - 10, cy + 16, 20, 3);
    // sound waves
    for (let i = 1; i <= 3; i++) {
      const r = 15 + i * 10;
      const alpha = 0.3 - i * 0.08 + Math.sin(t * 4 + i) * 0.1;
      ctx.strokeStyle = `rgba(0,200,200,${Math.max(0, alpha)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 5, r, -0.8, 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - 5, r, Math.PI - 0.8, Math.PI + 0.8);
      ctx.stroke();
    }
    // timer
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "rgba(241,196,15,0.7)";
    ctx.textAlign = "center";
    const secs = Math.floor(60 - (t * 3) % 60);
    ctx.fillText(`0:${secs.toString().padStart(2, "0")}`, cx, h * 0.18);
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 21. Motivation Lab (flame growing)
export const FlameAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, base = h * 0.75;
    // match stick
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(cx - 2, base - 5, 4, 25);
    // flame
    const flicker = Math.sin(t * 10) * 3;
    const size = 15 + Math.sin(t * 0.5) * 5;
    const grad = ctx.createRadialGradient(cx, base - size, 2, cx, base - 5, size);
    grad.addColorStop(0, "rgba(255,255,100,0.9)");
    grad.addColorStop(0.4, "rgba(255,150,50,0.7)");
    grad.addColorStop(1, "rgba(255,50,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.6, base - 5);
    ctx.quadraticCurveTo(cx - size * 0.3 + flicker, base - size * 0.8, cx, base - size * 1.3);
    ctx.quadraticCurveTo(cx + size * 0.3 - flicker, base - size * 0.8, cx + size * 0.6, base - 5);
    ctx.fill();
    // sparks
    for (let i = 0; i < 5; i++) {
      const sx = cx + Math.sin(t * 3 + i * 2) * 8;
      const sy = base - size - 5 - ((t * 20 + i * 15) % 25);
      ctx.fillStyle = `rgba(255,200,50,${0.7 - (sy / h)})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 22. Tic-Tac-Toe
export const TicTacToeAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2, cy = h / 2;
    const size = Math.min(w, h) * 0.35;
    const cs = size / 3;
    const ox = cx - size / 2, oy = cy - size / 2;
    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(ox + i * cs, oy);
      ctx.lineTo(ox + i * cs, oy + size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox, oy + i * cs);
      ctx.lineTo(ox + size, oy + i * cs);
      ctx.stroke();
    }
    // pieces appearing
    const board = [1, 0, -1, 0, 1, 0, -1, 0, 1]; // X=1, O=-1
    const step = Math.floor(t * 1.2) % 10;
    board.forEach((v, i) => {
      if (v === 0 || i >= step) return;
      const col = i % 3, row = Math.floor(i / 3);
      const px = ox + col * cs + cs / 2, py = oy + row * cs + cs / 2;
      if (v === 1) {
        ctx.strokeStyle = "rgba(0,200,200,0.7)";
        ctx.lineWidth = 2;
        const s = cs * 0.3;
        ctx.beginPath();
        ctx.moveTo(px - s, py - s);
        ctx.lineTo(px + s, py + s);
        ctx.moveTo(px + s, py - s);
        ctx.lineTo(px - s, py + s);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(231,76,60,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, cs * 0.28, 0, TAU);
        ctx.stroke();
      }
    });
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 23. VisualCode Lab (flowing blocks)
export const CodeFlowAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const blocks = [
      { label: "main()", y: 0.15, color: "rgba(86,156,214,0.6)" },
      { label: "x = 5", y: 0.35, color: "rgba(181,206,168,0.6)" },
      { label: "loop", y: 0.55, color: "rgba(197,134,192,0.6)" },
      { label: "print", y: 0.75, color: "rgba(206,145,120,0.6)" },
    ];
    const active = Math.floor(t * 0.8) % blocks.length;
    blocks.forEach((b, i) => {
      const bx = w * 0.2, by = h * b.y;
      const bw = w * 0.6, bh = 18;
      ctx.fillStyle = i === active ? b.color : "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 4);
      ctx.fill();
      if (i === active) {
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.font = "10px monospace";
      ctx.fillStyle = i === active ? "#fff" : "rgba(255,255,255,0.3)";
      ctx.textAlign = "center";
      ctx.fillText(b.label, w / 2, by + 13);
      // arrow
      if (i < blocks.length - 1) {
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, by + bh + 2);
        ctx.lineTo(w / 2, by + bh + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(w / 2 - 3, by + bh + 7);
        ctx.lineTo(w / 2, by + bh + 11);
        ctx.lineTo(w / 2 + 3, by + bh + 7);
        ctx.stroke();
      }
    });
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 24. Live Quiz Competition (podium)
export const PodiumAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const base = h * 0.85;
    const podiums = [
      { x: w * 0.25, h: 35, color: "rgba(192,192,192,0.5)", label: "2nd", emoji: "🥈" },
      { x: w * 0.5, h: 50, color: "rgba(241,196,15,0.5)", label: "1st", emoji: "🥇" },
      { x: w * 0.75, h: 25, color: "rgba(205,127,50,0.5)", label: "3rd", emoji: "🥉" },
    ];
    podiums.forEach((p, i) => {
      const bounce = i === 1 ? Math.sin(t * 2) * 3 : 0;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 20, base - p.h + bounce, 40, p.h);
      ctx.font = "16px serif";
      ctx.textAlign = "center";
      ctx.fillText(p.emoji, p.x, base - p.h - 8 + bounce);
      ctx.font = "9px sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText(p.label, p.x, base - p.h + 16 + bounce);
    });
    // confetti for winner
    if (Math.sin(t * 3) > 0.5) {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = ["#ff0", "#0ff", "#f0f", "#0f0"][i];
        ctx.globalAlpha = 0.6;
        const cx2 = w * 0.5 + Math.sin(t * 5 + i * 2) * 20;
        const cy2 = h * 0.15 + Math.cos(t * 4 + i) * 10;
        ctx.fillRect(cx2, cy2, 3, 3);
      }
      ctx.globalAlpha = 1;
    }
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 25. Random Number Duel (rolling guesses + target lock)
export const RandomNumberDuelAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2;
    const cy = h * 0.52;
    const ringR = Math.min(w, h) * 0.28;

    const target = 250 + Math.floor(Math.sin(t * 0.6) * 180);
    const guess = Math.round(250 + Math.sin(t * 2.3) * 240);
    const diff = Math.min(1, Math.abs(target - guess) / 250);

    // Background track ring
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, TAU);
    ctx.stroke();

    // Progress ring that pulses faster as guess gets closer
    const sweep = (1 - diff) * TAU;
    ctx.strokeStyle = `rgba(${Math.floor(80 + (1 - diff) * 120)}, 230, 220, 0.85)`;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + sweep);
    ctx.stroke();
    ctx.lineCap = "butt";

    // Number strip at top
    const stripY = h * 0.2;
    const values = [guess - 12, guess - 4, guess, guess + 5, guess + 13].map(v => {
      if (v < 0) return 0;
      if (v > 500) return 500;
      return v;
    });
    values.forEach((v, i) => {
      const x = cx - 70 + i * 35;
      const active = i === 2;
      ctx.font = `${active ? "bold 14px" : "11px"} monospace`;
      ctx.fillStyle = active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.35)";
      ctx.textAlign = "center";
      ctx.fillText(String(v), x, stripY);
    });

    // Center readout
    ctx.font = "bold 18px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.textAlign = "center";
    ctx.fillText(String(guess), cx, cy + 6);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(`target: ${target}`, cx, cy + 22);

    // Hint text
    const hint = guess < target ? "HIGHER" : guess > target ? "LOWER" : "LOCKED";
    ctx.font = "bold 10px sans-serif";
    ctx.fillStyle = hint === "LOCKED" ? "rgba(46,204,113,0.95)" : "rgba(0,220,255,0.85)";
    ctx.fillText(hint, cx, cy + ringR + 16);

    // Two player indicators at bottom
    const turn = Math.floor(t * 1.4) % 2;
    const p1x = cx - 40;
    const p2x = cx + 40;
    const py = h * 0.86;

    ctx.fillStyle = turn === 0 ? "rgba(0,220,255,0.85)" : "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.roundRect(p1x - 24, py - 10, 48, 18, 5);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 9px sans-serif";
    ctx.fillText("P1", p1x, py + 3);

    ctx.fillStyle = turn === 1 ? "rgba(255,110,180,0.85)" : "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.roundRect(p2x - 24, py - 10, 48, 18, 5);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("P2", p2x, py + 3);
  });

  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 26. Cloud Computing (floating cloud + server stack)
export const CloudAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2;
    const cloudY = h * 0.38 + Math.sin(t * 1.6) * 4;
    const drift = Math.sin(t * 0.9) * 10;

    // soft sky glow
    const glow = ctx.createRadialGradient(cx, cloudY, 10, cx, cloudY, Math.min(w, h) * 0.7);
    glow.addColorStop(0, "rgba(77, 208, 255, 0.16)");
    glow.addColorStop(1, "rgba(77, 208, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // cloud body
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.arc(cx - 18 + drift * 0.18, cloudY, 16, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(cx, cloudY - 10, 20, Math.PI, 0);
    ctx.arc(cx + 20 - drift * 0.14, cloudY, 14, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();

    // server rack
    const rackX = cx - 28;
    const rackY = h * 0.58;
    ctx.fillStyle = "rgba(9, 18, 38, 0.85)";
    ctx.beginPath();
    ctx.roundRect(rackX, rackY, 56, 24, 6);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const lightOn = Math.sin(t * 2.4 + i) > 0;
      ctx.fillStyle = lightOn ? "rgba(46, 204, 113, 0.95)" : "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.arc(rackX + 12 + i * 15, rackY + 12, 2.5, 0, TAU);
      ctx.fill();
    }

    // little clouds / packets
    const packetXs = [w * 0.22, w * 0.76];
    packetXs.forEach((x, i) => {
      const y = h * (0.22 + i * 0.36) + Math.sin(t * (1.8 + i * 0.2)) * 5;
      ctx.fillStyle = i === 0 ? "rgba(110, 231, 255, 0.8)" : "rgba(168, 85, 247, 0.8)";
      ctx.beginPath();
      ctx.arc(x, y, 4 + Math.sin(t * 3 + i) * 1.5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(cx + drift * 0.2, cloudY);
      ctx.stroke();
    });
  });

  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 27. PyPlay (python play loop)
export const PyPlayAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    const cx = w / 2;
    const cy = h / 2;

    // Background glow
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(w, h) * 0.75);
    glow.addColorStop(0, "rgba(255, 212, 59, 0.16)");
    glow.addColorStop(1, "rgba(255, 212, 59, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Python-like dual orbs
    const bob = Math.sin(t * 2) * 4;
    const leftX = cx - 16;
    const rightX = cx + 16;
    const topY = cy - 8 + bob;
    const bottomY = cy + 10 - bob;

    ctx.fillStyle = "rgba(53, 114, 165, 0.9)";
    ctx.beginPath();
    ctx.roundRect(leftX - 18, topY - 16, 34, 34, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 213, 60, 0.92)";
    ctx.beginPath();
    ctx.roundRect(rightX - 16, bottomY - 16, 34, 34, 10);
    ctx.fill();

    // Eye dots
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(leftX - 6, topY - 2, 2.2, 0, TAU);
    ctx.arc(rightX + 6, bottomY + 1, 2.2, 0, TAU);
    ctx.fill();

    // Play button pulse
    const pulse = 1 + Math.sin(t * 3) * 0.08;
    ctx.save();
    ctx.translate(cx, cy + 4);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    ctx.moveTo(-6, -10);
    ctx.lineTo(12, 0);
    ctx.lineTo(-6, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Floating code bars
    const bars = [0.18, 0.42, 0.66, 0.82];
    bars.forEach((p, i) => {
      const bw = 28 + i * 7;
      const x = w * 0.2 + Math.sin(t * 1.4 + i) * 5;
      const y = h * p + Math.cos(t * 1.8 + i) * 2;
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.roundRect(x, y, bw, 3, 2);
      ctx.fill();
    });

    // Small terminal caret
    if (Math.sin(t * 5) > -0.2) {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillRect(w * 0.72, h * 0.72, 5, 2);
    }
  });

  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// 28. Maths Tug Of War
export const TugOfWarAnim = () => {
  const symbolsRef = useRef(
    Array.from({ length: 6 }, (_, i) => ({
      x: 0.1 + Math.random() * 0.8,
      y: Math.random(),
      s: 0.3 + Math.random() * 0.5,
      char: ["+", "−", "×", "÷", "=", "π"][i],
    }))
  );
  const ref = useLoop((ctx, w, h, t) => {
    const cy = h * 0.52;
    const ropeY = cy;
    const pull = Math.sin(t * 1.3) * w * 0.12;
    const flagX = w / 2 + pull;

    // Rope
    ctx.strokeStyle = "rgba(210,180,120,0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, ropeY);
    ctx.lineTo(w * 0.92, ropeY);
    ctx.stroke();

    // Rope segments / knots
    for (let k = 0; k < 7; k++) {
      const kx = w * 0.15 + k * (w * 0.7) / 6 + pull * 0.3;
      ctx.fillStyle = "rgba(180,140,80,0.7)";
      ctx.beginPath();
      ctx.arc(kx, ropeY, 3, 0, TAU);
      ctx.fill();
    }

    // Center flag
    ctx.fillStyle = "rgba(255,220,50,0.9)";
    ctx.beginPath();
    ctx.moveTo(flagX, ropeY - 18);
    ctx.lineTo(flagX + 10, ropeY - 12);
    ctx.lineTo(flagX, ropeY - 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(flagX, ropeY - 20);
    ctx.lineTo(flagX, ropeY);
    ctx.stroke();

    // Left character (blue team)
    const lx = w * 0.1 + pull * 0.15;
    const lean = Math.sin(t * 3) * 2;
    ctx.fillStyle = "rgba(52,152,219,0.85)";
    ctx.beginPath();
    ctx.arc(lx, cy - 22, 7, 0, TAU);
    ctx.fill();
    ctx.fillRect(lx - 4, cy - 15, 8, 14);
    // Arms reaching right
    ctx.strokeStyle = "rgba(52,152,219,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx + 4, cy - 10);
    ctx.lineTo(lx + 18 + lean, ropeY);
    ctx.stroke();
    // Legs
    ctx.beginPath();
    ctx.moveTo(lx - 2, cy - 1);
    ctx.lineTo(lx - 6 - lean, cy + 12);
    ctx.moveTo(lx + 2, cy - 1);
    ctx.lineTo(lx + 2, cy + 12);
    ctx.stroke();

    // Right character (red team)
    const rx = w * 0.9 + pull * 0.15;
    ctx.fillStyle = "rgba(231,76,60,0.85)";
    ctx.beginPath();
    ctx.arc(rx, cy - 22, 7, 0, TAU);
    ctx.fill();
    ctx.fillRect(rx - 4, cy - 15, 8, 14);
    ctx.strokeStyle = "rgba(231,76,60,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx - 4, cy - 10);
    ctx.lineTo(rx - 18 - lean, ropeY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx - 2, cy - 1);
    ctx.lineTo(rx - 2, cy + 12);
    ctx.moveTo(rx + 2, cy - 1);
    ctx.lineTo(rx + 6 + lean, cy + 12);
    ctx.stroke();

    // Dust particles
    for (let d = 0; d < 4; d++) {
      const dx = (d < 2 ? lx : rx) + Math.sin(t * 5 + d * 3) * 6;
      const dy = cy + 14 + Math.abs(Math.sin(t * 4 + d)) * 4;
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.sin(t * 6 + d) * 0.08})`;
      ctx.beginPath();
      ctx.arc(dx, dy, 1.5, 0, TAU);
      ctx.fill();
    }

    // Floating math symbols
    symbolsRef.current.forEach((s) => {
      const sy = ((s.y - t * s.s * 0.06) % 1 + 1) % 1;
      const sx = s.x * w + Math.sin(t * 1.2 + s.x * 5) * 6;
      ctx.font = "bold 11px sans-serif";
      ctx.fillStyle = `rgba(0,220,220,${0.25 + Math.sin(t * 2 + s.x * 8) * 0.12})`;
      ctx.textAlign = "center";
      ctx.fillText(s.char, sx, sy * h);
    });

    // Team labels
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(52,152,219,0.6)";
    ctx.fillText("BLUE", lx, cy + 28);
    ctx.fillStyle = "rgba(231,76,60,0.6)";
    ctx.fillText("RED", rx, cy + 28);
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};

// ─── Flexbox Quest ──────────────────────────────────────────────────
export const FlexboxQuestAnim = () => {
  const ref = useLoop((ctx, w, h, t) => {
    // Pond background
    const pondX = w * 0.15, pondY = h * 0.15, pondW = w * 0.7, pondH = h * 0.65;
    ctx.fillStyle = "rgba(30,80,120,0.35)";
    ctx.beginPath();
    ctx.roundRect(pondX, pondY, pondW, pondH, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(34,211,238,0.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lily pads (targets) — stationary
    const lilyPositions = [
      { x: pondX + pondW * 0.25, y: pondY + pondH * 0.5 },
      { x: pondX + pondW * 0.5, y: pondY + pondH * 0.5 },
      { x: pondX + pondW * 0.75, y: pondY + pondH * 0.5 },
    ];
    lilyPositions.forEach((p) => {
      ctx.fillStyle = "rgba(34,197,94,0.2)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(34,197,94,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 14, 0, TAU);
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Frogs — bounce between positions
    const frogColors = ["rgba(74,222,128,0.9)", "rgba(250,204,21,0.9)", "rgba(248,113,113,0.9)"];
    const phase = t * 0.8;
    const positions = [
      // Frogs move from left cluster toward lily pads
      { x: pondX + pondW * (0.15 + 0.1 * Math.sin(phase)), y: pondY + pondH * (0.3 + 0.2 * Math.sin(phase * 1.3)) },
      { x: pondX + pondW * (0.5 + 0.15 * Math.sin(phase + 2)), y: pondY + pondH * (0.5 + 0.15 * Math.cos(phase * 0.9)) },
      { x: pondX + pondW * (0.75 + 0.1 * Math.cos(phase + 1)), y: pondY + pondH * (0.7 - 0.2 * Math.sin(phase * 1.1)) },
    ];
    positions.forEach((p, i) => {
      ctx.fillStyle = frogColors[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, TAU);
      ctx.fill();
      // Eyes
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(p.x - 3, p.y - 3, 2.5, 0, TAU);
      ctx.arc(p.x + 3, p.y - 3, 2.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.beginPath();
      ctx.arc(p.x - 3, p.y - 3, 1.2, 0, TAU);
      ctx.arc(p.x + 3, p.y - 3, 1.2, 0, TAU);
      ctx.fill();
    });

    // Floating CSS labels
    ctx.font = "bold 8px monospace";
    const labels = ["justify-content", "align-items", "flex-wrap", "order"];
    labels.forEach((label, i) => {
      const lx = w * 0.1 + (i * w * 0.25);
      const ly = h * 0.88 + Math.sin(t * 1.5 + i * 1.5) * 4;
      const alpha = 0.25 + 0.15 * Math.sin(t * 2 + i);
      ctx.fillStyle = `rgba(167,139,250,${alpha})`;
      ctx.textAlign = "center";
      ctx.fillText(label, lx, ly);
    });

    // "display: flex" badge
    ctx.font = "bold 9px monospace";
    ctx.fillStyle = "rgba(34,211,238,0.5)";
    ctx.textAlign = "center";
    ctx.fillText("display: flex;", w / 2, pondY + pondH + 16);
  });
  return <canvas ref={ref} className={CANVAS_CLASS} />;
};
