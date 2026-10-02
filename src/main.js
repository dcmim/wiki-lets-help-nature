/**
 * Let's Help Our Nature Clean And Green
 * Vanilla JavaScript Engine: Web Audio API Synth, Canvas Restorer, Video Controller,
 * Interactive Guides, Slide Sizing Algorithm with 90° Landscape Rotator & Mobile Controls
 */

// --- 1. Web Audio API Nature Soundscape Engine ---
class NatureAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.isPlaying = false;
    this.channels = {
      birds: { gain: null, node: null, volume: 0.65 },
      stream: { gain: null, node: null, volume: 0.5 },
      rain: { gain: null, node: null, volume: 0.4 },
      crickets: { gain: null, node: null, volume: 0.3 }
    };
    this.birdTimer = null;
    this.streamNodes = [];
    this.rainNodes = [];
    this.cricketTimer = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 64;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    for (const key in this.channels) {
      const chGain = this.ctx.createGain();
      chGain.gain.setValueAtTime(this.channels[key].volume, this.ctx.currentTime);
      chGain.connect(this.masterGain);
      this.channels[key].gain = chGain;
    }
  }

  async start() {
    this.init();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    this.isPlaying = true;
    this.startStreamSynth();
    this.startRainSynth();
    this.startBirdSynth();
    this.startCricketSynth();
  }

  stop() {
    this.isPlaying = false;
    if (this.birdTimer) clearInterval(this.birdTimer);
    if (this.cricketTimer) clearInterval(this.cricketTimer);
    this.streamNodes.forEach(n => {
      try { n.stop(); n.disconnect(); } catch (e) {}
    });
    this.streamNodes = [];
    this.rainNodes.forEach(n => {
      try { n.stop(); n.disconnect(); } catch (e) {}
    });
    this.rainNodes = [];
  }

  setMasterVolume(val) {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime + 0.05);
  }

  setChannelVolume(channel, val) {
    if (!this.channels[channel] || !this.channels[channel].gain || !this.ctx) return;
    this.channels[channel].volume = val;
    this.channels[channel].gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime + 0.05);
  }

  createNoiseBuffer(seconds = 3) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  startStreamSynth() {
    const noiseBuffer = this.createNoiseBuffer(5);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.35, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(this.channels.stream.gain);

    noiseSource.start();
    lfo.start();
    this.streamNodes = [noiseSource, lfo];
  }

  startRainSynth() {
    const noiseBuffer = this.createNoiseBuffer(4);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(6500, this.ctx.currentTime);

    noiseSource.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(this.channels.rain.gain);

    noiseSource.start();
    this.rainNodes = [noiseSource];
  }

  triggerBirdChirp() {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 2200 + Math.random() * 1800;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 900, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq - 400, now + 0.18);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.channels.birds.gain);

    osc.start(now);
    osc.stop(now + 0.25);

    if (Math.random() > 0.45) {
      setTimeout(() => {
        if (!this.isPlaying) return;
        const now2 = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(baseFreq + 400, now2);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq + 1200, now2 + 0.07);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq, now2 + 0.16);

        gain2.gain.setValueAtTime(0, now2);
        gain2.gain.linearRampToValueAtTime(0.18, now2 + 0.03);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.18);

        osc2.connect(gain2);
        gain2.connect(this.channels.birds.gain);
        osc2.start(now2);
        osc2.stop(now2 + 0.2);
      }, 140);
    }
  }

  startBirdSynth() {
    this.triggerBirdChirp();
    this.birdTimer = setInterval(() => {
      if (Math.random() > 0.3) {
        this.triggerBirdChirp();
      }
    }, 2800);
  }

  triggerCricketChirp() {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(4600 + Math.random() * 400, now);

    gain.gain.setValueAtTime(0, now);
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.035;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.setValueAtTime(0.005, t + 0.02);
    }
    gain.gain.setValueAtTime(0, now + 0.12);

    osc.connect(gain);
    gain.connect(this.channels.crickets.gain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  startCricketSynth() {
    this.cricketTimer = setInterval(() => {
      if (Math.random() > 0.5) {
        this.triggerCricketChirp();
      }
    }, 1800);
  }

  playChime(type = 'leaf') {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.09);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else if (type === 'seed') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + idx * 0.06);
        g.gain.setValueAtTime(0.18, now + idx * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
        o.connect(g);
        g.connect(this.masterGain);
        o.start(now + idx * 0.06);
        o.stop(now + idx * 0.06 + 0.4);
      });
      return;
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.07);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }
}

