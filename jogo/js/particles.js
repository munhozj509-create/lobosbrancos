/**
 * SISTEMA DE PARTÍCULAS, TEXTOS FLUTUANTES & EFEITOS VISUAIS
 * Proporciona alto impacto visual: respingos de gosma preta, faíscas cibernéticas,
 * anéis de choque do Braço Biônico e textos de combo.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];
  }

  // Respingos de Gosma Negra
  createSlimeSplatter(x, y, count = 12, color = '#0f0c1b', radius = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        gravity: 0.18,
        friction: 0.96,
        size: radius + Math.random() * 3,
        color: Math.random() > 0.4 ? '#100c1e' : (Math.random() > 0.5 ? '#240046' : '#5a189a'),
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02,
        type: 'slime'
      });
    }
  }

  // Faíscas elétricas / cibernéticas do Braço Biônico
  createSparks(x, y, count = 10, color = '#00f0ff') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.1,
        friction: 0.94,
        size: 1.5 + Math.random() * 2,
        color: Math.random() > 0.3 ? color : '#ffffff',
        alpha: 1,
        decay: 0.03 + Math.random() * 0.03,
        type: 'spark'
      });
    }
  }

  // Poeira de salto e aterrissagem
  createDust(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 16 - 8),
        y: y,
        vx: (Math.random() * 2 - 1) * 1.5,
        vy: -Math.random() * 1.2,
        gravity: -0.01,
        friction: 0.92,
        size: 3 + Math.random() * 3,
        color: '#64748b',
        alpha: 0.6,
        decay: 0.03,
        type: 'dust'
      });
    }
  }

  // Rastro neon de Dash
  createDashGhost(x, y, facing, state) {
    this.particles.push({
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      gravity: 0,
      friction: 1,
      size: 1,
      facing: facing,
      color: '#00f0ff',
      alpha: 0.5,
      decay: 0.08,
      type: 'ghost'
    });
  }

  // Anel de Onda de Choque (EMP Slam do braço)
  createShockwave(x, y, maxRadius = 140, color = '#00f0ff') {
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 10,
      maxRadius: maxRadius,
      color: color,
      lineWidth: 8,
      alpha: 1,
      speed: 7
    });
  }

  // Texto Flutuante de Dano / Pontos
  addFloatingText(text, x, y, color = '#00f0ff', size = 12) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.2,
      color: color,
      alpha: 1,
      size: size,
      decay: 0.02
    });
  }

  update() {
    // Atualiza partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.friction;
      p.vy *= p.friction;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Atualiza ondas de choque
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha = 1 - (sw.radius / sw.maxRadius);
      sw.lineWidth = Math.max(1, 8 * (1 - sw.radius / sw.maxRadius));

      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Atualiza textos flutuantes
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= ft.decay;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx) {
    // 1. Renderiza ondas de choque
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.ellipse(sw.x, sw.y, sw.radius, sw.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Renderiza partículas
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'slime') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#4a0e4e';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ghost') {
        // Rastro estilizado do lobo
        ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.fillRect(p.x - 14, p.y - 28, 28, 28);
      }
      ctx.restore();
    }

    // 3. Renderiza textos flutuantes
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `bold ${ft.size}px 'Orbitron', monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}

// Instância global única
const particles = new ParticleSystem();
