/**
 * INIMIGOS: AS GOSMAS PRETAS (GELÉIAS DO VAZIO & CORRUPÇÃO)
 * Diversos tipos com comportamentos evolutivos, física gelatinosa (squish & stretch)
 * e o Grande Chefe da Fase 8: O Soberano Abissal.
 */

// Classe Base para Gosmas Pretas
class BaseSlime {
  constructor(x, y, width, height, hp) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hp = hp;
    this.maxHp = hp;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0.38;
    this.isGrounded = false;
    this.facing = 1;
    this.alive = true;
    this.animTimer = Math.random() * 10;
    this.squishX = 1;
    this.squishY = 1;
    this.hitFlash = 0;
  }

  takeDamage(amount, knockbackX = 0, knockbackY = -3) {
    if (!this.alive) return;
    this.hp -= amount;
    this.hitFlash = 10;
    this.vx += knockbackX;
    this.vy += knockbackY;

    audio.playSlimeSquish();
    particles.createSlimeSplatter(this.x + this.width / 2, this.y + this.height / 2, 8, '#0a0a10');
    particles.addFloatingText(`${amount}`, this.x + this.width / 2, this.y - 12, '#ff0055', 12);

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    audio.playSlimeSquish();
    particles.createSlimeSplatter(this.x + this.width / 2, this.y + this.height / 2, 18, '#0a0a10');
    particles.addFloatingText('+100', this.x + this.width / 2, this.y - 10, '#00f0ff', 14);

    if (window.game && window.game.player) {
      window.game.player.slimesKilled++;
      window.game.player.score += 100;
      window.game.updateHud();
    }
  }

  applyPhysics(level) {
    // Gravidade
    if (!this.isGrounded) {
      this.vy += this.gravity;
      if (this.vy > 10) this.vy = 10;
    }

    // Movimento X
    this.x += this.vx;
    let colX = level.checkTileCollision(this.x, this.y, this.width, this.height);
    if (colX) {
      if (this.vx > 0) this.x = colX.tileX * level.tileSize - this.width;
      else if (this.vx < 0) this.x = (colX.tileX + 1) * level.tileSize;
      this.vx = -this.vx * 0.5;
      this.facing = -this.facing;
    }
    this.vx *= 0.85;

    // Movimento Y
    this.y += this.vy;
    this.isGrounded = false;
    let colY = level.checkTileCollision(this.x, this.y, this.width, this.height);
    if (colY) {
      if (this.vy > 0) {
        this.y = colY.tileY * level.tileSize - this.height;
        this.isGrounded = true;
      } else if (this.vy < 0) {
        this.y = (colY.tileY + 1) * level.tileSize;
      }
      this.vy = 0;
    }

    if (this.hitFlash > 0) this.hitFlash--;
  }

  checkPlayerCollision(player) {
    if (!this.alive) return;
    // Colisão AABB
    if (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    ) {
      // Causa dano no lobo
      const knockDir = player.x < this.x ? -5 : 5;
      player.takeDamage(15, knockDir, -3.5);
    }
  }
}

// ============================================================================
// 1. GOSMA RASTEJANTE BÁSICA (CRAWLER SLIME)
// ============================================================================
class CrawlerSlime extends BaseSlime {
  constructor(x, y) {
    super(x, y, 26, 20, 30);
    this.type = 'crawler';
    this.jumpCooldown = 60 + Math.random() * 40;
  }

  update(player, level) {
    this.animTimer += 0.08;
    this.jumpCooldown--;

    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dist = Math.abs(dx);

    if (dist < 320) {
      this.facing = dx > 0 ? 1 : -1;
      if (this.isGrounded && this.jumpCooldown <= 0) {
        this.vy = -6.5;
        this.vx = this.facing * 3.5;
        this.jumpCooldown = 80 + Math.random() * 30;
        this.squishY = 1.4;
        this.squishX = 0.7;
      }
    }

    // Retorna elasticidade
    this.squishX += (1 - this.squishX) * 0.1;
    this.squishY += (1 - this.squishY) * 0.1;

    this.applyPhysics(level);
    this.checkPlayerCollision(player);
  }

  render(ctx) {
    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height;

    ctx.translate(cx, cy);
    ctx.scale(this.squishX, this.squishY);

    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      // Corpo de gosma preta viscosa
      const grad = ctx.createRadialGradient(0, -this.height * 0.6, 2, 0, -this.height * 0.5, this.width * 0.7);
      grad.addColorStop(0, '#3a0ca3');
      grad.addColorStop(0.5, '#16001e');
      grad.addColorStop(1, '#08050d');
      ctx.fillStyle = grad;
    }