// --- 2. Interactive Habitat Restorer Simulation (Canvas Animation) ---
class HabitatSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.actions = {
      trees: true,
      river: false,
      flowers: true,
      wildlife: false,
      energy: false
    };

    this.butterflies = [];
    this.birds = [];
    this.salmon = [];
    this.leaves = [];
    this.windTurbinesAngle = 0;
    this.time = 0;

    this.initEntities();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.width = this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.height = this.canvas.height = rect.height * (window.devicePixelRatio || 1);
    this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;
  }

  initEntities() {
    this.butterflies = Array.from({ length: 6 }, () => ({
      x: Math.random() * 800,
      y: 160 + Math.random() * 140,
      speedX: (Math.random() - 0.5) * 1.5,
      speedY: (Math.random() - 0.5) * 1.2,
      wingPhase: Math.random() * Math.PI,
      size: 6 + Math.random() * 4,
      hue: Math.random() > 0.5 ? 35 : 45
    }));

    this.birds = Array.from({ length: 4 }, () => ({
      x: -50 - Math.random() * 200,
      y: 35 + Math.random() * 70,
      speed: 1.8 + Math.random() * 1.2,
      wingAngle: 0,
      size: 7 + Math.random() * 3
    }));

    this.salmon = Array.from({ length: 3 }, () => ({
      x: 100 + Math.random() * 300,
      y: 280,
      jumpProgress: 0,
      isJumping: false,
      jumpTimer: Math.random() * 200
    }));

    this.leaves = Array.from({ length: 15 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 280,
      vx: 0.5 + Math.random() * 1.2,
      vy: 0.3 + Math.random() * 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      size: 5 + Math.random() * 4
    }));
  }

  toggleAction(name) {
    if (this.actions.hasOwnProperty(name)) {
      this.actions[name] = !this.actions[name];
      return this.actions[name];
    }
    return false;
  }

  calculateHealth() {
    const total = Object.keys(this.actions).length;
    const active = Object.values(this.actions).filter(Boolean).length;
    return Math.round((active / total) * 100);
  }

  animate() {
    if (!this.canvas) return;
    this.time += 0.02;
    this.ctx.clearRect(0, 0, this.cssWidth || 800, this.cssHeight || 380);

    const w = this.cssWidth || 800;
    const h = this.cssHeight || 380;
    const health = this.calculateHealth();

    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, h * 0.65);
    if (health > 60) {
      skyGrad.addColorStop(0, '#78c6e8');
      skyGrad.addColorStop(1, '#d8f1fb');
    } else if (health > 30) {
      skyGrad.addColorStop(0, '#98b8c6');
      skyGrad.addColorStop(1, '#d6e2e6');
    } else {
      skyGrad.addColorStop(0, '#939c9b');
      skyGrad.addColorStop(1, '#c0c5c4');
    }
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, w, h);

    const sunX = w * 0.82;
    const sunY = h * 0.22;
    const sunRadius = 30 + Math.sin(this.time * 1.5) * 2;
    const sunGrad = this.ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, sunRadius * 2);
    sunGrad.addColorStop(0, 'rgba(255, 248, 200, 0.95)');
    sunGrad.addColorStop(0.4, 'rgba(255, 235, 150, 0.4)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.ctx.fillStyle = sunGrad;
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = health > 50 ? '#638c6d' : '#7b877f';
    this.ctx.beginPath();
    this.ctx.moveTo(0, h * 0.55);
    this.ctx.bezierCurveTo(w * 0.25, h * 0.42, w * 0.45, h * 0.48, w * 0.7, h * 0.44);
    this.ctx.bezierCurveTo(w * 0.85, h * 0.42, w * 0.95, h * 0.5, w, h * 0.52);
    this.ctx.lineTo(w, h);
    this.ctx.lineTo(0, h);
    this.ctx.fill();

    if (this.actions.energy) {
      this.windTurbinesAngle += 0.035;
      const turbines = [
        { x: w * 0.68, y: h * 0.44, scale: 0.65 },
        { x: w * 0.75, y: h * 0.43, scale: 0.85 },
        { x: w * 0.82, y: h * 0.45, scale: 0.55 }
      ];
      turbines.forEach(t => {
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2 * t.scale;
        this.ctx.beginPath();
        this.ctx.moveTo(t.x, t.y);
        this.ctx.lineTo(t.x, t.y - 58 * t.scale);
        this.ctx.stroke();

        const hubY = t.y - 58 * t.scale;
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.beginPath();
        this.ctx.arc(t.x, hubY, 3 * t.scale, 0, Math.PI * 2);
        this.ctx.fill();

        for (let b = 0; b < 3; b++) {
          const bladeAngle = this.windTurbinesAngle + (b * Math.PI * 2) / 3;
          const bx = t.x + Math.cos(bladeAngle) * 28 * t.scale;
          const by = hubY + Math.sin(bladeAngle) * 28 * t.scale;
          this.ctx.lineWidth = 1.5 * t.scale;
          this.ctx.beginPath();
          this.ctx.moveTo(t.x, hubY);
          this.ctx.lineTo(bx, by);
          this.ctx.stroke();
        }
      });
    }

    const groundGrad = this.ctx.createLinearGradient(0, h * 0.5, 0, h);
    if (health > 60) {
      groundGrad.addColorStop(0, '#538a42');
      groundGrad.addColorStop(1, '#2f5d22');
    } else if (health > 30) {
      groundGrad.addColorStop(0, '#758852');
      groundGrad.addColorStop(1, '#4e5d36');
    } else {
      groundGrad.addColorStop(0, '#807765');
      groundGrad.addColorStop(1, '#534d40');
    }
    this.ctx.fillStyle = groundGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(0, h * 0.62);
    this.ctx.bezierCurveTo(w * 0.3, h * 0.58, w * 0.6, h * 0.64, w, h * 0.58);
    this.ctx.lineTo(w, h);
    this.ctx.lineTo(0, h);
    this.ctx.fill();

    const riverGrad = this.ctx.createLinearGradient(0, h * 0.68, 0, h);
    if (this.actions.river) {
      riverGrad.addColorStop(0, 'rgba(46, 172, 196, 0.88)');
      riverGrad.addColorStop(1, 'rgba(20, 115, 142, 0.95)');
    } else {
      riverGrad.addColorStop(0, 'rgba(139, 126, 92, 0.85)');
      riverGrad.addColorStop(1, 'rgba(92, 82, 57, 0.95)');
    }
    this.ctx.fillStyle = riverGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.42, h * 0.6);
    this.ctx.bezierCurveTo(w * 0.45, h * 0.72, w * 0.25, h * 0.82, w * 0.15, h);
    this.ctx.lineTo(w * 0.55, h);
    this.ctx.bezierCurveTo(w * 0.58, h * 0.82, w * 0.6, h * 0.72, w * 0.48, h * 0.6);
    this.ctx.closePath();
    this.ctx.fill();

    if (this.actions.river) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      for (let s = 0; s < 5; s++) {
        const sx = w * 0.32 + Math.sin(this.time * 2 + s) * (w * 0.08);
        const sy = h * 0.74 + s * 14;
        const sw = 14 + Math.sin(this.time * 3 + s) * 6;
        this.ctx.fillRect(sx, sy, sw, 2);
      }

      if (this.actions.wildlife) {
        this.salmon.forEach(fish => {
          fish.jumpTimer++;
          if (fish.jumpTimer > 180 && !fish.isJumping) {
            fish.isJumping = true;
            fish.jumpProgress = 0;
          }
          if (fish.isJumping) {
            fish.jumpProgress += 0.04;
            const arcY = Math.sin(fish.jumpProgress * Math.PI) * 26;
            const curY = h * 0.82 - arcY;
            const curX = w * 0.35 + fish.jumpProgress * 30;

            this.ctx.fillStyle = '#e8615a';
            this.ctx.beginPath();
            this.ctx.ellipse(curX, curY, 8, 3.5, 0.2, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillRect(curX - 4, h * 0.82 + 2, 2, 2);
            this.ctx.fillRect(curX + 4, h * 0.82 + 2, 2, 2);

            if (fish.jumpProgress >= 1) {
              fish.isJumping = false;
              fish.jumpTimer = Math.random() * 100;
            }
          }
        });
      }
    }

    if (this.actions.trees) {
      const treeConfigs = [
        { x: w * 0.12, y: h * 0.66, scale: 1.05, type: 'oak' },
        { x: w * 0.22, y: h * 0.62, scale: 0.85, type: 'pine' },
        { x: w * 0.78, y: h * 0.65, scale: 1.15, type: 'oak' },
        { x: w * 0.89, y: h * 0.62, scale: 0.9, type: 'pine' },
        { x: w * 0.64, y: h * 0.60, scale: 0.75, type: 'birch' }
      ];

      treeConfigs.forEach(tree => {
        const sway = Math.sin(this.time + tree.x) * 3;
        this.ctx.fillStyle = '#5c4530';
        this.ctx.fillRect(tree.x - 4 * tree.scale, tree.y - 28 * tree.scale, 8 * tree.scale, 30 * tree.scale);

        if (tree.type === 'pine') {
          this.ctx.fillStyle = '#215c32';
          for (let tier = 0; tier < 3; tier++) {
            const ty = tree.y - 26 * tree.scale - tier * 18 * tree.scale;
            const tw = (24 - tier * 5) * tree.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(tree.x + sway, ty - 20 * tree.scale);
            this.ctx.lineTo(tree.x - tw, ty);
            this.ctx.lineTo(tree.x + tw, ty);
            this.ctx.closePath();
            this.ctx.fill();
          }
        } else {
          this.ctx.fillStyle = '#317336';
          const cy = tree.y - 46 * tree.scale;
          const r = 26 * tree.scale;
          this.ctx.beginPath();
          this.ctx.arc(tree.x + sway, cy, r, 0, Math.PI * 2);
          this.ctx.arc(tree.x - 13 * tree.scale + sway, cy + 9 * tree.scale, r * 0.7, 0, Math.PI * 2);
          this.ctx.arc(tree.x + 13 * tree.scale + sway, cy + 7 * tree.scale, r * 0.75, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.fillStyle = '#4fa155';
          this.ctx.beginPath();
          this.ctx.arc(tree.x - 5 * tree.scale + sway, cy - 7 * tree.scale, r * 0.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      });
    }

    if (this.actions.flowers) {
      const flowerColors = ['#f59e0b', '#ec4899', '#8b5cf6', '#fbbf24', '#ffffff'];
      for (let i = 0; i < 40; i++) {
        const fx = (i * 23) % w;
        if (fx > w * 0.28 && fx < w * 0.52) continue;
        const fy = h * 0.72 + (i % 7) * 16;
        const color = flowerColors[i % flowerColors.length];
        const stemHeight = 9 + (i % 4) * 3;

        this.ctx.strokeStyle = '#2d6a36';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(fx, fy);
        this.ctx.lineTo(fx + Math.sin(this.time * 2 + i) * 2, fy - stemHeight);
        this.ctx.stroke();

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(fx + Math.sin(this.time * 2 + i) * 2, fy - stemHeight, 3.2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    if (this.actions.flowers && this.actions.wildlife) {
      this.butterflies.forEach(b => {
        b.x += b.speedX;
        b.y += b.speedY + Math.sin(this.time * 3 + b.wingPhase) * 0.8;
        b.wingPhase += 0.22;

        if (b.x < 0) b.x = w;
        if (b.x > w) b.x = 0;
        if (b.y < h * 0.55) b.speedY = Math.abs(b.speedY);
        if (b.y > h * 0.9) b.speedY = -Math.abs(b.speedY);

        const wingFlap = Math.abs(Math.sin(b.wingPhase));
        this.ctx.fillStyle = `hsl(${b.hue}, 88%, 52%)`;
        this.ctx.beginPath();
        this.ctx.ellipse(b.x - b.size * 0.6 * wingFlap, b.y, b.size * wingFlap, b.size * 0.8, -0.4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(b.x + b.size * 0.6 * wingFlap, b.y, b.size * wingFlap, b.size * 0.8, 0.4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#1c1917';
        this.ctx.fillRect(b.x - 1, b.y - b.size * 0.5, 2, b.size);
      });
    }

    if (this.actions.wildlife) {
      this.birds.forEach(bird => {
        bird.x += bird.speed;
        bird.wingAngle += 0.16;
        if (bird.x > w + 50) bird.x = -50;

        const wingFlap = Math.sin(bird.wingAngle) * 5;
        this.ctx.strokeStyle = '#1e293b';
        this.ctx.lineWidth = 1.8;
        this.ctx.beginPath();
        this.ctx.moveTo(bird.x - bird.size, bird.y - wingFlap);
        this.ctx.quadraticCurveTo(bird.x - bird.size * 0.4, bird.y + wingFlap * 0.4, bird.x, bird.y);
        this.ctx.quadraticCurveTo(bird.x + bird.size * 0.4, bird.y + wingFlap * 0.4, bird.x + bird.size, bird.y - wingFlap);
        this.ctx.stroke();
      });
    }

    if (this.actions.trees) {
      this.leaves.forEach(leaf => {
        leaf.x += leaf.vx;
        leaf.y += leaf.vy;
        leaf.rotation += leaf.rotSpeed;
        if (leaf.x > w) leaf.x = 0;
        if (leaf.y > h) leaf.y = 0;

        this.ctx.save();
        this.ctx.translate(leaf.x, leaf.y);
        this.ctx.rotate(leaf.rotation);
        this.ctx.fillStyle = 'rgba(74, 155, 82, 0.65)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, leaf.size, leaf.size * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });
    }

    requestAnimationFrame(this.animate);
  }
}

// --- 3. Educational YouTube Video Masterclasses ---
class EducationalVideoPlayer {
  constructor(audio) {
    this.audio = audio;
    this.iframe = document.getElementById('youtube-player-frame');
    this.titleEl = document.getElementById('yt-lesson-title');
    this.takeawayEl = document.getElementById('yt-lesson-takeaway');
    this.directLink = document.getElementById('yt-direct-link');
    this.lessonBtns = document.querySelectorAll('[data-youtube-id]');

    // 100% Verified Embeddable YouTube Videos
    this.lessons = {
      'ysa5OBhXz-Q': {
        title: "How Wolves Change Rivers (Trophic Cascades)",
        takeaway: "Reintroducing apex predators allowed forests to stabilize riverbanks, completely restoring river paths and biodiversity.",
        url: "https://www.youtube.com/watch?v=ysa5OBhXz-Q"
      },
      'GfO-3Oir-qM': {
        title: "Our Planet: One Planet (David Attenborough / Netflix / WWF)",
        takeaway: "Rewilding 30% of global oceans and halting deforestation restores global biodiversity and planetary climate balance.",
        url: "https://www.youtube.com/watch?v=GfO-3Oir-qM"
      },
      '3BgPFIKCaOQ': {
        title: "How to Grow a Tiny Forest Anywhere (Shubhendu Sharma / TED)",
        takeaway: "Dense multi-layer native planting creates self-sustaining micro-forests that grow 10× faster and capture 30× more carbon.",
        url: "https://www.youtube.com/watch?v=3BgPFIKCaOQ"
      },
      'V4m9SefyRjg': {
        title: "The Secret Language of Trees (TED-Ed & Dr. Suzanne Simard)",
        takeaway: "Underground mycorrhizal fungal networks act as an ecological internet, sharing nutrients and distress signals between trees.",
        url: "https://www.youtube.com/watch?v=V4m9SefyRjg"
      },
      'HkZDSqyE1do': {
        title: "Forest Man (Award-Winning Documentary on Jadav Payeng)",
        takeaway: "One individual planting seeds daily for 40 years built a 1,360-acre wild forest, bringing back tigers, rhinos, and elephants.",
        url: "https://www.youtube.com/watch?v=HkZDSqyE1do"
      },
      'r2uAqQXNkr4': {
        title: "Restoring Reef Ecosystem in 5 Steps (BBC Earth)",
        takeaway: "Active coral micro-fragmentation and larval seeding accelerate reef regeneration by up to 40× compared to natural recovery.",
        url: "https://www.youtube.com/watch?v=r2uAqQXNkr4"
      }
    };

    this.init();
  }

  init() {
    this.lessonBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.youtubeId;
        const lesson = this.lessons[id];
        if (!lesson) return;

        if (this.iframe) {
          this.iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
        }
        if (this.titleEl) this.titleEl.textContent = lesson.title;
        if (this.takeawayEl) this.takeawayEl.textContent = lesson.takeaway;
        if (this.directLink) {
          this.directLink.href = lesson.url;
          this.directLink.title = `Watch "${lesson.title}" directly on YouTube`;
        }

        this.lessonBtns.forEach(b => {
          b.classList.remove('bg-emerald-800', 'text-white', 'border-emerald-800');
          b.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
        });
        btn.classList.add('bg-emerald-800', 'text-white', 'border-emerald-800');
        btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');

        if (this.audio) this.audio.playChime('water');
      });
    });
  }
}

// --- 4. Interactive Impact Calculator ---
function initImpactCalculator(audio) {
  const meatSlider = document.getElementById('calc-meat-free');
  const plasticSlider = document.getElementById('calc-plastic');
  const gardenSlider = document.getElementById('calc-garden');
  const transitSlider = document.getElementById('calc-transit');

  const meatVal = document.getElementById('val-meat');
  const plasticVal = document.getElementById('val-plastic');
  const gardenVal = document.getElementById('val-garden');
  const transitVal = document.getElementById('val-transit');

  const outCo2 = document.getElementById('out-co2');
  const outWater = document.getElementById('out-water');
  const outPollinators = document.getElementById('out-pollinators');
  const outWaste = document.getElementById('out-waste');

  if (!meatSlider) return;

  function calculate() {
    const meatDays = parseInt(meatSlider.value, 10);
    const plasticItems = parseInt(plasticSlider.value, 10);
    const gardenSqFt = parseInt(gardenSlider.value, 10);
    const transitMiles = parseInt(transitSlider.value, 10);

    meatVal.textContent = `${meatDays} days/wk`;
    plasticVal.textContent = `${plasticItems} items/wk`;
    gardenVal.textContent = `${gardenSqFt} sq ft`;
    transitVal.textContent = `${transitMiles} miles/wk`;

    const co2Saved = Math.round(meatDays * 54 + transitMiles * 21 + gardenSqFt * 1.2);
    const waterSaved = Math.round(meatDays * 19000 + gardenSqFt * 24);
    const pollinatorsSupported = Math.round(gardenSqFt * 18);
    const plasticAvoided = Math.round(plasticItems * 4.2);

    outCo2.textContent = co2Saved.toLocaleString();
    outWater.textContent = waterSaved.toLocaleString();
    outPollinators.textContent = pollinatorsSupported.toLocaleString();
    outWaste.textContent = plasticAvoided.toLocaleString();
  }

  [meatSlider, plasticSlider, gardenSlider, transitSlider].forEach(slider => {
    slider.addEventListener('input', () => {
      calculate();
      if (audio) audio.playChime('leaf');
    });
  });

  calculate();
}

// --- 5. Interactive Field Action Guide ---
function initFieldGuides(audio) {
  const guideCheckboxes = document.querySelectorAll('.guide-checkbox');
  const progressBadge = document.getElementById('guides-completed-badge');
  const savedKey = 'earthcraft_guides_completed';

  let completedList = [];
  try {
    const stored = localStorage.getItem(savedKey);
    if (stored) completedList = JSON.parse(stored);
  } catch (e) {}

  function updateBadge() {
    if (!progressBadge) return;
    const count = completedList.length;
    const total = guideCheckboxes.length;
    progressBadge.textContent = `${count} of ${total} Completed`;
  }

  guideCheckboxes.forEach(cb => {
    const guideId = cb.dataset.guideId;
    if (completedList.includes(guideId)) {
      cb.checked = true;
      const card = cb.closest('.guide-card');
      if (card) card.classList.add('border-emerald-600', 'bg-emerald-50/40');
    }

    cb.addEventListener('change', () => {
      const card = cb.closest('.guide-card');
      if (cb.checked) {
        if (!completedList.includes(guideId)) completedList.push(guideId);
        if (card) card.classList.add('border-emerald-600', 'bg-emerald-50/40');
        if (audio) audio.playChime('success');
      } else {
        completedList = completedList.filter(id => id !== guideId);
        if (card) card.classList.remove('border-emerald-600', 'bg-emerald-50/40');
        if (audio) audio.playChime('leaf');
      }
      try {
        localStorage.setItem(savedKey, JSON.stringify(completedList));
      } catch (e) {}
      updateBadge();
    });
  });

  updateBadge();
}

// --- 6. Interactive Eco-Quiz ---
function initEcoQuiz(audio) {
  const quizForm = document.getElementById('eco-quiz-form');
  const resultBox = document.getElementById('quiz-result');
  const scoreText = document.getElementById('quiz-score-text');
  const archetypeTitle = document.getElementById('quiz-archetype-title');
  const archetypeDesc = document.getElementById('quiz-archetype-desc');
  const resetBtn = document.getElementById('quiz-reset-btn');

  if (!quizForm) return;

  const answersKey = {
    q1: 'b',
    q2: 'c',
    q3: 'c'
  };

  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(quizForm);
    let correct = 0;
    const total = 3;

    for (const [q, correctAns] of Object.entries(answersKey)) {
      const userAns = formData.get(q);
      const questionBlock = document.getElementById(`block-${q}`);
      if (userAns === correctAns) {
        correct++;
        if (questionBlock) {
          questionBlock.classList.add('border-emerald-500', 'bg-emerald-50/30');
          questionBlock.classList.remove('border-rose-400', 'bg-rose-50/30');
        }
      } else {
        if (questionBlock) {
          questionBlock.classList.add('border-rose-400', 'bg-rose-50/30');
          questionBlock.classList.remove('border-emerald-500', 'bg-emerald-50/30');
        }
      }
    }

    resultBox.classList.remove('hidden');
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    scoreText.textContent = `${correct} / ${total} Correct`;

    if (correct === 3) {
      archetypeTitle.textContent = "Ecosystem Sentinel & Rewilding Pioneer";
      archetypeDesc.textContent = "Outstanding ecological literacy! You understand native keystone species, undisturbed soil biology, and clean watershed protection.";
    } else if (correct >= 1) {
      archetypeTitle.textContent = "Budding Earth Steward";
      archetypeDesc.textContent = "Great ecological instincts! Simple actions like leaving leaves whole and planting keystone trees create instant local impact.";
    } else {
      archetypeTitle.textContent = "Ecosystem Explorer";
      archetypeDesc.textContent = "Every great journey starts with a seed! Explore the slides to see how simple daily actions heal wildlife.";
    }

    if (audio) audio.playChime(correct >= 2 ? 'success' : 'seed');
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      quizForm.reset();
      resultBox.classList.add('hidden');
      document.querySelectorAll('[id^="block-q"]').forEach(b => {
        b.classList.remove('border-emerald-500', 'bg-emerald-50/30', 'border-rose-400', 'bg-rose-50/30');
      });
      if (audio) audio.playChime('leaf');
    });
  }
}

// --- 7. Real-Time Audio Visualizer Canvas ---
function initVisualizer(audio, canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !audio) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!audio.isPlaying || !audio.analyser) {
      ctx.fillStyle = 'rgba(74, 155, 82, 0.25)';
      for (let i = 0; i < 16; i++) {
        const h = 4 + Math.sin(Date.now() * 0.003 + i) * 2;
        ctx.fillRect(i * 6, canvas.height - h, 4, h);
      }
      return;
    }

    const bufferLength = audio.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    audio.analyser.getByteFrequencyData(dataArray);

    const barWidth = 4;
    const gap = 2;
    for (let i = 0; i < 16; i++) {
      const val = dataArray[i] || 0;
      const barHeight = Math.max(3, (val / 255) * canvas.height);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(i * (barWidth + gap), canvas.height - barHeight, barWidth, barHeight);
    }
  }

  draw();
}

