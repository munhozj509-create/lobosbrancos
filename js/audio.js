/**
 * LOBO DE MÁSCARA BRANCA - SISTEMA DE ÁUDIO & MÚSICA SINTETIZADA
 * Utiliza a Web Audio API nativa para criar efeitos sonoros de ação
 * e trilhas dinâmicas de synthwave sem necessidade de arquivos externos!
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;

    // Estado da música
    this.isPlayingMusic = false;
    this.currentTrack = null;
    this.musicTimer = null;
    this.bpm = 128;
    this.step = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn("Web Audio API não pôde ser iniciada:", e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleAudio() {
    this.enabled = !this.enabled;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.7 : 0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  // Disparo de Plasma do Braço Biônico (Tiro de Longo Alcance)
  playBlaster() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.14);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Som de desbloqueio do portal quando todas as gosmas morrem
  playPortalUnlock() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const notes = [329.63, 440.00, 554.37, 659.25, 880.00]; // Mi, Lá, Dó#, Mi, Lá
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);

      gain.gain.setValueAtTime(0.35, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.42);
    });
  }

  // ==========================================
  // EFEITOS SONOROS (SFX)
  // ==========================================

  playJump() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.15);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  playDoubleJump() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.18);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  playPunch(comboStep = 1) {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Componente metálico (braço biônico)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const baseFreq = 220 + comboStep * 60;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    // Componente de ruído (impacto do soco de alta frequência)
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
    noise.start(t);
  }

  playRocketLaunch() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.22);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playRocketHit() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Impacto pesado
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playDash() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Cyber thruster whoosh
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filtro passa-banda
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.12);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  playSlam() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Terremoto / Impacto Sísmico sub-bass
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.45);
    subGain.gain.setValueAtTime(0.9, t);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + 0.5);
  }

  playSlimeSquish() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.14);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playSlimeShoot() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(140, t + 0.1);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playHurt() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.18);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playDeath() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.8);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.8);
  }

  playPortal() {
    if (!this.enabled) return;
    this.ensureContext();
    const t = this.ctx.currentTime;

    // Resonância mágica futurista
    const notes = [261.6, 329.6, 392.0, 523.2, 659.2];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.3, t + idx * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.6);
    });
  }

  // ==========================================
  // TRILHA SONORA DINÂMICA (SINTETIZADOR CHIPTUNE / DARK SYNTH)
  // ==========================================

  startMusic(trackType = 'normal') {
    if (!this.enabled) return;
    this.ensureContext();
    this.stopMusic();

    this.isPlayingMusic = true;
    this.currentTrack = trackType;
    this.step = 0;
    this.bpm = trackType === 'boss' ? 140 : 124;

    const stepDuration = 60 / this.bpm / 4; // semicolcheia (16th note)

    // Escalas musicais (D menor natural para atmosfera cyberpunk/noir)
    // D, E, F, G, A, Bb, C
    const basslineNormal = [
      73.42, 0, 73.42, 0,  73.42, 0, 87.31, 0, // D2, F2
      65.41, 0, 65.41, 0,  98.00, 0, 87.31, 0, // C2, G2, F2
      58.27, 0, 58.27, 0,  58.27, 0, 65.41, 0, // Bb1, C2
      73.42, 0, 110.0, 0,  98.00, 0, 87.31, 73.42 // D2, A2, G2, F2, D2
    ];

    const leadNormal = [
      293.66, 0, 349.23, 0, 440.00, 0, 392.00, 0,
      349.23, 0, 293.66, 0, 261.63, 0, 293.66, 0,
      440.00, 0, 523.25, 0, 440.00, 0, 392.00, 0,
      349.23, 392.00, 440.00, 0, 293.66, 0, 0, 0
    ];

    const basslineBoss = [
      73.42, 73.42, 146.83, 73.42,  87.31, 73.42, 146.83, 73.42,
      65.41, 65.41, 130.81, 65.41,  98.00, 65.41, 87.31, 73.42,
      58.27, 58.27, 116.54, 58.27,  65.41, 65.41, 130.81, 65.41,
      73.42, 110.0, 146.83, 110.0,  98.00, 87.31, 73.42, 65.41
    ];

    const leadBoss = [
      587.33, 0, 587.33, 523.25,  698.46, 0, 659.25, 0,
      587.33, 0, 440.00, 0,       523.25, 0, 440.00, 0,
      698.46, 0, 783.99, 0,       880.00, 0, 783.99, 0,
      698.46, 659.25, 587.33, 0,  523.25, 0, 587.33, 0
    ];

    const scheduleNotes = () => {
      if (!this.isPlayingMusic) return;

      const now = this.ctx.currentTime;
      const isBoss = this.currentTrack === 'boss';
      const bassSeq = isBoss ? basslineBoss : basslineNormal;
      const leadSeq = isBoss ? leadBoss : leadNormal;

      const currentStep = this.step % bassSeq.length;

      // 1. Bassline synth
      const bassFreq = bassSeq[currentStep];
      if (bassFreq > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = isBoss ? 'sawtooth' : 'triangle';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.35, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 1.5);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(now);
        bassOsc.stop(now + stepDuration * 1.6);
      }

      // 2. Lead melody synth (a cada 2 steps ou com variação)
      const leadFreq = leadSeq[currentStep];
      if (leadFreq > 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        leadGain.gain.setValueAtTime(0.18, now);
        leadGain.gain.exponentialRampToValueAtTime(0.005, now + stepDuration * 2);

        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGain);
        leadOsc.start(now);
        leadOsc.stop(now + stepDuration * 2);
      }

      // 3. Percussão sintetizada (Bumbo no 0, 4, 8, 12 e Caixa no 4, 12)
      const beat16 = this.step % 16;
      if (beat16 % 4 === 0) {
        // Kick
        const kick = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kick.frequency.setValueAtTime(120, now);
        kick.frequency.exponentialRampToValueAtTime(35, now + 0.1);
        kickGain.gain.setValueAtTime(0.5, now);
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        kick.connect(kickGain);
        kickGain.connect(this.musicGain);
        kick.start(now);
        kick.stop(now + 0.1);
      }

      if (beat16 === 4 || beat16 === 12) {
        // Snare / Hihat accent
        const snareNoise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
        const data = snareNoise.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
        }
        const snare = this.ctx.createBufferSource();
        snare.buffer = snareNoise;
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(isBoss ? 0.35 : 0.22, now);
        sGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        snare.connect(sGain);
        sGain.connect(this.musicGain);
        snare.start(now);
      }

      this.step++;
      this.musicTimer = setTimeout(scheduleNotes, stepDuration * 1000);
    };

    scheduleNotes();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

// Instância global única
const audio = new SoundSystem();
