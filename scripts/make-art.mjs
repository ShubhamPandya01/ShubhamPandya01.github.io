/**
 * Generates the abstract artwork used on the project cards and the
 * capabilities panel. Each piece is drawn white-on-transparent from a seeded
 * RNG, so output is deterministic. The page uses the files as CSS masks over
 * the seasonal accent gradient, which is what lets one set of files recolour
 * itself for every season and festival.
 *
 * These are deliberately non-representational. They are not screenshots and
 * do not claim to show the project. Replace any of them with a real capture
 * when one exists.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.join(here, "..", "public", "img");

// [output path relative to public/img, kind, width, height, seed]
const PIECES = [
  ["work/agripulse.webp", "scatter", 1000, 1000, 11],
  ["work/smartcodebot.webp", "flow", 1000, 1000, 23],
  ["work/cloud-pipeline.webp", "blocks", 1200, 400, 31],
  ["work/forensics.webp", "grid", 1200, 400, 47],
  ["work/pentest.webp", "nodes", 1200, 400, 59],
  ["work/homelab.webp", "rings", 1200, 400, 67],
  ["work/data-pipeline.webp", "bars", 1200, 400, 79],
  ["work/ml-anomaly.webp", "scatter", 1200, 400, 97],
  ["texture-security.webp", "nodes", 1200, 675, 5],
];

const PAGE = `<!doctype html><html><body style="margin:0"><canvas id="c"></canvas>
<script>
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
window.draw = function(kind, w, h, seed){
  const c = document.getElementById('c');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0,0,w,h);
  const r = rng(seed);
  const INK = '#ffffff';
  const a = (v) => 'rgba(255,255,255,' + v.toFixed(3) + ')';

  // faint base grid shared by every piece
  g.strokeStyle = a(0.10); g.lineWidth = 1;
  const step = Math.max(28, Math.round(Math.min(w,h)/18));
  for (let x=0; x<=w; x+=step){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,h); g.stroke(); }
  for (let y=0; y<=h; y+=step){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); }

  if (kind === 'nodes') {
    const n = Math.round(w*h/14000);
    const pts = Array.from({length:n},()=>({x:r()*w, y:r()*h, s: 1.4+r()*2.6}));
    g.lineWidth = 1.2;
    const lim = Math.min(w,h)*0.22;
    for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++){
      const d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y);
      if (d < lim){ g.strokeStyle = a(0.55*(1-d/lim));
        g.beginPath(); g.moveTo(pts[i].x,pts[i].y); g.lineTo(pts[j].x,pts[j].y); g.stroke(); }
    }
    for (const p of pts){ g.fillStyle = INK; g.globalAlpha = 0.6+r()*0.4;
      g.beginPath(); g.arc(p.x,p.y,p.s,0,7); g.fill(); }
    g.globalAlpha = 1;
  }

  if (kind === 'scatter') {
    const m = Math.min(w,h);
    const clusters = [{x:w*0.33,y:h*0.42,n:170,sp:m*0.14},
                      {x:w*0.68,y:h*0.62,n:140,sp:m*0.11},
                      {x:w*0.55,y:h*0.25,n:50,sp:m*0.2}];
    for (const cl of clusters) for (let i=0;i<cl.n;i++){
      const ang = r()*Math.PI*2, d = Math.abs(r()+r()-1)*cl.sp*2;
      g.fillStyle = INK; g.globalAlpha = 0.35+r()*0.65;
      g.beginPath(); g.arc(cl.x+Math.cos(ang)*d, cl.y+Math.sin(ang)*d, 1.2+r()*2.8, 0, 7); g.fill();
    }
    g.globalAlpha = 0.8; g.strokeStyle = INK; g.lineWidth = 2; g.setLineDash([8,7]);
    g.beginPath();
    for (let x=0;x<=w;x+=8){ const y = h*0.72 - Math.sin(x/w*3.1)*h*0.22; x===0?g.moveTo(x,y):g.lineTo(x,y); }
    g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
  }

  if (kind === 'blocks') {
    const bw = Math.min(w,h)*0.16, bh = bw*0.55;
    for (let row=0; row<5; row++) for (let col=0; col<9; col++){
      if (r() < 0.3) continue;
      const x = w*0.1 + col*bw*0.92 - row*bw*0.46;
      const y = h*0.22 + row*bh*0.62;
      g.globalAlpha = 0.35+r()*0.6;
      g.strokeStyle = INK; g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(x, y); g.lineTo(x+bw/2, y-bh/2); g.lineTo(x+bw, y); g.lineTo(x+bw/2, y+bh/2); g.closePath();
      g.stroke();
      if (r() < 0.4){ g.fillStyle = a(0.22); g.fill(); }
    }
    g.globalAlpha = 1;
  }

  if (kind === 'bars') {
    const n = 34, gap = w/n;
    for (let i=0;i<n;i++){
      const v = 0.2 + Math.abs(Math.sin(i*0.55+seed))*0.62 + r()*0.16;
      const bh2 = v*h*0.62;
      g.globalAlpha = 0.3+v*0.6; g.fillStyle = INK;
      g.fillRect(i*gap + gap*0.22, h*0.82-bh2, gap*0.5, bh2);
    }
    g.globalAlpha = 0.85; g.strokeStyle = INK; g.lineWidth = 2.4;
    g.beginPath();
    for (let x=0;x<=w;x+=6){ const y = h*0.30 + Math.sin(x/w*7+seed)*h*0.10; x===0?g.moveTo(x,y):g.lineTo(x,y); }
    g.stroke(); g.globalAlpha = 1;
  }

  if (kind === 'flow') {
    const lanes = 5;
    for (let l=0; l<lanes; l++){
      const y = h*(0.2 + l*0.15);
      g.globalAlpha = 0.45; g.strokeStyle = INK; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(w*0.05,y); g.lineTo(w*0.95,y); g.stroke();
      let x = w*0.1;
      while (x < w*0.9){
        if (r() < 0.55){
          g.globalAlpha = 0.55+r()*0.45; g.fillStyle = INK;
          g.beginPath(); g.arc(x,y,3+r()*3.4,0,7); g.fill();
          if (l < lanes-1 && r() < 0.4){
            const y2 = h*(0.2+(l+1)*0.15);
            g.globalAlpha = 0.6; g.strokeStyle = INK; g.lineWidth = 1.6;
            g.beginPath(); g.moveTo(x,y);
            g.bezierCurveTo(x+w*0.05,y, x+w*0.02,y2, x+w*0.07,y2);
            g.stroke();
          }
        }
        x += w*0.05 + r()*w*0.05;
      }
    }
    g.globalAlpha = 1;
  }

  if (kind === 'grid') {
    const cell = Math.min(w,h)*0.12;
    for (let y=0; y<h; y+=cell) for (let x=0; x<w; x+=cell){
      const v = r();
      if (v < 0.42) continue;
      g.globalAlpha = 0.2+v*0.6;
      if (v > 0.86){ g.fillStyle = INK; g.fillRect(x+3,y+3,cell-6,cell-6); }
      else { g.strokeStyle = INK; g.lineWidth = 1.4; g.strokeRect(x+3,y+3,cell-6,cell-6); }
    }
    g.globalAlpha = 1;
  }

  if (kind === 'rings') {
    const cx = w*0.5, cy = h*0.52, max = Math.min(w,h)*0.62;
    for (let i=1;i<=9;i++){
      g.globalAlpha = 0.2 + (1-i/9)*0.6;
      g.strokeStyle = INK; g.lineWidth = i===3 ? 2.4 : 1.3;
      g.beginPath(); g.arc(cx,cy,(max/9)*i,0,Math.PI*2); g.stroke();
    }
    for (let i=0;i<12;i++){
      const ang = r()*Math.PI*2, d = r()*max;
      g.globalAlpha = 0.6+r()*0.4; g.fillStyle = INK;
      g.beginPath(); g.arc(cx+Math.cos(ang)*d, cy+Math.sin(ang)*d, 2+r()*2.8, 0, 7); g.fill();
    }
    g.globalAlpha = 0.8; g.strokeStyle = INK; g.lineWidth = 1.8;
    const sweep = r()*Math.PI*2;
    g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+Math.cos(sweep)*max, cy+Math.sin(sweep)*max); g.stroke();
    g.globalAlpha = 1;
  }

  // Fade the edges out through alpha so the art dissolves into the card
  // instead of ending at a hard rectangle.
  g.globalCompositeOperation = 'destination-in';
  const vg = g.createRadialGradient(w/2,h/2,Math.min(w,h)*0.15,w/2,h/2,Math.max(w,h)*0.72);
  vg.addColorStop(0,'rgba(0,0,0,1)'); vg.addColorStop(1,'rgba(0,0,0,0.15)');
  g.fillStyle = vg; g.fillRect(0,0,w,h);
  g.globalCompositeOperation = 'source-over';

  return c.toDataURL('image/webp', 0.9);
};
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(PAGE);

let total = 0;
for (const [rel, kind, w, h, seed] of PIECES) {
  const dataUrl = await page.evaluate(
    ([k, ww, hh, s]) => window.draw(k, ww, hh, s),
    [kind, w, h, seed]
  );
  if (!dataUrl.startsWith("data:image/webp")) throw new Error("WebP encoding unavailable");
  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  const file = path.join(IMG, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  total += buf.length;
  console.log(`  ${rel.padEnd(28)} ${w}x${h}  ${kind.padEnd(8)} ${Math.round(buf.length / 1024)}KB`);
}

await browser.close();
console.log(`\n${PIECES.length} pieces, ${Math.round(total / 1024)}KB total`);