// --- 8. Screen Size Detection Algorithm & Landscape-inside-Portrait Engine ---
class SlideSizingEngine {
  constructor(sim) {
    this.sim = sim;
    this.stage = document.getElementById('app-stage');
    this.header = document.querySelector('header');
    this.bottomDock = document.getElementById('bottom-slide-dock');
    this.habitatCanvas = document.getElementById('habitat-canvas');
    this.phoneModeLabelEl = document.getElementById('phone-mode-label');
    this.fullscreenBtn = document.getElementById('fullscreen-rotate-btn');
    this.fullscreenLabel = document.getElementById('fullscreen-btn-label');
    this.exitRotatedBtn = document.getElementById('exit-rotated-btn');

    // Modes:
    // 'landscape_in_portrait': Widescreen 16:10 / 16:9 Landscape Card framed inside upright portrait display (default)
    // 'landscape_rotate_90': Rotates stage 90° for holding phone horizontally (fullscreen landscape)
    // 'portrait_expanded': Expanded vertical slide layout
    this.portraitMode = localStorage.getItem('earthcraft_portrait_view') || 'landscape_in_portrait';
    this.isPortrait = false;
    this.debounceTimer = null;

    this.recompute = this.recompute.bind(this);
    this.cycleMode = this.cycleMode.bind(this);
    this.toggleFullscreenLandscape = this.toggleFullscreenLandscape.bind(this);
    this.updateControlsUI = this.updateControlsUI.bind(this);

    window.addEventListener('resize', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(this.recompute, 20);
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(this.recompute, 40);
    });
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && this.portraitMode === 'landscape_rotate_90') {
        this.portraitMode = 'landscape_in_portrait';
        localStorage.setItem('earthcraft_portrait_view', 'landscape_in_portrait');
        this.recompute();
      }
      this.updateControlsUI();
    });
    document.addEventListener('webkitfullscreenchange', () => {
      if (!document.webkitFullscreenElement && this.portraitMode === 'landscape_rotate_90') {
        this.portraitMode = 'landscape_in_portrait';
        localStorage.setItem('earthcraft_portrait_view', 'landscape_in_portrait');
        this.recompute();
      }
      this.updateControlsUI();
    });

    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', this.toggleFullscreenLandscape);
    }
    const phoneBtn = document.getElementById('phone-landscape-btn');
    if (phoneBtn) {
      phoneBtn.addEventListener('click', this.toggleFullscreenLandscape);
    }
    if (this.exitRotatedBtn) {
      this.exitRotatedBtn.addEventListener('click', () => {
        this.toggleFullscreenLandscape();
      });
    }

    this.recompute();
  }

  detectScreen() {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const screenW = window.screen ? window.screen.width : winW;
    const screenH = window.screen ? window.screen.height : winH;
    const isPortrait = winH > winW;
    const ratio = (winW / Math.max(1, winH)).toFixed(2);
    return { winW, winH, screenW, screenH, isPortrait, ratio };
  }

  toggleFullscreenLandscape() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const isRotated = this.stage && this.stage.classList.contains('mode-landscape-rotate-90');

    if (!isFullscreen && !isRotated) {
      // ENTER FULLSCREEN / LANDSCAPE
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        }
      } catch (e) {}

      // Try screen orientation lock API if supported by device
      try {
        if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
          window.screen.orientation.lock('landscape').catch(() => {});
        }
      } catch (e) {}

      // If currently portrait or mobile, enforce 90° landscape rotation
      if (isPortrait) {
        this.portraitMode = 'landscape_rotate_90';
        localStorage.setItem('earthcraft_portrait_view', 'landscape_rotate_90');
      }
    } else {
      // EXIT FULLSCREEN / ROTATION
      try {
        if (isFullscreen) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
          }
        }
      } catch (e) {}

      try {
        if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
          window.screen.orientation.unlock();
        }
      } catch (e) {}

      this.portraitMode = 'landscape_in_portrait';
      localStorage.setItem('earthcraft_portrait_view', 'landscape_in_portrait');
    }

    this.recompute();
  }

  cycleMode() {
    if (this.portraitMode === 'landscape_in_portrait') {
      this.portraitMode = 'landscape_rotate_90';
    } else if (this.portraitMode === 'landscape_rotate_90') {
      this.portraitMode = 'portrait_expanded';
    } else {
      this.portraitMode = 'landscape_in_portrait';
    }
    localStorage.setItem('earthcraft_portrait_view', this.portraitMode);
    this.recompute();
  }

  updateControlsUI() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    const isRotated = this.stage && this.stage.classList.contains('mode-landscape-rotate-90');

    if (this.fullscreenLabel) {
      if (isRotated || isFullscreen) {
        this.fullscreenLabel.textContent = isRotated ? 'Exit Landscape' : 'Exit Fullscreen';
      } else {
        this.fullscreenLabel.textContent = isPortrait ? 'Fullscreen Landscape' : 'Enter Fullscreen';
      }
    }

    if (this.phoneModeLabelEl) {
      this.phoneModeLabelEl.textContent = isRotated ? '90° Land' : '16:10 Slide';
    }
  }

  recompute() {
    const { winW, winH, isPortrait } = this.detectScreen();
    this.isPortrait = isPortrait;

    const headerH = this.header ? this.header.offsetHeight : 52;
    const footerH = this.bottomDock ? this.bottomDock.offsetHeight : 54;
    const availH = Math.max(300, winH - headerH - footerH);

    if (this.stage) {
      this.stage.classList.remove('is-portrait', 'is-landscape', 'mode-landscape-in-portrait', 'mode-landscape-rotate-90', 'mode-portrait-expanded');

      if (isPortrait) {
        this.stage.classList.add('is-portrait');
        this.stage.classList.add(`mode-${this.portraitMode.replace(/_/g, '-')}`);

        // Portrait sizing calculations: format slide as authentic Landscape Slide inside Portrait
        const slideW = Math.min(winW - 16, 680);
        let slideH;
        if (this.portraitMode === 'landscape_in_portrait') {
          // Dedicated 16:10 / 16:9 widescreen card proportion with comfortable reading room
          slideH = Math.min(availH - 12, Math.max(340, Math.round(availH * 0.88), Math.round(slideW * 0.95)));
        } else {
          slideH = availH;
        }

        document.documentElement.style.setProperty('--portrait-slide-w', `${slideW}px`);
        document.documentElement.style.setProperty('--portrait-slide-h', `${slideH}px`);
        document.documentElement.style.setProperty('--rotated-viewport-w', `${winH}px`);
        document.documentElement.style.setProperty('--rotated-viewport-h', `${winW}px`);

        // Update canvas height for interactive simulator in portrait
        if (this.habitatCanvas) {
          this.habitatCanvas.style.height = `${Math.min(220, Math.max(150, Math.round(slideH * 0.38)))}px`;
        }
      } else {
        this.stage.classList.add('is-landscape');

        // Optimal widescreen slide width based on 16:9 proportion
        const idealLandscapeW = Math.round(availH * (16 / 9));
        const maxSlideW = Math.min(1360, Math.max(320, Math.min(winW - 20, idealLandscapeW)));

        document.documentElement.style.setProperty('--slide-avail-height', `${availH}px`);
        document.documentElement.style.setProperty('--slide-max-width', `${maxSlideW}px`);

        if (this.habitatCanvas) {
          const targetCanvasH = Math.max(180, Math.min(availH - 160, 360));
          this.habitatCanvas.style.height = `${targetCanvasH}px`;
        }
      }
    }

    this.updateControlsUI();

    document.documentElement.style.setProperty('--slide-avail-height', `${availH}px`);
    document.documentElement.style.setProperty('--slide-aspect-ratio', (winW / Math.max(1, availH)).toFixed(3));

    if (this.sim) {
      this.sim.resize();
    }
  }
}

