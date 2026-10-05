// Synthesizes short demo "pujo" tracks (tanpura drone + dhak beats + plucked melody)
// so the player is fully functional before the owner uploads real MP3s.
import fs from "node:fs";
import path from "node:path";

const SR = 22050;

function writeWav(file, samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(file, buf);
}

function makeTrack({ duration, tempo, root, seed, sparse }) {
  const n = Math.floor(SR * duration);
  const out = new Float32Array(n);
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  // --- tanpura-ish drone ---
  const r2 = Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const shimmer = 0.6 + 0.4 * Math.sin(r2 * 0.18 * t + seed % 7);
    out[i] +=
      0.05 * Math.sin(r2 * root * t) +
      0.03 * Math.sin(r2 * root * 1.5 * t) +
      0.018 * Math.sin(r2 * root * 2.02 * t) * shimmer;
  }

  // --- dhak rhythm (8th-note pattern) ---
  const beat = 60 / tempo;
  const step = beat / 2;
  const pattern = sparse ? [1, 0, 0, 0.7, 0, 0.5, 0, 0.8] : [1, 0, 0.7, 0, 1, 0, 0.9, 0.5];
  for (let i = 0; i * step < duration - 0.8; i++) {
    const idx = Math.floor(i * step * SR);
    const p = pattern[i % pattern.length];
    if (!p) continue;
    const isLow = i % 2 === 0;
    const f0 = isLow ? 72 + rand() * 14 : 170 + rand() * 40;
    const amp = (isLow ? 0.5 : 0.26) * p;
    const len = Math.min(Math.floor((isLow ? 0.32 : 0.13) * SR), n - idx);
    for (let j = 0; j < len; j++) {
      const t = j / SR;
      const env = Math.exp(-t * (isLow ? 11 : 28));
      out[idx + j] +=
        amp * env * Math.sin(r2 * f0 * (1 - 0.25 * t) * t) * (isLow ? 1 : 0.8) +
        (isLow ? 0 : amp * 0.4 * env * Math.sin(r2 * f0 * 2.7 * t));
    }
  }

  // --- plucked melody (sa re ga pa dha) ---
  const semi = [0, 2, 4, 7, 9];
  let mi = 2;
  for (let t = beat * 2; t < duration - 1.2; t += beat * 2) {
    if (rand() < 0.78) {
      mi = Math.max(0, Math.min(4, mi + (rand() < 0.5 ? 1 : -1) * (rand() < 0.25 ? 2 : 1)));
      const f = root * 2 * Math.pow(2, semi[mi] / 12);
      const idx = Math.floor(t * SR);
      const len = Math.min(Math.floor(beat * 1.9 * SR), n - idx);
      for (let j = 0; j < len; j++) {
        const tt = j / SR;
        const env = Math.exp(-tt * 3.6) * (0.6 + 0.4 * Math.sin(r2 * 6 * tt) * Math.exp(-tt * 9));
        out[idx + j] +=
          0.11 * env * (Math.sin(r2 * f * tt) + 0.35 * Math.sin(r2 * f * 2 * tt) + 0.12 * Math.sin(r2 * f * 3 * tt));
      }
    }
  }

  // normalize + fades
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const g = peak > 0 ? 0.82 / peak : 1;
  const fade = Math.min(Math.floor(SR * 0.4), Math.floor(n * 0.08));
  for (let i = 0; i < n; i++) {
    out[i] *= g;
    if (i < fade) out[i] *= i / fade;
    if (i > n - fade) out[i] *= (n - i) / fade;
  }
  return out;
}

const outDir = path.join(process.cwd(), "public", "audio");
fs.mkdirSync(outDir, { recursive: true });

const tracks = [
  { file: "demo-1.wav", duration: 38, tempo: 116, root: 73.42, seed: 11, sparse: false },
  { file: "demo-2.wav", duration: 34, tempo: 96, root: 82.41, seed: 47, sparse: true },
  { file: "demo-3.wav", duration: 40, tempo: 126, root: 73.42, seed: 83, sparse: false },
  { file: "demo-4.wav", duration: 32, tempo: 104, root: 65.41, seed: 29, sparse: true },
];

for (const t of tracks) {
  const samples = makeTrack(t);
  const p = path.join(outDir, t.file);
  writeWav(p, samples);
  console.log(`wrote ${p} (${(fs.statSync(p).size / 1024 / 1024).toFixed(2)} MB)`);
}
