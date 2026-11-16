/**
 * LOBO PRETO DE MÁSCARA BRANCA - JOGADOR & BRAÇO BIÔNICO
 * Controla movimentação, física de plataforma, estados de animação
 * e o arsenal de combate cibernético contra as gosmas pretas.
 */

class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 30;
    this.height = 44;

    // Vida e Recursos
    this.maxHealth = 100;
    this.health = 100;
    this.maxEnergy = 100;
    this.energy = 100;
    this.score = 0;
    this.slimesKilled = 0;

    // Física e Movimentação
    this.speed = 4.2;
    this.jumpForce = 9.8;
    this.gravity = 0.44;
    this.maxFallSpeed = 12;
    this.facing = 1; // 1 = Direita, -1 = Esquerda
    this.isGrounded = false;
    this.canDoubleJump = true;
    this.isWallSliding = false;
    this.wallDir = 0;

    // Tolerâncias de pulo (Game feel impecável)
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;

    // Estado do Dash
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashSpeed = 11.5;

    // Estado do Soco Biônico
    this.isPunching = false;
    this.punchTimer = 0;
    this.comboStep = 1;
    this.comboResetTimer = 0;
    this.punchHitbox = null;

    // Estado do Braço Foguete / Gancho (Rocket Fist)
    this.rocketFist = null; // { x, y, vx, vy, maxDist, dist, returning, tether }

    // Estado do Impacto Sísmico (EMP Slam)
    this.isSlamming = false;

    // Disparos de Longo Alcance (Canhão de Plasma do Braço Biônico)
    this.bullets = [];
    this.shootCooldown = 0;

    // Invulnerabilidade pós dano
    this.invulnerableTimer = 0;

    // Animação procedural
    this.animTime = 0;
    this.tailAngle = 0;
    this.eyeGlowIntensity = 1;
  }

  reset(x = this.startX, y = this.startY) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.energy = this.maxEnergy;
    this.isDashing = false;
    this.isPunching = false;
    this.isSlamming = false;
    this.rocketFist = null;
    this.bullets = [];
    this.shootCooldown = 0;
    this.invulnerableTimer = 0;
    this.facing = 1;
  }

  takeDamage(amount, knockbackX = 0, knockbackY = -4) {
    if (this.invulnerableTimer > 0 || this.isDashing) return;

    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 45; // ~0.75 segundo de invulnerabilidade
    this.vx = knockbackX;
    this.vy = knockbackY;

    audio.playHurt();
    particles.createSparks(this.x + this.width / 2, this.y + this.height / 2, 8, '#ff0055');
    particles.addFloatingText(`-${amount}`, this.x + this.width / 2, this.y - 10, '#ff0055', 14);

    // Efeito de tremor na tela
    if (window.engine) {
      window.engine.camera.shake(8, 12);
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    audio.playDeath();
    particles.createSparks(this.x + this.width / 2, this.y + this.height / 2, 25, '#00f0ff');
    particles.createSlimeSplatter(this.x + this.width / 2, this.y + this.height / 2, 15, '#111');
    if (window.game) {
      window.game.triggerGameOver("A gosma negra envolveu sua máscara e drenou sua energia vital...");
    }
  }

  // ==========================================
  // HABILIDADES DO BRAÇO BIÔNICO
  // ==========================================

  // 1. Combo de Socos
  performPunch() {
    if (this.isPunching || this.isDashing) return;

    this.isPunching = true;
    this.punchTimer = 14; // Duração do frame de ataque
    audio.playPunch(this.comboStep);

    // Hitbox à frente do lobo
    const reach = this.comboStep === 3 ? 48 : 36;
    const hitW = reach;
    const hitH = 40;
    const hitX = this.facing === 1 ? (this.x + this.width) : (this.x - reach);
    const hitY = this.y + 4;

    this.punchHitbox = {
      x: hitX,
      y: hitY,
      width: hitW,
      height: hitH,
      damage: this.comboStep === 3 ? 55 : (this.comboStep === 2 ? 35 : 25),
      knockback: this.comboStep === 3 ? 8 : 4.5,
      step: this.comboStep
    };

    // Pequeno impulso para a frente ao socar
    this.vx += this.facing * (this.comboStep === 3 ? 3.5 : 2);

    // Partículas de energia biônica
    particles.createSparks(
      hitX + (this.facing === 1 ? 10 : hitW - 10),
      hitY + hitH / 2,
      this.comboStep === 3 ? 12 : 6,
      this.comboStep === 3 ? '#ffaa00' : '#00f0ff'
    );

    // Avança combo
    this.comboStep = (this.comboStep % 3) + 1;
    this.comboResetTimer = 45;
  }

  // 2. Disparo de Braço Foguete / Gancho Retrátil
  performRocketFist(targetWorldX = null, targetWorldY = null) {
    if (this.rocketFist || this.energy < 25 || this.isDashing) return;

    this.energy = Math.max(0, this.energy - 25);
    audio.playRocketLaunch();

    const originX = this.facing === 1 ? (this.x + this.width) : this.x;
    const originY = this.y + this.height * 0.45;

    let vx = this.facing * 14;
    let vy = 0;

    // Se houver mira por mouse válida, calcula o vetor direcional
    if (targetWorldX !== null && targetWorldY !== null) {
      const dx = targetWorldX - originX;
      const dy = targetWorldY - originY;
      const angle = Math.atan2(dy, dx);
      vx = Math.cos(angle) * 14;
      vy = Math.sin(angle) * 14;
      this.facing = vx >= 0 ? 1 : -1;
    }

    this.rocketFist = {
      x: originX,
      y: originY,
      startX: originX,
      startY: originY,
      vx: vx,
      vy: vy,
      width: 18,
      height: 14,
      maxDist: 280,
      currentDist: 0,
      returning: false,
      pullingPlayer: false,
      damage: 65,
      hitTargets: new Set()
    };

    particles.createSparks(originX, originY, 8, '#ffaa00');
  }

  // 3. Turbo Dash
  performDash() {
    if (this.dashCooldown > 0 || this.energy < 20 || this.isDashing) return;

    this.isDashing = true;
    this.dashTimer = 12;
    this.dashCooldown = 35;
    this.energy = Math.max(0, this.energy - 20);
    this.vx = this.facing * this.dashSpeed;
    this.vy = 0; // Dash horizontal puro

    audio.playDash();
    particles.createSparks(this.x + this.width / 2, this.y + this.height / 2, 10, '#00f0ff');
    if (window.engine) {
      window.engine.camera.shake(3, 8);
    }
  }

  // 4. Impacto Sísmico (Super EMP Slam)
  performSlam() {
    if (this.isSlamming || this.energy < 80) return;

    // Se estiver no chão, dá um pulo preparatório rápido antes de descer
    if (this.isGrounded) {
      this.vy = -7;
    }
    this.isSlamming = true;
    this.energy = Math.max(0, this.energy - 80);
    this.vx = 0;
    this.vy = 14; // Desce em alta velocidade
    particles.createSparks(this.x + this.width / 2, this.y, 10, '#bb00ff');
  }

  // 5. Disparo de Longo Alcance (Canhão de Plasma Cibernético)
  shootBlaster(targetWorldX = null, targetWorldY = null) {
    if (this.shootCooldown > 0 || this.isDashing) return;

    this.shootCooldown = 8; // Cadência rápida de tiro
    audio.playBlaster();

    const originX = this.facing === 1 ? (this.x + this.width + 4) : (this.x - 4);
    const originY = this.y + this.height * 0.42;

    let vx = this.facing * 16;
    let vy = 0;

    if (targetWorldX !== null && targetWorldY !== null) {
      const dx = targetWorldX - originX;
      const dy = targetWorldY - originY;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        vx = (dx / dist) * 16;
        vy = (dy / dist) * 16;
        this.facing = vx >= 0 ? 1 : -1;
      }
    }

    this.bullets.push({
      x: originX,
      y: originY,
      vx: vx,
      vy: vy,
      radius: 4,
      length: 14,
      damage: 40,
      life: 80 // Longo alcance (tela inteira)
    });

    // Muzzle flash cibernético
    particles.createSparks(originX, originY, 4, '#00f0ff');
  }

  // Atualização dos projéteis de plasma
  updateBullets(level) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life--;

      // Rastro de faíscas neon
      if (Math.random() < 0.35) {
        particles.createSparks(b.x, b.y, 1, '#00f0ff');
      }

      // Colisão do projétil com o cenário
      const col = level.checkTileCollision(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2);
      if (col || b.life <= 0) {
        particles.createSparks(b.x, b.y, 4, '#00f0ff');
        this.bullets.splice(i, 1);
      }
    }
  }

  // Renderização dos projéteis de plasma
  renderBullets(ctx) {
    for (const b of this.bullets) {
      ctx.save();
      const angle = Math.atan2(b.vy, b.vx);
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);

      // Brilho neon de plasma
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.length, b.radius, 0, 0, Math.PI * 2);
      ctx.fill();

      // Núcleo branco incandescente
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, b.length * 0.6, b.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ==========================================
  // ATUALIZAÇÃO DE FÍSICA & CONTROLES
  // ==========================================
  update(input, level) {
    this.animTime += 0.08;

    // Regeneração passiva da energia do Braço Biônico
    if (this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + 0.35);
    }

    // Timers de estado
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.comboResetTimer > 0) {
      this.comboResetTimer--;
      if (this.comboResetTimer === 0) this.comboStep = 1;
    }

    // Atualização do Soco
    if (this.isPunching) {
      this.punchTimer--;
      if (this.punchTimer <= 0) {
        this.isPunching = false;
        this.punchHitbox = null;
      }
    }

    // 1. DASH UPDATE
    if (this.isDashing) {
      this.dashTimer--;
      this.vy = 0; // Imune à gravidade durante o dash
      particles.createDashGhost(this.x + this.width / 2, this.y + this.height / 2, this.facing);

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx *= 0.4;
      }
    } else {
      // 2. MOVIMENTO HORIZONTAL NORMAL
      let moveDir = 0;
      if (input.left) moveDir -= 1;
      if (input.right) moveDir += 1;

      if (moveDir !== 0) {
        this.facing = moveDir;
        // Não acelera tanto se estiver socando
        const accFactor = this.isPunching ? 0.4 : 1.0;
        this.vx += moveDir * 0.8 * accFactor;
        if (Math.abs(this.vx) > this.speed) {
          this.vx = moveDir * this.speed;
        }

        // Poeira ao correr no chão
        if (this.isGrounded && Math.random() < 0.25) {
          particles.createDust(this.x + this.width / 2, this.y + this.height, 1);
        }
      } else {
        // Desaceleração / Atrito
        this.vx *= this.isGrounded ? 0.75 : 0.92;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
      }

      // 3. GRAVIDADE & QUEDA
      if (!this.isGrounded) {
        // Se estiver deslizando na parede, desce mais devagar
        if (this.isWallSliding && this.vy > 0) {
          this.vy = Math.min(this.vy + this.gravity * 0.4, 2.8);
          // Faíscas na parede
          if (Math.random() < 0.3) {
            const wallX = this.wallDir === 1 ? (this.x + this.width) : this.x;
            particles.createSparks(wallX, this.y + this.height * 0.6, 2, '#00f0ff');
          }
        } else {
          this.vy += this.gravity;
          if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
        }
      }
    }

    // 4. PULOS & WALL JUMP
    if (this.isGrounded) {
      this.coyoteTimer = 7;
      this.canDoubleJump = true;
    } else {
      if (this.coyoteTimer > 0) this.coyoteTimer--;
    }

    if (input.jumpPressed) {
      this.jumpBufferTimer = 8;
    }

    if (this.jumpBufferTimer > 0) {
      // Pulo normal do chão ou coyote time
      if (this.isGrounded || this.coyoteTimer > 0) {
        this.vy = -this.jumpForce;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        audio.playJump();
        particles.createDust(this.x + this.width / 2, this.y + this.height, 5);
      }
      // Wall Jump
      else if (this.isWallSliding) {
        this.vy = -this.jumpForce * 0.95;
        this.vx = -this.wallDir * (this.speed * 1.3);
        this.facing = -this.wallDir;
        this.isWallSliding = false;
        this.jumpBufferTimer = 0;
        audio.playJump();
        particles.createSparks(this.x + this.width / 2, this.y + this.height * 0.5, 8, '#00f0ff');
      }
      // Pulo duplo
      else if (this.canDoubleJump) {
        this.vy = -this.jumpForce * 0.9;
        this.canDoubleJump = false;
        this.jumpBufferTimer = 0;
        audio.playDoubleJump();
        particles.createSparks(this.x + this.width / 2, this.y + this.height, 8, '#00f0ff');
      } else {
        this.jumpBufferTimer--;
      }
    }

    // 5. INPUTS DE COMBATE
    if (this.shootCooldown > 0) this.shootCooldown--;

    if (input.shootPressed) {
      let targetX = null;
      let targetY = null;
      if (input.mouse && window.engine && (input.mouse.x !== 0 || input.mouse.y !== 0)) {
        targetX = input.mouse.x + window.engine.camera.x;
        targetY = input.mouse.y + window.engine.camera.y;
      }
      this.shootBlaster(targetX, targetY);
    }
    if (input.punchPressed) {
      this.performPunch();
    }
    if (input.rocketPressed) {
      let targetX = null;
      let targetY = null;
      if (input.mouse && window.engine && (input.mouse.x !== 0 || input.mouse.y !== 0)) {
        targetX = input.mouse.x + window.engine.camera.x;
        targetY = input.mouse.y + window.engine.camera.y;
      }
      this.performRocketFist(targetX, targetY);
    }
    if (input.dashPressed) {
      this.performDash();
    }
    if (input.slamPressed) {
      this.performSlam();
    }

    // 6. COLISÕES COM O CENÁRIO (Eixo X e Y separados com tolerância anti-bloqueio)
    this.handleCollisions(level);

    // 7. ATUALIZAÇÃO DO BRAÇO FOGUETE & PROJÉTEIS DE PLASMA
    this.updateRocketFist(level);
    this.updateBullets(level);

    // Ajuste da cauda e olhos
    this.tailAngle = Math.sin(this.animTime * 3) * 0.25 + (this.vx * 0.08);
  }

  // ==========================================
  // FÍSICA DE COLISÃO COM O CENÁRIO
  // ==========================================
  handleCollisions(level) {
    const wasGrounded = this.isGrounded;

    // Limites de velocidade máxima para estabilidade física
    this.vx = Math.max(-10, Math.min(10, this.vx));
    this.vy = Math.max(-13, Math.min(13, this.vy));

    // Movimento X
    this.x += this.vx;
    this.isWallSliding = false;
    this.wallDir = 0;

    // Colisão horizontal com folga no topo e base para NUNCA travar os pés no chão!
    let overlapX = level.checkTileCollision(this.x, this.y + 4, this.width, this.height - 8);
    if (overlapX) {
      if (this.vx > 0) {
        this.x = overlapX.tileX * level.tileSize - this.width;
        this.wallDir = 1;
      } else if (this.vx < 0) {
        this.x = (overlapX.tileX + 1) * level.tileSize;
        this.wallDir = -1;
      }
      this.vx = 0;

      // Ativa deslizamento de parede se estiver caindo e segurando na direção da parede
      if (!this.isGrounded && this.vy > 0) {
        this.isWallSliding = true;
      }
    }

    // Movimento Y
    this.y += this.vy;
    this.isGrounded = false;

    // Colisão vertical com folga lateral para não travar em cantos de parede
    let overlapY = level.checkTileCollision(this.x + 2, this.y, this.width - 4, this.height);
    if (overlapY) {
      if (this.vy > 0) {
        this.y = overlapY.tileY * level.tileSize - this.height;
        this.isGrounded = true;

        // Se acabou de aterrissar de um Slam
        if (this.isSlamming) {
          this.isSlamming = false;
          audio.playSlam();
          particles.createShockwave(this.x + this.width / 2, this.y + this.height, 160, '#00f0ff');
          particles.createSparks(this.x + this.width / 2, this.y + this.height, 20, '#00f0ff');
          if (window.engine) {
            window.engine.camera.shake(12, 18);
          }
          // Dano em área para gosmas
          if (window.game && window.game.currentEnemies) {
            for (const enemy of window.game.currentEnemies) {
              const dist = Math.hypot(
                (enemy.x + enemy.width / 2) - (this.x + this.width / 2),
                (enemy.y + enemy.height / 2) - (this.y + this.height)
              );
              if (dist <= 160) {
                enemy.takeDamage(120, (enemy.x > this.x ? 8 : -8), -6);
              }
            }
          }
        } else if (!wasGrounded && this.vy > 4) {
          particles.createDust(this.x + this.width / 2, this.y + this.height, 4);
        }
      } else if (this.vy < 0) {
        this.y = (overlapY.tileY + 1) * level.tileSize;
      }
      this.vy = 0;
    }

    // LIMITES RÍGIDOS DA TELA (Garante que o lobo nunca voe para fora da tela)
    if (this.x < 0) {
      this.x = 0;
      this.vx = Math.max(0, this.vx);
    }
    if (this.x > level.pixelWidth - this.width) {
      this.x = level.pixelWidth - this.width;
      this.vx = Math.min(0, this.vx);
    }
    if (this.y < 0) {
      this.y = 0;
      this.vy = Math.max(0, this.vy);
    }

    // Se caiu no abismo profundo por baixo do nível
    if (this.y > level.pixelHeight + 100) {
      this.takeDamage(100);
    }
  }

  // ==========================================
  // ATUALIZAÇÃO DO BRAÇO FOGUETE
  // ==========================================
  updateRocketFist(level) {
    if (!this.rocketFist) return;

    const rf = this.rocketFist;

    if (!rf.returning) {
      rf.x += rf.vx;
      rf.y += rf.vy;
      rf.currentDist += Math.hypot(rf.vx, rf.vy);

      // Partículas no punho em vôo
      if (Math.random() < 0.4) {
        particles.createSparks(rf.x, rf.y + rf.height / 2, 2, '#00f0ff');
      }

      // Colisão do punho com o cenário
      const tileCol = level.checkTileCollision(rf.x, rf.y, rf.width, rf.height);
      if (tileCol) {
        audio.playRocketHit();
        particles.createSparks(rf.x + rf.width / 2, rf.y + rf.height / 2, 10, '#00f0ff');
        rf.returning = true;

        // VERIFICAÇÃO DE SEGURANÇA CONTRA EJEÇÃO:
        // Se acertou o chão abaixo do lobo, NUNCA puxa o jogador para evitar arremessá-lo fora da tela!
        const hitBelowPlayer = rf.y >= (this.y + this.height * 0.6);
        const pullDist = Math.hypot(rf.x - (this.x + this.width / 2), rf.y - (this.y + this.height / 2));

        // Só ativa tração se for uma parede lateral ou plataforma alta
        if (!hitBelowPlayer && pullDist > 80) {
          const angle = Math.atan2(rf.y - (this.y + this.height * 0.4), rf.x - (this.x + this.width / 2));
          this.vx = Math.max(-9, Math.min(9, Math.cos(angle) * 8.5));
          this.vy = Math.max(-8, Math.min(4, Math.sin(angle) * 7 - 2));
          this.isGrounded = false;
        } else if (hitBelowPlayer) {
          // Apenas cria poeira e impacto no piso sem jogar o personagem para longe
          particles.createDust(rf.x + rf.width / 2, rf.y, 4);
        }
      }

      // Alcance máximo atingido -> inicia retorno
      if (rf.currentDist >= rf.maxDist) {
        rf.returning = true;
      }
    } else {
      // Retornando suavemente para o lobo
      const targetX = this.facing === 1 ? (this.x + this.width) : this.x;
      const targetY = this.y + this.height * 0.45;
      const dx = targetX - rf.x;
      const dy = targetY - rf.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 20) {
        // Encaixou de volta no braço biônico!
        this.rocketFist = null;
        particles.createSparks(targetX, targetY, 4, '#00f0ff');
      } else {
        rf.x += (dx / dist) * 16;
        rf.y += (dy / dist) * 16;
      }
    }
  }

  // ==========================================
  // RENDERIZAÇÃO PROCEDURAL DO LOBO DE MÁSCARA BRANCA
  // ==========================================
  render(ctx) {
    ctx.save();

    // Pisca em vermelho/branco quando invulnerável
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 3) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.translate(cx, cy);
    ctx.scale(this.facing, 1);

    // 1. CAUDA DE LOBO (Pelugem preta estilizada atrás do corpo)
    ctx.save();
    ctx.translate(-10, 10);
    ctx.rotate(this.tailAngle);
    ctx.fillStyle = '#141419';
    ctx.strokeStyle = '#252530';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-18, -4, -26, 12);
    ctx.quadraticCurveTo(-14, 20, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. PERNAS / PATAS DE LOBO
    const runCycle = Math.sin(this.animTime * 12);
    const legOffset = (Math.abs(this.vx) > 0.5 && this.isGrounded) ? runCycle * 6 : 0;

    // Perna de trás
    ctx.fillStyle = '#141419';
    ctx.fillRect(-8 - legOffset, 12, 6, 10);
    // Pata
    ctx.fillStyle = '#0a0a0d';
    ctx.fillRect(-9 - legOffset, 20, 9, 3);

    // Perna da frente
    ctx.fillStyle = '#1e1e26';
    ctx.fillRect(2 + legOffset, 12, 6, 10);
    // Pata
    ctx.fillStyle = '#0a0a0d';
    ctx.fillRect(1 + legOffset, 20, 9, 3);

    // 3. CORPO / TRONCO DE LOBO
    ctx.fillStyle = '#181920';
    ctx.beginPath();
    ctx.roundRect(-10, -6, 20, 20, 4);
    ctx.fill();

    // Cinto tático / Conexões do implante
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(-10, 8, 20, 3);
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 6;
    ctx.fillRect(-2, 8, 4, 3);
    ctx.shadowBlur = 0;

    // 4. CABEÇA DO LOBO
    const headBob = (Math.abs(this.vx) > 0.5 && this.isGrounded) ? Math.abs(runCycle) * 2 : 0;
    ctx.save();
    ctx.translate(2, -14 - headBob);

    // Orelhas de lobo (apontadas para cima e atentas)
    // Orelha esquerda (trás)
    ctx.fillStyle = '#141419';
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(-3, -16);
    ctx.lineTo(1, -6);
    ctx.closePath();
    ctx.fill();

    // Base da cabeça (pêlo preto)
    ctx.fillStyle = '#1c1d24';
    ctx.beginPath();
    ctx.roundRect(-8, -6, 18, 16, 5);
    ctx.fill();

    // Orelha direita (frente)
    ctx.fillStyle = '#22232d';
    ctx.beginPath();
    ctx.moveTo(1, -6);
    ctx.lineTo(5, -17);
    ctx.lineTo(9, -6);
    ctx.closePath();
    ctx.fill();
    // Interior da orelha
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.moveTo(3, -6);
    ctx.lineTo(5, -14);
    ctx.lineTo(7, -6);
    ctx.closePath();
    ctx.fill();

    // ==========================================
    // A MÁSCARA BRANCA (Destaque do Protagonista!)
    // ==========================================
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 4;

    ctx.beginPath();
    // Focinho e contorno da máscara
    ctx.moveTo(-2, -5);
    ctx.lineTo(11, -3);
    ctx.lineTo(14, 2);  // Ponta do focinho da máscara
    ctx.lineTo(10, 6);
    ctx.lineTo(-1, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Detalhes vermelhos / marcas tribais na máscara branca
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(2, -2);
    ctx.lineTo(6, -4);
    ctx.lineTo(4, 0);
    ctx.closePath();
    ctx.fill();

    // Fenda do Olho com Brilho Ciano Neon Penetrante!
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(8, -1);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore(); // Fim cabeça

    // 5. O BRAÇO BIÔNICO (Cibernético, Metálico com Cabos Neon)
    ctx.save();
    ctx.translate(4, 0);

    // Se o punho tiver sido disparado como Rocket Fist, desenha apenas a base do ombro e o cabo
    if (this.rocketFist && !this.rocketFist.returning) {
      // Ombro mecânico cromado
      ctx.fillStyle = '#475569';
      ctx.fillRect(-4, -6, 8, 8);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(-2, -4, 4, 4);
      ctx.shadowBlur = 0;
    } else {
      // Posição do braço de acordo com o soco
      let armAngle = 0;
      let armExtension = 0;

      if (this.isPunching) {
        armAngle = this.comboStep === 3 ? -0.2 : 0.1;
        armExtension = 12 + (this.comboStep * 4);
      } else if (Math.abs(this.vx) > 0.5 && this.isGrounded) {
        armAngle = -runCycle * 0.4;
      }

      ctx.rotate(armAngle);

      // Ombro com blindagem
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, -2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Antebraço cibernético de titânio
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, -3, 10 + armExtension, 6);

      // Tubos de energia neon ciano no braço
      ctx.fillStyle = this.comboStep === 3 && this.isPunching ? '#ffaa00' : '#00f0ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.fillRect(2, -1, 6 + armExtension * 0.7, 2);

      // Manopla / Punho Biônico reforçado
      ctx.fillStyle = '#94a3b8';
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(8 + armExtension, -4, 8, 8, 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore(); // Fim braço biônico

    ctx.restore(); // Fim escala e translação geral do jogador

    // 6. RENDERIZAÇÃO DO CABO & PUNHO FOGUETE NO ESPAÇO GLOBAL
    if (this.rocketFist) {
      this.renderRocketFist(ctx);
    }

    // 7. RENDERIZAÇÃO DOS PROJÉTEIS DE PLASMA DE LONGO ALCANCE
    this.renderBullets(ctx);
  }

  // Renderiza o punho foguete disparado
  renderRocketFist(ctx) {
    const rf = this.rocketFist;
    const originX = this.facing === 1 ? (this.x + this.width) : this.x;
    const originY = this.y + this.height * 0.45;

    // Cabo de energia / corrente ligando o lobo ao punho
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 6;
    ctx.setLineDash([4, 2]);

    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(rf.x, rf.y + rf.height / 2);
    ctx.stroke();

    // Desenha o punho de titânio
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(rf.x, rf.y, rf.width, rf.height, 3);
    ctx.fill();
    ctx.stroke();

    // Propulsor a jato na traseira do punho
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ff5500';
    ctx.shadowBlur = 8;
    const propX = rf.vx > 0 ? rf.x : rf.x + rf.width;
    ctx.beginPath();
    ctx.arc(propX, rf.y + rf.height / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