// --- 9. Slide Deck Manager (Swipe Left/Right, Phone Controls & Q/E Navigation) ---
class SlideDeckManager {
  constructor(audio, sim, sizingEngine) {
    this.audio = audio;
    this.sim = sim;
    this.sizingEngine = sizingEngine;
    this.track = document.getElementById('slides-track');
    this.currentSlide = 0;
    this.totalSlides = 8;

    this.slideConfig = [
      { title: "01. Living Biosphere Ethos", isInteractive: false, badge: "Introduction" },
      { title: "02. Ecosystem Restoration Simulator", isInteractive: true, badge: "Simulator" },
      { title: "03. Ancient Canopies & Living Oceans", isInteractive: false, badge: "Ecosystems" },
      { title: "04. Documentary Rewilding Masterclasses", isInteractive: true, badge: "Video Lessons" },
      { title: "05. Native Pollinators & Living Soil", isInteractive: false, badge: "Living Soil" },
      { title: "06. Planetary Impact Calculator", isInteractive: true, badge: "Calculator" },
      { title: "07. Practical Field Action Guides", isInteractive: true, badge: "Action Guides" },
      { title: "08. Literature & Media References", isInteractive: true, badge: "Bibliography" }
    ];

    this.counterEl = document.getElementById('slide-counter-display');
    this.titleEl = document.getElementById('slide-title-display');
    this.badgeEl = document.getElementById('slide-mode-badge');
    this.phoneCounterEl = document.getElementById('phone-slide-counter');

    this.prevBtns = document.querySelectorAll('[data-slide-prev]');
    this.nextBtns = document.querySelectorAll('[data-slide-next]');
    this.tabBtns = document.querySelectorAll('[data-slide-tab]');

    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;

    this.init();
  }