    // Formato de gota deformada
    ctx.beginPath();
    ctx.ellipse(0, -this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Olhos vermelhos brilhantes do Vazio
    if (this.hitFlash === 0) {
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.facing * 4 - 3, -this.height * 0.55, 2.5, 0, Math.PI * 2);
      ctx.arc(this.facing * 4 + 4, -this.height * 0.55, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================================================
// 2. GOSMA CUSPIDORA DE PICHE (SPITTER SLIME)
// ============================================================================
class SpitterSlime extends BaseSlime {
  constructor(x, y) {
    super(x, y, 32, 28, 55);
    this.type = 'spitter';
    this.shootTimer = 90 + Math.random() * 40;
    this.projectiles = [];
  }

  update(player, level) {
    this.animTimer += 0.05;
    this.shootTimer--;

    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    const dist = Math.hypot(dx, dy);

    this.facing = dx > 0 ? 1 : -1;

    // Disparo de projétil gosmento
    if (dist < 420 && this.shootTimer <= 0) {
      this.shootTimer = 110;
      audio.playSlimeShoot();
      const angle = Math.atan2(dy, dx);
      this.projectiles.push({
        x: this.x + this.width / 2,
        y: this.y + 6,
        vx: Math.cos(angle) * 4.8,
        vy: Math.sin(angle) * 4.8 - 1,
        radius: 6,
        life: 140
      });
      this.squishY = 1.3;
      this.squishX = 0.8;
    }

    this.squishX += (1 - this.squishX) * 0.1;
    this.squishY += (1 - this.squishY) * 0.1;

    // Atualização de projéteis
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // Leve queda do ácido
      p.life--;

      // Colisão do projétil com o cenário
      if (level.checkTileCollision(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2) || p.life <= 0) {
        particles.createSlimeSplatter(p.x, p.y, 4, '#1b002b');
        this.projectiles.splice(i, 1);
        continue;
      }

      // Colisão com o lobo
      const hitDist = Math.hypot((player.x + player.width / 2) - p.x, (player.y + player.height / 2) - p.y);
      if (hitDist < p.radius + 14) {
        player.takeDamage(18, p.vx > 0 ? 4 : -4, -3);
        particles.createSlimeSplatter(p.x, p.y, 8, '#ff0055');
        this.projectiles.splice(i, 1);
      }
    }

    this.applyPhysics(level);
    this.checkPlayerCollision(player);
  }

  render(ctx) {
    // Projéteis
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = '#0f051d';
      ctx.strokeStyle = '#9d4edd';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#9d4edd';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height;
    ctx.translate(cx, cy);
    ctx.scale(this.squishX, this.squishY);

    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      const grad = ctx.createRadialGradient(0, -this.height * 0.6, 2, 0, -this.height * 0.5, this.width * 0.7);
      grad.addColorStop(0, '#480ca8');
      grad.addColorStop(0.6, '#13001e');
      grad.addColorStop(1, '#050208');
      ctx.fillStyle = grad;
    }

    ctx.beginPath();
    ctx.ellipse(0, -this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boca cuspidora pulsante
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(this.facing * 6, -this.height * 0.45, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Olhos venenosos roxos
    if (this.hitFlash === 0) {
      ctx.fillStyle = '#c77dff';
      ctx.shadowColor = '#c77dff';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(-2, -this.height * 0.7, 2, 0, Math.PI * 2);
      ctx.arc(4, -this.height * 0.75, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================================================
// 3. GOSMA VOADORA / SOMBRA ALADA (FLYING SHADOW SLIME)
// ============================================================================
class FlyingSlime extends BaseSlime {
  constructor(x, y) {
    super(x, y, 28, 24, 45);
    this.type = 'flying';
    this.baseY = y;
    this.diveTimer = 0;
    this.isDiving = false;
  }

  update(player, level) {
    this.animTimer += 0.08;

    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
    const dist = Math.hypot(dx, dy);

    this.facing = dx > 0 ? 1 : -1;

    // Voo ondulado
    if (!this.isDiving) {
      this.y = this.baseY + Math.sin(this.animTimer) * 18;
      this.x += this.facing * 0.8;

      // Rasante quando o lobo se aproxima por baixo
      if (dist < 200 && dy > 20) {
        this.isDiving = true;
        this.diveTimer = 40;
        this.vx = (dx / dist) * 6;
        this.vy = 5;
      }
    } else {
      this.diveTimer--;
      this.x += this.vx;
      this.y += this.vy;

      if (this.diveTimer <= 0 || this.y > player.y + 40) {
        this.isDiving = false;
        this.baseY = this.y - 60;
        this.vy = -3;
      }
    }

    if (this.hitFlash > 0) this.hitFlash--;
    this.checkPlayerCollision(player);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#0c0714';
      ctx.strokeStyle = '#3c096c';
      ctx.lineWidth = 1.5;
    }

    // Corpo de gosma alada
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Asas amorfas de gosma que batem
    const wingFlap = Math.sin(this.animTimer * 2) * 8;
    ctx.fillStyle = '#240046';
    // Asa esquerda
    ctx.beginPath();
    ctx.moveTo(-this.width / 2, 0);
    ctx.quadraticCurveTo(-this.width - 6, -10 + wingFlap, -this.width + 4, 10);
    ctx.fill();
    // Asa direita
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.quadraticCurveTo(this.width + 6, -10 + wingFlap, this.width - 4, 10);
    ctx.fill();

    // Olhos brilhantes
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.facing * 4, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ============================================================================
// 4. GOSMA BLINDADA COM ESPINHOS (SPIKE SLIME)
// ============================================================================
class SpikeSlime extends BaseSlime {
  constructor(x, y) {
    super(x, y, 34, 28, 80);
    this.type = 'spike';
  }

  takeDamage(amount, knockbackX = 0, knockbackY = -2) {
    // Se for atacado de frente com soco normal, absorve 50% de dano
    super.takeDamage(amount * 0.65, knockbackX * 0.4, knockbackY);
    particles.createSparks(this.x + this.width / 2, this.y + this.height / 2, 6, '#ffaa00');
  }

  update(player, level) {
    this.animTimer += 0.04;
    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dist = Math.abs(dx);

    if (dist < 260) {
      this.facing = dx > 0 ? 1 : -1;
      this.vx = this.facing * 1.4;
    }

    this.applyPhysics(level);
    this.checkPlayerCollision(player);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height);

    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#100e17';
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 1.5;
    }

    // Corpo de gosma endurecida
    ctx.beginPath();
    ctx.ellipse(0, -this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Espinhos de obsidiana salientes
    ctx.fillStyle = '#3a0ca3';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 6 - 3, -this.height * 0.7);
      ctx.lineTo(i * 6, -this.height * 1.15);
      ctx.lineTo(i * 6 + 3, -this.height * 0.7);
      ctx.fill();
    }

    // Olhos
    ctx.fillStyle = '#ff5400';
    ctx.shadowColor = '#ff5400';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.facing * 5, -this.height * 0.45, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ============================================================================
// 5. GOSMA PREDADORA VELOZ (SHADOW STALKER)
// ============================================================================
class StalkerSlime extends BaseSlime {
  constructor(x, y) {
    super(x, y, 32, 26, 75);
    this.type = 'stalker';
    this.dashTimer = 0;
  }

  update(player, level) {
    this.animTimer += 0.08;
    this.dashTimer--;

    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dist = Math.abs(dx);

    this.facing = dx > 0 ? 1 : -1;

    if (dist < 340 && this.isGrounded && this.dashTimer <= 0) {
      // Avanço supersônico
      this.vx = this.facing * 7.5;
      this.vy = -3;
      this.dashTimer = 70;
      particles.createSlimeSplatter(this.x + this.width / 2, this.y + this.height, 6, '#7209b7');
    }

    this.applyPhysics(level);
    this.checkPlayerCollision(player);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#08010f';
      ctx.strokeStyle = '#b5179e';
      ctx.lineWidth = 1.5;
    }

    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rastro sombrio
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.facing * 6, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ============================================================================
// 6. GOSMA COLOSSO DIVISORA (SPLITTER TITAN SLIME)
// ============================================================================
class SplitterSlime extends BaseSlime {
  constructor(x, y, generation = 1) {
    const size = generation === 1 ? 48 : (generation === 2 ? 32 : 20);
    const hp = generation === 1 ? 110 : (generation === 2 ? 50 : 25);
    super(x, y, size, size * 0.8, hp);
    this.type = 'splitter';
    this.generation = generation;
  }

  die() {
    super.die();

    // Se ainda puder se dividir, gera 2 gosmas menores
    if (this.generation < 3 && window.game && window.game.currentEnemies) {
      const s1 = new SplitterSlime(this.x - 10, this.y - 10, this.generation + 1);
      s1.vx = -4;
      s1.vy = -5;

      const s2 = new SplitterSlime(this.x + 10, this.y - 10, this.generation + 1);
      s2.vx = 4;
      s2.vy = -5;

      window.game.currentEnemies.push(s1, s2);
      particles.addFloatingText('DIVIDIU!', this.x + this.width / 2, this.y - 16, '#9d4edd', 12);
    }
  }

  update(player, level) {
    this.animTimer += 0.05;
    const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
    const dist = Math.abs(dx);

    if (dist < 300) {
      this.facing = dx > 0 ? 1 : -1;
      if (this.isGrounded && Math.random() < 0.02) {
        this.vy = -5.5;
        this.vx = this.facing * (this.generation === 1 ? 2.5 : 4);
      }
    }

    this.applyPhysics(level);
    this.checkPlayerCollision(player);
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height);

    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = '#07020d';
      ctx.strokeStyle = '#560bad';
      ctx.lineWidth = 2;
    }

    ctx.beginPath();
    ctx.ellipse(0, -this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Múltiplos núcleos/olhos roxos indicando divisão
    ctx.fillStyle = '#7209b7';
    ctx.shadowColor = '#b5179e';
    ctx.shadowBlur = 6;
    for (let i = 0; i < this.generation; i++) {
      ctx.beginPath();
      ctx.arc(this.facing * (4 + i * 5), -this.height * 0.55 + i * 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================================================
// 8. O SOBERANO ABISSAL (CHEFE FINAL DA FASE 8 - MULTI-FASES)
// ============================================================================
class AbyssalSovereignBoss extends BaseSlime {
  constructor(x, y) {
    super(x, y, 96, 96, 750);
    this.type = 'boss';
    this.phase = 1; // 1, 2, 3
    this.attackTimer = 100;
    this.projectiles = [];
    this.coreShield = false;
    this.laserAngle = 0;
    this.isFiringLaser = false;
  }

  takeDamage(amount, knockbackX = 0, knockbackY = 0) {
    if (this.coreShield) {
      particles.createSparks(this.x + this.width / 2, this.y + this.height / 2, 8, '#ff0055');
      particles.addFloatingText('BLINDADO!', this.x + this.width / 2, this.y - 20, '#ff0055', 14);
      return;
    }

    super.takeDamage(amount, 0, 0); // Imune a knockback massivo
    if (window.engine) {
      window.engine.camera.shake(5, 10);
    }

    // Transição de fases
    if (this.hp <= 500 && this.phase === 1) {
      this.phase = 2;
      audio.startMusic('boss');
      particles.createShockwave(this.x + this.width / 2, this.y + this.height / 2, 220, '#ff0055');
      particles.addFloatingText('FASE 2: FÚRIA NEGRA!', this.x + this.width / 2, this.y - 30, '#ff0055', 18);
    } else if (this.hp <= 250 && this.phase === 2) {
      this.phase = 3;
      particles.createShockwave(this.x + this.width / 2, this.y + this.height / 2, 260, '#bb00ff');
      particles.addFloatingText('FASE 3: COLAPSO DO VAZIO!', this.x + this.width / 2, this.y - 30, '#bb00ff', 20);
    }

    if (this.hp <= 0) {
      this.triggerBossVictory();
    }
  }

  triggerBossVictory() {
    this.alive = false;
    audio.playSlam();
    particles.createShockwave(this.x + this.width / 2, this.y + this.height / 2, 350, '#00f0ff');
    particles.createSparks(this.x + this.width / 2, this.y + this.height / 2, 80, '#00f0ff');
    particles.createSlimeSplatter(this.x + this.width / 2, this.y + this.height / 2, 60, '#111');

    if (window.game) {
      setTimeout(() => {
        window.game.triggerGameVictory();
      }, 1200);
    }
  }

  update(player, level) {
    this.animTimer += 0.04;
    this.attackTimer--;

    // Flutuação mística
    this.y += Math.sin(this.animTimer * 2) * 1.2;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.hypot(dx, dy);

    this.facing = dx > 0 ? 1 : -1;

    // PADRÕES DE ATAQUE CONFORME A FASE
    if (this.attackTimer <= 0) {
      if (this.phase === 1) {
        // Ataque 1: Disparo espalhado de 5 esferas de gosma preta
        this.attackTimer = 90;
        audio.playSlimeShoot();
        for (let i = -2; i <= 2; i++) {
          const angle = Math.atan2(dy, dx) + i * 0.22;
          this.projectiles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5,
            radius: 8,
            life: 180,
            color: '#7209b7'
          });
        }
      } else if (this.phase === 2) {
        // Ataque 2: Chuva de tentáculos e esferas perseguidoras
        this.attackTimer = 75;
        audio.playSlimeShoot();
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 / 8) * i + (this.animTimer);
          this.projectiles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * 4.2,
            vy: Math.sin(angle) * 4.2,
            radius: 9,
            life: 150,
            color: '#ff0055'
          });
        }
      } else if (this.phase === 3) {
        // Ataque 3: Laser do Vazio + Chuva Caótica
        this.attackTimer = 60;
        audio.playSlam();
        for (let i = -3; i <= 3; i++) {
          const angle = Math.atan2(dy, dx) + i * 0.18;
          this.projectiles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * 6.5,
            vy: Math.sin(angle) * 6.5,
            radius: 11,
            life: 140,
            color: '#00f0ff'
          });
        }
      }
    }

    // Atualização de projéteis do chefe
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      if (p.life <= 0 || level.checkTileCollision(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2)) {
        particles.createSlimeSplatter(p.x, p.y, 4, p.color);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Colisão com o lobo
      const hitDist = Math.hypot(px - p.x, py - p.y);
      if (hitDist < p.radius + 16) {
        player.takeDamage(22, p.vx > 0 ? 6 : -6, -4);
        particles.createSparks(p.x, p.y, 8, '#ff0055');
        this.projectiles.splice(i, 1);
      }
    }

    if (this.hitFlash > 0) this.hitFlash--;
    this.checkPlayerCollision(player);
  }

  render(ctx) {
    // Projéteis
    for (const p of this.projectiles) {
      ctx.save();
      ctx.fillStyle = '#0a0014';
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    ctx.translate(cx, cy);

    // Tentáculos amorfos ondulantes no fundo
    ctx.strokeStyle = '#240046';
    ctx.lineWidth = 6;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 / 6) * i + Math.sin(this.animTimer + i) * 0.4;
      const tx = Math.cos(a) * (this.width * 0.7);
      const ty = Math.sin(a) * (this.height * 0.7);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(tx * 0.5 + Math.sin(this.animTimer * 3 + i) * 15, ty * 0.5, tx, ty);
      ctx.stroke();
    }

    // Corpo Titânico da Gosma Suprema
    if (this.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, this.width / 2);
      grad.addColorStop(0, '#560bad');
      grad.addColorStop(0.5, '#190028');
      grad.addColorStop(1, '#05020a');
      ctx.fillStyle = grad;
      ctx.strokeStyle = this.phase === 3 ? '#ff0055' : (this.phase === 2 ? '#9d4edd' : '#00f0ff');
      ctx.lineWidth = 3;
    }

    ctx.beginPath();
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Olho Central Gigante do Vazio
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(this.facing * 8, 0, 18, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupila vertical felina/abissal
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(this.facing * 10, 0, 5, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // BARRA DE VIDA DO CHEFE NO TOPO
    this.renderBossHealthBar(ctx);
  }

  renderBossHealthBar(ctx) {
    const barW = 400;
    const barH = 16;
    const barX = (960 - barW) / 2;
    const barY = 56;

    ctx.save();
    // Fundo da barra
    ctx.fillStyle = 'rgba(10, 12, 20, 0.9)';
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 10;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillRect(barX, barY, barW, barH);

    // Preenchimento de vida
    const fillW = Math.max(0, (this.hp / this.maxHp) * (barW - 4));
    ctx.fillStyle = 'linear-gradient(90deg, #7209b7, #ff0055)';
    ctx.fillRect(barX + 2, barY + 2, fillW, barH - 4);

    // Texto do Chefe
    ctx.font = "bold 11px 'Orbitron', sans-serif";
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`O SOBERANO ABISSAL DAS GOSMAS [HP: ${Math.ceil(this.hp)} / ${this.maxHp}]`, 960 / 2, barY - 6);
    ctx.restore();
  }
}
