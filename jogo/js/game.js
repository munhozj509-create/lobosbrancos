/**
 * LOBO DE MÁSCARA BRANCA - CONTROLADOR CENTRAL DO JOGO
 * Gerencia estados, transições de tela, fluxo das 8 fases,
 * colisões entre o Braço Biônico e as Gosmas Pretas e salvamento de progresso.
 */

class GameManager {
  constructor() {
    this.state = 'menu'; // menu, dialog, playing, paused, level_clear, game_over, victory
    this.currentLevelNum = 1;
    this.maxUnlockedLevel = 1;

    this.player = new Player(64, 300);
    this.currentLevel = null;
    this.currentEnemies = [];

    this.levelStartTime = 0;
    this.levelSlimesStart = 0;

    // Carrega progresso salvo
    this.loadProgress();

    this.setupUIEvents();
    this.setupLevelSelectGrid();

    // Inicia loop principal de renderização e física
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('lobo_mascara_branca_unlocked');
      if (saved) {
        this.maxUnlockedLevel = Math.max(1, Math.min(8, parseInt(saved, 10)));
      }
    } catch (e) {
      console.warn('LocalStorage inacessível:', e);
    }
  }

  saveProgress() {
    try {
      localStorage.setItem('lobo_mascara_branca_unlocked', this.maxUnlockedLevel.toString());
    } catch (e) {
      console.warn('Erro ao salvar progresso:', e);
    }
  }

  setupUIEvents() {
    // Menu Principal
    document.getElementById('btn-start').addEventListener('click', () => {
      audio.ensureContext();
      this.startLevel(1);
    });

    document.getElementById('btn-select-level').addEventListener('click', () => {
      this.openLevelSelect();
    });

    document.getElementById('btn-controls').addEventListener('click', () => {
      this.showScreen('screen-controls');
    });

    document.getElementById('btn-back-controls').addEventListener('click', () => {
      this.showScreen('screen-menu');
    });

    document.getElementById('btn-back-levels').addEventListener('click', () => {
      this.showScreen('screen-menu');
    });

    // Pausa
    document.getElementById('btn-pause').addEventListener('click', () => {
      if (this.state === 'playing') this.pauseGame();
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      this.resumeGame();
    });

    document.getElementById('btn-restart-level').addEventListener('click', () => {
      this.startLevel(this.currentLevelNum);
    });

    document.getElementById('btn-toggle-sound-pause').addEventListener('click', (e) => {
      const enabled = audio.toggleAudio();
      e.target.innerText = `SOM: ${enabled ? 'LIGADO' : 'MUDO'}`;
    });

    document.getElementById('btn-audio').addEventListener('click', () => {
      const enabled = audio.toggleAudio();
      document.getElementById('btn-audio').innerText = enabled ? '🔊' : '🔇';
      engine.showToast(enabled ? 'Som Ativado 🔊' : 'Som Mudo 🔇');
    });

    document.getElementById('btn-quit-to-menu').addEventListener('click', () => {
      audio.stopMusic();
      this.showScreen('screen-menu');
      this.state = 'menu';
      document.getElementById('hud').classList.add('hidden');
    });

    // Vitória de Fase
    document.getElementById('btn-next-level').addEventListener('click', () => {
      if (this.currentLevelNum < 8) {
        this.startLevel(this.currentLevelNum + 1);
      } else {
        this.showScreen('screen-victory');
      }
    });

    document.getElementById('btn-replay-level').addEventListener('click', () => {
      this.startLevel(this.currentLevelNum);
    });

    document.getElementById('btn-menu-from-clear').addEventListener('click', () => {
      audio.stopMusic();
      this.showScreen('screen-menu');
      this.state = 'menu';
      document.getElementById('hud').classList.add('hidden');
    });

    // Game Over
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.startLevel(this.currentLevelNum);
    });

    document.getElementById('btn-menu-from-death').addEventListener('click', () => {
      audio.stopMusic();
      this.showScreen('screen-menu');
      this.state = 'menu';
      document.getElementById('hud').classList.add('hidden');
    });

    // Vitória Final
    document.getElementById('btn-restart-game').addEventListener('click', () => {
      this.startLevel(1);
    });

    document.getElementById('btn-menu-from-victory').addEventListener('click', () => {
      audio.stopMusic();
      this.showScreen('screen-menu');
      this.state = 'menu';
      document.getElementById('hud').classList.add('hidden');
    });

    // Diálogo de História
    document.getElementById('dialog-box').addEventListener('click', () => {
      this.advanceDialog();
    });

    window.addEventListener('keydown', (e) => {
      if (this.state === 'dialog' && (e.code === 'Space' || e.code === 'Enter')) {
        this.advanceDialog();
      }
    });
  }

  setupLevelSelectGrid() {
    const grid = document.getElementById('level-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const difficulties = [
      { text: 'Iniciação', cls: 'diff-easy' },
      { text: 'Moderada', cls: 'diff-medium' },
      { text: 'Desafio', cls: 'diff-medium' },
      { text: 'Avançada', cls: 'diff-hard' },
      { text: 'Perigosa', cls: 'diff-hard' },
      { text: 'Insana', cls: 'diff-extreme' },
      { text: 'Fuga Brutal', cls: 'diff-extreme' },
      { text: 'Chefe Supremo', cls: 'diff-boss' }
    ];

    for (let i = 1; i <= 8; i++) {
      const lvl = LevelManager.getLevel(i);
      const isLocked = i > this.maxUnlockedLevel;

      const card = document.createElement('div');
      card.className = `level-card ${isLocked ? 'locked' : ''}`;

      card.innerHTML = `
        <div class="level-num">FASE 0${i}</div>
        <div class="level-title">${lvl.name}</div>
        <div class="level-difficulty ${difficulties[i - 1].cls}">
          ${isLocked ? '🔒 Bloqueada' : difficulties[i - 1].text}
        </div>
      `;

      if (!isLocked) {
        card.addEventListener('click', () => {
          this.startLevel(i);
        });
      }

      grid.appendChild(card);
    }
  }

  openLevelSelect() {
    this.setupLevelSelectGrid();
    this.showScreen('screen-levels');
  }

  showScreen(screenId) {
    const screens = [
      'screen-menu',
      'screen-levels',
      'screen-controls',
      'screen-pause',
      'screen-level-clear',
      'screen-game-over',
      'screen-victory'
    ];
    screens.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        if (id === screenId) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    });
  }

  hideAllScreens() {
    const screens = [
      'screen-menu',
      'screen-levels',
      'screen-controls',
      'screen-pause',
      'screen-level-clear',
      'screen-game-over',
      'screen-victory'
    ];
    screens.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  // ==========================================
  // INÍCIO & TRANSIÇÃO DE NÍVEIS
  // ==========================================
  startLevel(lvlNum) {
    this.currentLevelNum = lvlNum;
    this.currentLevel = LevelManager.getLevel(lvlNum);

    // Posiciona o jogador no ponto de spawn
    this.player.reset(this.currentLevel.spawnPoint.x, this.currentLevel.spawnPoint.y);

    // Spawna inimigos da fase
    this.currentEnemies = [];
    for (const sp of this.currentLevel.enemySpawns) {
      if (sp.type === 'crawler') this.currentEnemies.push(new CrawlerSlime(sp.x, sp.y));
      else if (sp.type === 'spitter') this.currentEnemies.push(new SpitterSlime(sp.x, sp.y));
      else if (sp.type === 'flying') this.currentEnemies.push(new FlyingSlime(sp.x, sp.y));
      else if (sp.type === 'spike') this.currentEnemies.push(new SpikeSlime(sp.x, sp.y));
      else if (sp.type === 'stalker') this.currentEnemies.push(new StalkerSlime(sp.x, sp.y));
      else if (sp.type === 'splitter') this.currentEnemies.push(new SplitterSlime(sp.x, sp.y, 1));
      else if (sp.type === 'boss') this.currentEnemies.push(new AbyssalSovereignBoss(sp.x, sp.y));
    }

    particles.reset();
    this.hideAllScreens();
    document.getElementById('hud').classList.remove('hidden');

    this.levelStartTime = Date.now();
    this.levelSlimesStart = this.player.slimesKilled;

    // Atualiza badges do HUD
    document.getElementById('hud-level-badge').innerText = `FASE ${lvlNum}`;
    document.getElementById('hud-level-name').innerText = this.currentLevel.name;
    document.getElementById('hud-objective').innerText = this.currentLevel.desc;

    this.updateHud();

    // Inicia música de acordo com a fase
    if (lvlNum === 8) {
      audio.startMusic('boss');
    } else {
      audio.startMusic('normal');
    }

    // Apresenta Diálogo Narrativo da Fase
    this.showDialog(this.currentLevel.storyText);
  }

  showDialog(text) {
    this.state = 'dialog';
    const dialogBox = document.getElementById('dialog-box');
    const dialogText = document.getElementById('dialog-text');
    dialogText.innerText = text;
    dialogBox.classList.remove('hidden');
  }

  advanceDialog() {
    const dialogBox = document.getElementById('dialog-box');
    dialogBox.classList.add('hidden');
    this.state = 'playing';
    engine.showToast(`Iniciando Fase ${this.currentLevelNum}!`, 2000);
    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.focus();
  }

  pauseGame() {
    this.state = 'paused';
    this.showScreen('screen-pause');
  }

  resumeGame() {
    this.hideAllScreens();
    this.state = 'playing';
    const canvas = document.getElementById('gameCanvas');
    if (canvas) canvas.focus();
  }

  triggerLevelClear() {
    if (this.state !== 'playing') return;
    this.state = 'level_clear';
    audio.playPortal();

    // Desbloqueia próximo nível
    if (this.currentLevelNum >= this.maxUnlockedLevel && this.maxUnlockedLevel < 8) {
      this.maxUnlockedLevel = this.currentLevelNum + 1;
      this.saveProgress();
    }

    // Calcula estatísticas
    const duration = Math.floor((Date.now() - this.levelStartTime) / 1000);
    const mins = String(Math.floor(duration / 60)).padStart(2, '0');
    const secs = String(duration % 60).padStart(2, '0');
    const slimesInLevel = this.player.slimesKilled - this.levelSlimesStart;
    const bonus = 1000 + (this.currentLevelNum * 250);
    this.player.score += bonus;

    document.getElementById('clear-level-title').innerText = `${this.currentLevel.name} Superada!`;
    document.getElementById('clear-slimes').innerText = `${slimesInLevel}`;
    document.getElementById('clear-time').innerText = `${mins}:${secs}`;
    document.getElementById('clear-score').innerText = `+${bonus}`;

    const nextBtn = document.getElementById('btn-next-level');
    if (this.currentLevelNum === 8) {
      nextBtn.innerText = 'VER VITÓRIA FINAL 🏆';
    } else {
      nextBtn.innerText = 'PRÓXIMA FASE ➔';
    }

    this.showScreen('screen-level-clear');
  }

  triggerGameOver(reason) {
    this.state = 'game_over';
    document.getElementById('game-over-reason').innerText = reason;
    this.showScreen('screen-game-over');
  }

  triggerGameVictory() {
    this.state = 'victory';
    audio.playPortal();

    const statsContainer = document.getElementById('victory-final-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-box">
          <span class="stat-icon">💀</span>
          <span class="stat-value">${this.player.slimesKilled}</span>
          <span class="stat-label">GOSMAS DESTRUÍDAS</span>
        </div>
        <div class="stat-box">
          <span class="stat-icon">⚡</span>
          <span class="stat-value">${this.player.score}</span>
          <span class="stat-label">PONTUAÇÃO TOTAL</span>
        </div>
      `;
    }

    this.showScreen('screen-victory');
  }

  // ==========================================
  // ATUALIZAÇÃO DO HUD EM TEMPO REAL
  // ==========================================
  updateHud() {
    const healthPercent = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
    document.getElementById('health-fill').style.width = `${healthPercent}%`;
    document.getElementById('health-ghost').style.width = `${healthPercent}%`;
    document.getElementById('health-text').innerText = `${Math.ceil(this.player.health)}/${this.player.maxHealth}`;

    const energyPercent = Math.max(0, (this.player.energy / this.player.maxEnergy) * 100);
    document.getElementById('bionic-fill').style.width = `${energyPercent}%`;

    let statusText = 'SOCO PRONTO';
    if (this.player.energy >= 80) statusText = 'SLAM PRONTO! 💥';
    else if (this.player.energy >= 25) statusText = 'FOGUETE PRONTO 🚀';
    document.getElementById('bionic-text').innerText = statusText;

    const remainingSlimes = this.currentEnemies ? this.currentEnemies.filter(e => e.alive).length : 0;
    const hudSlimesCount = document.getElementById('hud-slimes-count');
    if (hudSlimesCount) {
      hudSlimesCount.innerText = remainingSlimes;
      hudSlimesCount.style.color = remainingSlimes === 0 ? '#00ff88' : '#ff0055';
    }
    const hudSlimesLabel = document.getElementById('hud-slimes-label');
    if (hudSlimesLabel) {
      hudSlimesLabel.innerText = remainingSlimes === 0 ? 'DESIMPEDIDO' : 'RESTANTES';
      hudSlimesLabel.style.color = remainingSlimes === 0 ? '#00ff88' : '#94a3b8';
    }

    document.getElementById('hud-score').innerText = this.player.score;

    // Atributos de coordenadas para testes e debug
    const hud = document.getElementById('hud');
    if (hud) {
      hud.setAttribute('data-player-x', Math.round(this.player.x));
      hud.setAttribute('data-player-y', Math.round(this.player.y));
    }
  }

  // ==========================================
  // LOOP PRINCIPAL DE FÍSICA E ATUALIZAÇÕES
  // ==========================================
  update() {
    // 1. Atualiza entradas (teclado, gamepad, mouse) em todos os frames!
    engine.input.update();

    if (this.state !== 'playing') {
      engine.input.clearJustPressed();
      return;
    }

    // 2. Atualiza jogador
    this.player.update(engine.input, this.currentLevel);

    // Checa perigos de cenário (poças de gosma negra / maré)
    if (this.currentLevel.checkHazardCollision(this.player.x, this.player.y, this.player.width, this.player.height)) {
      this.player.takeDamage(35, 0, -8);
    }

    // Atualiza Maré Negra na Fase 7
    if (this.currentLevel.risingTide) {
      this.currentLevel.tideY -= this.currentLevel.tideSpeed;
      if (Math.random() < 0.2) {
        particles.createSlimeSplatter(
          this.player.x + (Math.random() * 200 - 100),
          this.currentLevel.tideY,
          2,
          '#080310'
        );
      }
    }

    // 1. COMBATE: SOCO BIÔNICO VS GOSMAS PRETAS
    if (this.player.punchHitbox) {
      const hb = this.player.punchHitbox;
      for (const enemy of this.currentEnemies) {
        if (!enemy.alive) continue;
        if (
          hb.x < enemy.x + enemy.width &&
          hb.x + hb.width > enemy.x &&
          hb.y < enemy.y + enemy.height &&
          hb.y + hb.height > enemy.y
        ) {
          enemy.takeDamage(hb.damage, this.player.facing * hb.knockback, -3);
          // Recarrega um pouco de energia cibernética por acerto!
          this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 12);
        }
      }
    }

    // 2. COMBATE: BRAÇO FOGUETE (ROCKET FIST) VS GOSMAS PRETAS
    if (this.player.rocketFist) {
      const rf = this.player.rocketFist;
      for (const enemy of this.currentEnemies) {
        if (!enemy.alive || rf.hitTargets.has(enemy)) continue;
        if (
          rf.x < enemy.x + enemy.width &&
          rf.x + rf.width > enemy.x &&
          rf.y < enemy.y + enemy.height &&
          rf.y + rf.height > enemy.y
        ) {
          rf.hitTargets.add(enemy);
          audio.playRocketHit();
          enemy.takeDamage(rf.damage, (rf.vx > 0 ? 9 : -9), -4);
          particles.createSparks(rf.x, rf.y, 12, '#ffaa00');
          rf.returning = true; // Retorna após acertar
        }
      }
    }

    // 3. COMBATE: DISPAROS DE LONGO ALCANCE (PLASMA BLASTER) VS GOSMAS PRETAS
    for (let bi = this.player.bullets.length - 1; bi >= 0; bi--) {
      const b = this.player.bullets[bi];
      let hit = false;
      for (const enemy of this.currentEnemies) {
        if (!enemy.alive) continue;
        if (
          b.x >= enemy.x &&
          b.x <= enemy.x + enemy.width &&
          b.y >= enemy.y &&
          b.y <= enemy.y + enemy.height
        ) {
          enemy.takeDamage(b.damage, b.vx * 0.25, -2.5);
          particles.createSparks(b.x, b.y, 8, '#00f0ff');
          hit = true;
          break;
        }
      }
      if (hit) {
        this.player.bullets.splice(bi, 1);
      }
    }

    // Atualiza todos os inimigos
    for (let i = this.currentEnemies.length - 1; i >= 0; i--) {
      const enemy = this.currentEnemies[i];
      if (!enemy.alive) {
        this.currentEnemies.splice(i, 1);
        continue;
      }
      enemy.update(this.player, this.currentLevel);
    }

    // Atualiza partículas e textos flutuantes
    particles.update();

    // Atualiza câmera
    engine.camera.update(this.player, this.currentLevel);

    // 4. VERIFICAÇÃO DE TODAS AS GOSMAS DERROTADAS PARA LIBERAR O PORTAL
    const portal = this.currentLevel.portal;
    const remainingSlimes = this.currentEnemies.filter(e => e.alive).length;

    if (remainingSlimes === 0 && !this.currentLevel.allSlimesKilled) {
      this.currentLevel.allSlimesKilled = true;
      audio.playPortalUnlock();
      particles.createShockwave(portal.x + portal.width / 2, portal.y + portal.height / 2, 220, '#00f0ff');
      particles.createSparks(portal.x + portal.width / 2, portal.y + portal.height / 2, 35, '#00f0ff');
      engine.showToast('✨ TODAS AS GOSMAS DERROTADAS! O PORTAL SE ABRIU! ✨', 3500);
    }

    // Condição de Conclusão de Fase: Alcance do Portal ABERTO!
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;
    if (
      px >= portal.x &&
      px <= portal.x + portal.width &&
      py >= portal.y &&
      py <= portal.y + portal.height
    ) {
      if (this.currentLevel.allSlimesKilled) {
        this.triggerLevelClear();
      } else {
        // Portal bloqueado: avisa o jogador que precisa matar todas as gosmas
        if (this.player.vx > 0) this.player.vx = -3;
        else if (this.player.vx < 0) this.player.vx = 3;
        particles.createSparks(px, py, 4, '#ff0055');
        if (!this.portalWarnTimer || Date.now() - this.portalWarnTimer > 1800) {
          this.portalWarnTimer = Date.now();
          engine.showToast(`🔒 Portal Selado! Derrote todas as gosmas da fase! (Restam: ${remainingSlimes})`, 1800);
        }
      }
    }

    this.updateHud();
    engine.input.clearJustPressed();
  }

  // ==========================================
  // RENDERIZAÇÃO GERAL DO JOGO
  // ==========================================
  render() {
    const ctx = engine.ctx;

    // Se estiver em jogo ativo ou pausado
    if (this.currentLevel) {
      // 1. Céu e Camadas de Fundo Parallax
      this.currentLevel.renderBackground(ctx, engine.camera);

      // 2. Translação pelo espaço da Câmera
      engine.camera.apply(ctx);

      // 3. Blocos e Perigos do Nível
      this.currentLevel.renderTiles(ctx, engine.camera);

      // 4. Inimigos (Gosmas Pretas)
      for (const enemy of this.currentEnemies) {
        enemy.render(ctx);
      }

      // 5. Jogador (Lobo de Máscara Branca)
      this.player.render(ctx);

      // 6. Partículas, Ondas de Choque e Textos de Dano
      particles.render(ctx);

      engine.camera.restore(ctx);
    } else {
      // CENÁRIO ANIMADO DO MENU PRINCIPAL
      this.renderMenuBackground(ctx);
    }
  }

  // Fundo animado de alta classe para o Menu Principal
  renderMenuBackground(ctx) {
    const time = Date.now() * 0.002;

    // Gradiente do Céu Noturno
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 540);
    skyGrad.addColorStop(0, '#04060c');
    skyGrad.addColorStop(0.6, '#0c1222');
    skyGrad.addColorStop(1, '#1a102f');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 540);

    // Lua Cibernética Gigante
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(680, 180, 90, 0, Math.PI * 2);
    ctx.fill();

    // Crânio/Sombra na Lua
    ctx.fillStyle = 'rgba(12, 18, 34, 0.25)';
    ctx.beginPath();
    ctx.arc(660, 160, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Silhueta de Montanhas e Ruínas Góticas
    ctx.fillStyle = '#080a14';
    ctx.beginPath();
    ctx.moveTo(0, 540);
    ctx.lineTo(0, 360);
    ctx.lineTo(160, 310);
    ctx.lineTo(340, 380);
    ctx.lineTo(520, 290);
    ctx.lineTo(720, 350);
    ctx.lineTo(960, 320);
    ctx.lineTo(960, 540);
    ctx.closePath();
    ctx.fill();

    // Penhasco em Primeiro Plano
    ctx.fillStyle = '#05060a';
    ctx.beginPath();
    ctx.moveTo(0, 540);
    ctx.lineTo(0, 400);
    ctx.lineTo(300, 380);
    ctx.lineTo(440, 470);
    ctx.lineTo(540, 540);
    ctx.closePath();
    ctx.fill();

    // O Lobo de Máscara Branca observando do topo do penhasco
    ctx.save();
    ctx.translate(220, 380);
    ctx.scale(1.2, 1.2);

    // Corpo do Lobo
    ctx.fillStyle = '#0a0a0f';
    ctx.beginPath();
    ctx.roundRect(-10, -26, 20, 26, 4);
    ctx.fill();

    // Cauda balançando
    ctx.save();
    ctx.translate(-8, -6);
    ctx.rotate(Math.sin(time * 2) * 0.15 - 0.2);
    ctx.fillStyle = '#0a0a0f';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-18, -4, -26, 14);
    ctx.quadraticCurveTo(-14, 22, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Cabeça
    ctx.fillStyle = '#0a0a0f';
    ctx.beginPath();
    ctx.roundRect(-6, -42, 18, 16, 4);
    ctx.fill();

    // Orelhas
    ctx.beginPath();
    ctx.moveTo(-4, -42);
    ctx.lineTo(-2, -54);
    ctx.lineTo(2, -42);
    ctx.moveTo(4, -42);
    ctx.lineTo(7, -55);
    ctx.lineTo(11, -42);
    ctx.fill();

    // Máscara Branca Marcante
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(2, -41);
    ctx.lineTo(16, -38);
    ctx.lineTo(19, -32);
    ctx.lineTo(14, -28);
    ctx.lineTo(2, -28);
    ctx.closePath();
    ctx.fill();

    // Olho Ciano Brilhante
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(8, -35, 2, 0, Math.PI * 2);
    ctx.fill();

    // Braço Biônico Pulsante
    ctx.fillStyle = '#64748b';
    ctx.fillRect(4, -24, 14, 6);
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(8, -23, 8, 3);
    ctx.restore();

    // Névoa sombria de gosma se arrastando no vale
    ctx.save();
    const fogGrad = ctx.createLinearGradient(0, 460, 0, 540);
    fogGrad.addColorStop(0, 'transparent');
    fogGrad.addColorStop(1, 'rgba(8, 4, 18, 0.85)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 460, 960, 80);

    // Olhos vermelhos assustadores de gosmas à espreita no escuro
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 5; i++) {
      const ex = 550 + i * 80 + Math.sin(time + i) * 15;
      const ey = 480 + (i % 3) * 16;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
      ctx.arc(ex + 8, ey, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  gameLoop(timestamp) {
    this.update();
    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Inicializa o jogo quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', () => {
  const game = new GameManager();
  window.game = game;
});