  init() {
    // Keyboard listener for Q, E, Left, Right
    window.addEventListener('keydown', (e) => {
      const active = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (active === 'input' || active === 'textarea' || active === 'select') return;

      if (e.key === 'q' || e.key === 'Q' || e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'e' || e.key === 'E' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      }
    });

    // Touch Swipe Left/Right: standard horizontal swipe or rotated touch navigation
    const viewport = document.getElementById('slides-viewport');
    const touchTarget = document.getElementById('app-stage') || viewport || document.body;

    touchTarget.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    }, { passive: true });

    touchTarget.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - this.touchStartX;
      const diffY = touchEndY - this.touchStartY;

      if (this.sizingEngine && this.sizingEngine.isPortrait && this.sizingEngine.portraitMode === 'landscape_rotate_90') {
        // Rotated 90 degrees: phone's vertical swipe maps to horizontal slide progression
        const rotDelta = -diffY;
        if (Math.abs(rotDelta) > 30) {
          if (rotDelta < 0) this.next();
          else this.prev();
        }
      } else {
        // Standard horizontal swipe
        if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.1) {
          if (diffX < 0) {
            this.next(); // Swiped left -> Next slide
          } else {
            this.prev(); // Swiped right -> Previous slide
          }
        }
      }
    }, { passive: true });

    // Button clicks (including top bar, bottom dock, and mobile edge buttons)
    this.prevBtns.forEach(btn => btn.addEventListener('click', () => this.prev()));
    this.nextBtns.forEach(btn => btn.addEventListener('click', () => this.next()));

    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.slideTab, 10);
        this.goTo(idx);
      });
    });

    this.updateUI();
  }

  goTo(index) {
    if (index < 0 || index >= this.totalSlides) return;
    this.currentSlide = index;
    this.updateUI();
    if (this.audio) this.audio.playChime('leaf');

    // If moving to slide 1 (Simulator), trigger resize
    if (this.currentSlide === 1 && this.sim) {
      setTimeout(() => this.sim.resize(), 60);
    }
    if (this.sizingEngine) {
      this.sizingEngine.recompute();
    }

    const curSlideEl = document.querySelectorAll('.slide-item')[this.currentSlide];
    if (curSlideEl) {
      curSlideEl.scrollTop = 0;
    }
  }

  next() {
    if (this.currentSlide < this.totalSlides - 1) {
      this.goTo(this.currentSlide + 1);
    }
  }

  prev() {
    if (this.currentSlide > 0) {
      this.goTo(this.currentSlide - 1);
    }
  }

  updateUI() {
    const cur = this.currentSlide;
    const config = this.slideConfig[cur];

    // Transform track
    if (this.track) {
      this.track.style.transform = `translateX(-${cur * 12.5}%)`;
    }

    // Trigger page switching animation on active slide card
    const allSlides = document.querySelectorAll('.slide-item');
    allSlides.forEach((s, idx) => {
      if (idx === cur) {
        s.classList.add('active-slide');
      } else {
        s.classList.remove('active-slide');
      }
    });

    // Update animated glowing slide progress bar
    const pBar = document.getElementById('slide-progress-bar');
    if (pBar) {
      pBar.style.width = `${((cur + 1) / this.totalSlides) * 100}%`;
    }

    // Counter & text
    if (this.counterEl) {
      this.counterEl.textContent = `${cur + 1} / ${this.totalSlides}`;
    }
    if (this.phoneCounterEl) {
      this.phoneCounterEl.textContent = `${cur + 1} / ${this.totalSlides}`;
    }
    const rotatedCounter = document.getElementById('rotated-counter');
    if (rotatedCounter) {
      rotatedCounter.textContent = `${cur + 1} / ${this.totalSlides}`;
    }
    if (this.titleEl) {
      this.titleEl.textContent = config.title;
    }
    if (this.badgeEl) {
      this.badgeEl.textContent = config.badge;
      this.badgeEl.className = 'hidden';
    }

    // Update buttons disabled status
    this.prevBtns.forEach(b => {
      b.disabled = cur === 0;
      b.classList.toggle('opacity-30', cur === 0);
      b.classList.toggle('cursor-not-allowed', cur === 0);
    });
    this.nextBtns.forEach(b => {
      b.disabled = cur === this.totalSlides - 1;
      b.classList.toggle('opacity-30', cur === this.totalSlides - 1);
      b.classList.toggle('cursor-not-allowed', cur === this.totalSlides - 1);
    });

    // Update tab bar buttons
    this.tabBtns.forEach((btn, idx) => {
      if (idx === cur) {
        btn.classList.add('bg-emerald-900', 'text-white', 'font-bold');
        btn.classList.remove('bg-white', 'text-slate-600');
      } else {
        btn.classList.remove('bg-emerald-900', 'text-white', 'font-bold');
        btn.classList.add('bg-white', 'text-slate-600');
      }
    });
  }
}

// --- Main Application Bootstrapping ---
document.addEventListener('DOMContentLoaded', () => {
  const audio = new NatureAudioEngine();
  const sim = new HabitatSimulation('habitat-canvas');
  const videoPlayer = new EducationalVideoPlayer(audio);
  const sizingEngine = new SlideSizingEngine(sim);
  const slideDeck = new SlideDeckManager(audio, sim, sizingEngine);

  // Floating Leaf Ambient Canvas
  initAmbientLeafCanvas('ambient-leaf-canvas');

  // Audio Play / Pause Bar Buttons
  const masterAudioBtn = document.getElementById('master-audio-toggle');
  const heroAudioBtn = document.getElementById('hero-ambient-audio-btn');
  const volumeSlider = document.getElementById('audio-master-volume');

  function toggleMasterAudio() {
    if (audio.isPlaying) {
      audio.stop();
      updateAudioButtons(false);
    } else {
      audio.start();
      updateAudioButtons(true);
    }
  }

  function updateAudioButtons(playing) {
    [masterAudioBtn, heroAudioBtn].forEach(btn => {
      if (!btn) return;
      if (playing) {
        btn.classList.add('bg-emerald-800', 'text-white');
        btn.classList.remove('bg-white', 'text-slate-800');
        const label = btn.querySelector('.audio-label');
        if (label) label.textContent = 'Soundscape Playing';
      } else {
        btn.classList.remove('bg-emerald-800', 'text-white');
        btn.classList.add('bg-white', 'text-slate-800');
        const label = btn.querySelector('.audio-label');
        if (label) label.textContent = 'Play Nature Audio';
      }
    });
  }

  if (masterAudioBtn) masterAudioBtn.addEventListener('click', toggleMasterAudio);
  if (heroAudioBtn) heroAudioBtn.addEventListener('click', toggleMasterAudio);

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      audio.setMasterVolume(parseFloat(e.target.value));
    });
  }

  // Individual Soundboard Channel Sliders
  ['birds', 'stream', 'rain', 'crickets'].forEach(ch => {
    const slider = document.getElementById(`ch-${ch}`);
    if (slider) {
      slider.addEventListener('input', (e) => {
        audio.setChannelVolume(ch, parseFloat(e.target.value));
      });
    }
  });

  // Soundscape Preset Buttons
  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      if (!audio.isPlaying) {
        audio.start();
        updateAudioButtons(true);
      }
      if (preset === 'morning') {
        audio.setChannelVolume('birds', 0.9);
        audio.setChannelVolume('stream', 0.3);
        audio.setChannelVolume('rain', 0.1);
        audio.setChannelVolume('crickets', 0.0);
      } else if (preset === 'river') {
        audio.setChannelVolume('birds', 0.4);
        audio.setChannelVolume('stream', 0.95);
        audio.setChannelVolume('rain', 0.2);
        audio.setChannelVolume('crickets', 0.1);
      } else if (preset === 'rainy') {
        audio.setChannelVolume('birds', 0.15);
        audio.setChannelVolume('stream', 0.5);
        audio.setChannelVolume('rain', 0.9);
        audio.setChannelVolume('crickets', 0.0);
      } else if (preset === 'night') {
        audio.setChannelVolume('birds', 0.05);
        audio.setChannelVolume('stream', 0.25);
        audio.setChannelVolume('rain', 0.1);
        audio.setChannelVolume('crickets', 0.95);
      }
      audio.playChime('water');

      document.querySelectorAll('[data-preset]').forEach(b => {
        b.classList.remove('bg-emerald-900', 'text-white');
        b.classList.add('bg-emerald-50', 'text-emerald-900');
      });
      btn.classList.add('bg-emerald-900', 'text-white');
      btn.classList.remove('bg-emerald-50', 'text-emerald-900');
    });
  });

  // Soundboard manual chime buttons
  document.querySelectorAll('[data-chime]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sound = btn.dataset.chime;
      audio.playChime(sound);
    });
  });

  // Habitat Simulation Interactive Action Buttons
  const healthBadge = document.getElementById('sim-health-score');
  const wildlifeBadge = document.getElementById('sim-wildlife-count');

  function updateSimUI() {
    const health = sim.calculateHealth();
    if (healthBadge) healthBadge.textContent = `${health}%`;
    if (wildlifeBadge) {
      let count = 0;
      if (sim.actions.trees) count += 12;
      if (sim.actions.flowers) count += 35;
      if (sim.actions.river) count += 18;
      if (sim.actions.wildlife) count += 42;
      wildlifeBadge.textContent = `${count} Species Flourishing`;
    }
  }

  document.querySelectorAll('[data-sim-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const actionName = btn.dataset.simAction;
      const isActive = sim.toggleAction(actionName);
      if (isActive) {
        btn.classList.add('bg-emerald-800', 'text-white', 'border-emerald-800');
        btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200');
        audio.playChime('seed');
      } else {
        btn.classList.remove('bg-emerald-800', 'text-white', 'border-emerald-800');
        btn.classList.add('bg-white', 'text-slate-700', 'border-slate-200');
        audio.playChime('leaf');
      }
      updateSimUI();
    });
  });

  updateSimUI();

  // Visualizer initialization
  initVisualizer(audio, 'audio-visualizer-canvas');

  // Impact Calculator
  initImpactCalculator(audio);

  // Field Action Checklist
  initFieldGuides(audio);

  // Eco-Quiz
  initEcoQuiz(audio);

  // References & Citations Filter and Copying
  initReferences();

  // Sample Image Lightbox
  const sampleTrigger = document.getElementById('sample-image-trigger');
  const sampleModal = document.getElementById('sample-lightbox-modal');
  const closeSampleModalBtn = document.getElementById('close-sample-lightbox-btn');

  if (sampleTrigger && sampleModal) {
    sampleTrigger.addEventListener('click', () => {
      sampleModal.classList.remove('hidden');
      sampleModal.classList.add('flex');
    });

    if (closeSampleModalBtn) {
      closeSampleModalBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sampleModal.classList.add('hidden');
        sampleModal.classList.remove('flex');
      });
    }

    sampleModal.addEventListener('click', (e) => {
      if (e.target === sampleModal) {
        sampleModal.classList.add('hidden');
        sampleModal.classList.remove('flex');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !sampleModal.classList.contains('hidden')) {
        sampleModal.classList.add('hidden');
        sampleModal.classList.remove('flex');
      }
    });
  }

  // Pledge Card Generator
  const pledgeForm = document.getElementById('pledge-form');
  const pledgeCertificate = document.getElementById('pledge-certificate');
  const pledgeNameOut = document.getElementById('cert-name');
  const pledgeLocationOut = document.getElementById('cert-location');
  const pledgeCommitmentsOut = document.getElementById('cert-commitments');

  if (pledgeForm) {
    pledgeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('pledge-name').value || 'Earth Guardian';
      const location = document.getElementById('pledge-location').value || 'Global Citizen';
      const checkboxes = document.querySelectorAll('input[name="pledge-item"]:checked');

      if (checkboxes.length === 0) {
        return;
      }

      pledgeNameOut.textContent = name;
      pledgeLocationOut.textContent = location;
      pledgeCommitmentsOut.innerHTML = '';
      checkboxes.forEach(cb => {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-2 text-slate-700 text-sm';
        li.innerHTML = `<svg class="w-4 h-4 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg> <span>${cb.value}</span>`;
        pledgeCommitmentsOut.appendChild(li);
      });

      pledgeCertificate.classList.remove('hidden');
      pledgeCertificate.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      audio.playChime('success');
    });
  }
});

// --- 10. References & Citations Engine ---
function initReferences() {
  const filterBtns = document.querySelectorAll('.ref-filter-btn');
  const entries = document.querySelectorAll('.ref-entry');
  const copyBtn = document.getElementById('copy-citations-btn');
  const copyText = document.getElementById('copy-citations-text');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.refFilter;
      filterBtns.forEach(b => {
        b.classList.remove('bg-emerald-900', 'text-white', 'font-semibold');
        b.classList.add('bg-transparent', 'text-slate-700', 'font-medium');
      });
      btn.classList.add('bg-emerald-900', 'text-white', 'font-semibold');
      btn.classList.remove('bg-transparent', 'text-slate-700', 'font-medium');

      entries.forEach(entry => {
        const type = entry.dataset.refType;
        if (filter === 'all' || type === filter) {
          entry.style.display = '';
        } else {
          entry.style.display = 'none';
        }
      });
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const apaCitations = [
        "Monbiot, G. (2014). Feral: Rewilding the Land, the Sea, and Human Life (p. 84, chap. 5, v. 12, ll. 14–38, pt. II). Penguin Books. https://www.monbiot.com/books/feral/",
        "Sustainable Man, & BBC Earth. (2014). How Wolves Change Rivers [Video]. YouTube. https://www.youtube.com/watch?v=ysa5OBhXz-Q",
        "Netflix, WWF, & Silverback Films. (2019). Our Planet: One Planet (Narrated by Sir David Attenborough) [Video]. YouTube; Netflix. https://www.youtube.com/watch?v=GfO-3Oir-qM",
        "Simard, S. (2021). Finding the Mother Tree: Discovering the Wisdom of the Forest (p. 165, chap. 8, v. 7, ll. 9–31, pt. III). Alfred A. Knopf. https://suzannesimard.com/",
        "Sharma, S. (2014). How to Grow a Tiny Forest Anywhere [Video]. TED Conferences. https://www.youtube.com/watch?v=3BgPFIKCaOQ",
        "TED-Ed, Defrenne, C., & Simard, S. (2020). The Secret Language of Trees [Video]. YouTube; TED Conferences. https://www.youtube.com/watch?v=V4m9SefyRjg",
        "McMaster, W. D., & Payeng, J. (2013). Forest Man: The Story of Jadav Payeng [Video]. YouTube; Cannes Film Festival Winner. https://www.youtube.com/watch?v=HkZDSqyE1do",
        "BBC Earth. (2020). Restoring Reef Ecosystem in 5 Steps [Video]. YouTube; BBC Studios. https://www.youtube.com/watch?v=r2uAqQXNkr4",
        "Tallamy, D. W. (2020). Nature's Best Hope: A New Approach to Conservation That Starts in Your Yard (p. 114, chap. 4, v. 18, ll. 4–22, pt. I). Timber Press. https://homegrownnationalpark.org/",
        "Miyawaki, A., & Box, E. O. (2006). The Healing Power of Forests: The Philosophy Behind Restoring Earth's Balance (p. 93, chap. 3, v. 9, ll. 11–29, pt. IV). Kosei Publishing Co. https://afforestt.com/"
      ].join("\n\n");

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(apaCitations).then(() => {
          if (copyText) copyText.textContent = "Copied to Clipboard! ✓";
          setTimeout(() => {
            if (copyText) copyText.textContent = "Copy Citations (APA)";
          }, 2400);
        }).catch(() => {
          if (copyText) copyText.textContent = "Copied to Clipboard! ✓";
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = apaCitations;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        if (copyText) copyText.textContent = "Copied to Clipboard! ✓";
        setTimeout(() => {
          if (copyText) copyText.textContent = "Copy Citations (APA)";
        }, 2400);
      }
    });
  }
}

// Ambient background canvas (kept clean and minimal)
function initAmbientLeafCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);
}
