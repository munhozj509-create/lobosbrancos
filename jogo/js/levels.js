/**
 * AS 8 FASES DO JOGO - DESIGN PROGRESSIVO DE DIFICULDADE
 * Cada nível possui layout único de plataformas, perigos, poças de piche,
 * tipos de gosmas pretas e narrativa própria.
 */

class LevelData {
  constructor(id, name, desc, width, height, theme, storyText) {
    this.id = id;
    this.name = name;
    this.desc = desc;
    this.width = width;
    this.height = height;
    this.theme = theme;
    this.storyText = storyText;
    this.tileSize = 32;
    this.pixelWidth = width * this.tileSize;
    this.pixelHeight = height * this.tileSize;

    this.tiles = [];
    this.hazards = []; // Poças de piche / espinhos
    this.spawnPoint = { x: 64, y: 300 };
    this.portal = { x: this.pixelWidth - 100, y: 300, width: 36, height: 56 };
    this.enemySpawns = [];
    this.risingTide = false; // Se a Maré Negra sobe continuamente (Fase 7)
    this.tideY = this.pixelHeight;
    this.tideSpeed = 0.55;
    this.allSlimesKilled = false; // Só abre o portal quando todas as gosmas forem eliminadas!
  }

  // Checa colisão com blocos sólidos com epsilon de precisão
  checkTileCollision(x, y, w, h) {
    const eps = 0.08;
    const startCol = Math.floor((x + eps) / this.tileSize);
    const endCol = Math.floor((x + w - eps) / this.tileSize);
    const startRow = Math.floor((y + eps) / this.tileSize);
    const endRow = Math.floor((y + h - eps) / this.tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) {
          // Paredes invisíveis nas bordas laterais
          if (c < 0 || c >= this.width) {
            return { tileX: c, tileY: r };
          }
          continue;
        }
        if (this.tiles[r] && this.tiles[r][c] === 1) {
          return { tileX: c, tileY: r };
        }
      }
    }
    return null;
  }

  // Checa colisão com perigos (poças de gosma preta ácida / espinhos)
  checkHazardCollision(x, y, w, h) {
    // 1. Poças estáticas
    for (const hz of this.hazards) {
      if (
        x < hz.x + hz.w &&
        x + w > hz.x &&
        y < hz.y + hz.h &&
        y + h > hz.y
      ) {
        return true;
      }
    }

    // 2. Maré Negra subindo (Fase 7)
    if (this.risingTide && (y + h) >= this.tideY) {
      return true;
    }

    return false;
  }

  renderBackground(ctx, camera) {
    const t = this.theme;

    // 1. Gradiente de Céu / Atmosfera
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 540);
    skyGrad.addColorStop(0, t.skyTop);
    skyGrad.addColorStop(1, t.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 960, 540);

    // 2. Lua / Sol Carmesim Distante
    ctx.save();
    ctx.fillStyle = t.moonColor || '#e2e8f0';
    ctx.shadowColor = t.moonGlow || 'rgba(0, 240, 255, 0.4)';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(760 - camera.x * 0.03, 110, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Camada Parallax 1 (Montanhas / Ruínas Distantes)
    ctx.fillStyle = t.farColor;
    ctx.beginPath();
    ctx.moveTo(0, 540);
    const step = 80;
    for (let x = 0; x <= 960; x += step) {
      const worldX = x + camera.x * 0.15;
      const heightVar = Math.sin(worldX * 0.008) * 45 + Math.cos(worldX * 0.02) * 25;
      ctx.lineTo(x, 340 - heightVar);
    }
    ctx.lineTo(960, 540);
    ctx.closePath();
    ctx.fill();

    // 4. Camada Parallax 2 (Pilares Góticos / Fábricas Silhuetadas)
    ctx.fillStyle = t.midColor;
    for (let i = 0; i < 15; i++) {
      const px = (i * 180) - (camera.x * 0.35) % (15 * 180);
      ctx.fillRect(px, 260, 38, 280);
      // Arcos
      ctx.beginPath();
      ctx.arc(px + 19, 260, 19, Math.PI, 0);
      ctx.fill();
    }
  }

  renderTiles(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / this.tileSize));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + 960) / this.tileSize));
    const startRow = Math.max(0, Math.floor(camera.y / this.tileSize));
    const endRow = Math.min(this.height - 1, Math.ceil((camera.y + 540) / this.tileSize));

    const t = this.theme;

    // Desenha Blocos Sólidos
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (this.tiles[r] && this.tiles[r][c] === 1) {
          const bx = c * this.tileSize;
          const by = r * this.tileSize;

          // Bloco com textura e bordas neon
          ctx.fillStyle = t.tileBg;
          ctx.fillRect(bx, by, this.tileSize, this.tileSize);

          // Borda superior iluminada
          ctx.fillStyle = t.tileTop;
          ctx.fillRect(bx, by, this.tileSize, 3);

          // Detalhes de tijolos cibernéticos / ranhuras
          ctx.strokeStyle = t.tileGrout;
          ctx.lineWidth = 1;
          ctx.strokeRect(bx + 2, by + 2, this.tileSize - 4, this.tileSize - 4);
        }
      }
    }

    // Desenha Perigos (Poças de Gosma Preta / Piche no chão)
    for (const hz of this.hazards) {
      if (
        hz.x + hz.w > camera.x &&
        hz.x < camera.x + 960 &&
        hz.y + hz.h > camera.y &&
        hz.y < camera.y + 540
      ) {
        ctx.save();
        ctx.fillStyle = '#080510';
        ctx.fillRect(hz.x, hz.y, hz.w, hz.h);

        // Bolhas de gosma fervente
        ctx.fillStyle = '#3c096c';
        const time = Date.now() * 0.003;
        for (let b = 0; b < hz.w; b += 16) {
          const bubbleY = hz.y + Math.sin(time + b) * 3;
          ctx.beginPath();
          ctx.arc(hz.x + b + 8, bubbleY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // Renderiza Portal de Conclusão da Fase
    this.renderPortal(ctx);

    // Se houver Maré Negra Subindo (Fase 7)
    if (this.risingTide) {
      this.renderRisingTide(ctx, camera);
    }
  }

  renderPortal(ctx) {
    const p = this.portal;
    const time = Date.now() * 0.004;

    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

    if (this.allSlimesKilled) {
      // PORTAL DESBLOQUEADO (Vórtice Ciano Radiante)
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.width / 2 + Math.sin(time) * 3, p.height / 2, time, 0, Math.PI * 2);
      ctx.stroke();

      // Vórtice interior
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, p.width / 2);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#00f0ff');
      grad.addColorStop(1, '#002b4d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.width / 2 - 4, p.height / 2 - 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glifos
      ctx.fillStyle = '#00f0ff';
      ctx.font = "bold 9px 'Orbitron', monospace";
      ctx.textAlign = 'center';
      ctx.fillText('PORTAL ABERTO!', 0, -p.height / 2 - 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 8px 'Orbitron', monospace";
      ctx.fillText('ENTRE!', 0, p.height / 2 + 14);
    } else {
      // PORTAL SELADO (Vermelho/Sombrio com Correntes de Energia)
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Interior sombrio
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, p.width / 2);
      grad.addColorStop(0, '#3a0012');
      grad.addColorStop(0.7, '#150006');
      grad.addColorStop(1, '#050002');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.width / 2 - 2, p.height / 2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cruz / X de correntes de selamento
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -14);
      ctx.lineTo(10, 14);
      ctx.moveTo(10, -14);
      ctx.lineTo(-10, 14);
      ctx.stroke();

      // Texto de aviso
      ctx.fillStyle = '#ff0055';
      ctx.font = "bold 9px 'Orbitron', monospace";
      ctx.textAlign = 'center';
      ctx.fillText('🔒 SELADO', 0, -p.height / 2 - 8);
      ctx.fillStyle = '#ff99aa';
      ctx.font = "7px 'Orbitron', monospace";
      ctx.fillText('Mate as gosmas!', 0, p.height / 2 + 14);
    }

    ctx.restore();
  }

  renderRisingTide(ctx, camera) {
    const time = Date.now() * 0.003;
    const waveY = this.tideY;

    ctx.save();
    // Onda de gosma preta com gradiente púrpura profundo
    const grad = ctx.createLinearGradient(0, waveY, 0, this.pixelHeight);
    grad.addColorStop(0, 'rgba(10, 5, 20, 0.95)');
    grad.addColorStop(0.3, '#100522');
    grad.addColorStop(1, '#040108');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(camera.x, waveY);
    for (let x = camera.x; x <= camera.x + 960; x += 20) {
      const yWave = waveY + Math.sin(time * 2 + x * 0.02) * 8;
      ctx.lineTo(x, yWave);
    }
    ctx.lineTo(camera.x + 960, this.pixelHeight);
    ctx.lineTo(camera.x, this.pixelHeight);
    ctx.closePath();
    ctx.fill();

    // Olhos e tentáculos assustadores na maré
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 10;
    for (let x = camera.x + 40; x <= camera.x + 920; x += 140) {
      const eyeY = waveY + 20 + Math.sin(time + x) * 6;
      ctx.beginPath();
      ctx.arc(x, eyeY, 3, 0, Math.PI * 2);
      ctx.arc(x + 10, eyeY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ============================================================================
// CONSTRUTOR DAS 8 FASES COM DIFICULDADE PROGRESSIVA
// ============================================================================
class LevelManager {
  static getLevel(levelNumber) {
    switch (levelNumber) {
      // ----------------------------------------------------
      // FASE 1: AS RUÍNAS DO SANTUÁRIO (TUTORIAL & INTRODUÇÃO)
      // ----------------------------------------------------
      case 1: {
        const lvl = new LevelData(
          1,
          "As Ruínas do Santuário",
          "O despertar sob a luz do luar. Aprenda os socos do Braço Biônico e fuja das primeiras gosmas.",
          45, 17,
          {
            skyTop: '#05070d', skyBottom: '#101626',
            farColor: '#0a0f1d', midColor: '#131b2e',
            tileBg: '#1e293b', tileTop: '#00f0ff', tileGrout: '#334155',
            moonColor: '#ffffff', moonGlow: 'rgba(0, 240, 255, 0.4)'
          },
          "Eu sou o Lobo de Máscara Branca. As ruínas sagradas foram invadidas por abominações de piche negro. Meu braço biônico está ativo. Preciso abrir caminho até o portal!"
        );

        // Constrói mapa de blocos
        lvl.tiles = Array.from({ length: lvl.height }, () => Array(lvl.width).fill(0));

        // Chão contínuo
        for (let c = 0; c < lvl.width; c++) {
          lvl.tiles[14][c] = 1;
          lvl.tiles[15][c] = 1;
          lvl.tiles[16][c] = 1;
        }

        // Plataformas de treino para pulo
        for (let c = 10; c <= 15; c++) lvl.tiles[11][c] = 1;
        for (let c = 20; c <= 25; c++) lvl.tiles[9][c] = 1;
        for (let c = 30; c <= 35; c++) lvl.tiles[11][c] = 1;

        // Paredes nos cantos
        for (let r = 0; r < 14; r++) {
          lvl.tiles[r][0] = 1;
          lvl.tiles[r][lvl.width - 1] = 1;
        }

        lvl.spawnPoint = { x: 80, y: 380 };
        lvl.portal = { x: 38 * 32, y: 12 * 32, width: 36, height: 56 };

        // Gosmas rastejantes fáceis
        lvl.enemySpawns = [
          { type: 'crawler', x: 12 * 32, y: 10 * 32 },
          { type: 'crawler', x: 18 * 32, y: 13 * 32 },
          { type: 'crawler', x: 23 * 32, y: 8 * 32 },
          { type: 'crawler', x: 33 * 32, y: 10 * 32 }
        ];

        return lvl;
      }

      // ----------------------------------------------------
      // FASE 2: CAVERNAS DE PICHE FERVENTE (POÇAS ÁCIDAS & CUSPIDORAS)
      // ----------------------------------------------------
      case 2: {
        const lvl = new LevelData(
          2,
          "Cavernas de Piche Fervente",
          "O chão se abre em poças negras fatais. Inimigos que cospem projéteis tóxicos surgem nas sombras.",
          50, 17,
          {
            skyTop: '#0a0505', skyBottom: '#220e14',
            farColor: '#18080a', midColor: '#2b1016',
            tileBg: '#2d1b22', tileTop: '#ff0055', tileGrout: '#4a2833',
            moonColor: '#ff0055', moonGlow: 'rgba(255, 0, 85, 0.4)'
          },
          "O calor do piche é insuportável. Ficar no chão é morte certa! Usarei o Disparo de Foguete do braço biônico para eliminar as gosmas cuspidoras de longe."
        );

        lvl.tiles = Array.from({ length: lvl.height }, () => Array(lvl.width).fill(0));

        // Chão com buracos de piche
        for (let c = 0; c < lvl.width; c++) {
          if ((c >= 12 && c <= 16) || (c >= 25 && c <= 29) || (c >= 37 && c <= 41)) {
            // Poça de gosma ácida no buraco
            lvl.hazards.push({ x: c * 32, y: 15 * 32, w: 32, h: 64 });
          } else {
            lvl.tiles[14][c] = 1;
            lvl.tiles[15][c] = 1;
            lvl.tiles[16][c] = 1;
          }
        }

        // Plataformas de salto sobre os buracos
        for (let c = 13; c <= 15; c++) lvl.tiles[11][c] = 1;
        for (let c = 26; c <= 28; c++) lvl.tiles[10][c] = 1;
        for (let c = 38; c <= 40; c++) lvl.tiles[11][c] = 1;

        // Paredes
        for (let r = 0; r < 14; r++) {
          lvl.tiles[r][0] = 1;
          lvl.tiles[r][lvl.width - 1] = 1;
        }

        lvl.spawnPoint = { x: 80, y: 380 };
        lvl.portal = { x: 44 * 32, y: 12 * 32, width: 36, height: 56 };

        lvl.enemySpawns = [
          { type: 'crawler', x: 8 * 32, y: 13 * 32 },
          { type: 'spitter', x: 19 * 32, y: 13 * 32 },
          { type: 'crawler', x: 22 * 32, y: 13 * 32 },
          { type: 'spitter', x: 33 * 32, y: 13 * 32 },
          { type: 'crawler', x: 42 * 32, y: 13 * 32 }
        ];

        return lvl;
      }

      // ----------------------------------------------------
      // FASE 3: O PÂNTANO SOMBRIO (INIMIGOS AÉREOS & MORCEGOS GOSMENTOS)
      // ----------------------------------------------------
      case 3: {
        const lvl = new LevelData(
          3,
          "O Pântano Sombrio",
          "Criaturas aladas de gosma preta caem dos céus. O ar está denso e carregado de veneno.",
          55, 18,
          {
            skyTop: '#030d07', skyBottom: '#0d2818',
            farColor: '#07180e', midColor: '#133522',
            tileBg: '#1e382b', tileTop: '#00ff88', tileGrout: '#2d5a42',
            moonColor: '#00ff88', moonGlow: 'rgba(0, 255, 136, 0.4)'
          },
          "Criaturas com asas de piche estão vigiando os céus! Preciso usar o pulo duplo e antecipar seus ataques de mergulho com socos no tempo certo."
        );

        lvl.tiles = Array.from({ length: lvl.height }, () => Array(lvl.width).fill(0));

        // Chão pantanoso com múltiplos pilares
        for (let c = 0; c < lvl.width; c++) {
          if (c % 7 === 0 || c % 7 === 1) {
            lvl.hazards.push({ x: c * 32, y: 16 * 32, w: 32, h: 64 });
          } else {
            lvl.tiles[15][c] = 1;
            lvl.tiles[16][c] = 1;
            lvl.tiles[17][c] = 1;
          }
        }

        // Ilhas elevadas
        for (let c = 8; c <= 12; c++) lvl.tiles[11][c] = 1;
        for (let c = 18; c <= 22; c++) lvl.tiles[8][c] = 1;
        for (let c = 28; c <= 33; c++) lvl.tiles[10][c] = 1;
        for (let c = 38; c <= 43; c++) lvl.tiles[7][c] = 1;
        for (let c = 46; c <= 50; c++) lvl.tiles[11][c] = 1;

        for (let r = 0; r < 15; r++) {
          lvl.tiles[r][0] = 1;
          lvl.tiles[r][lvl.width - 1] = 1;
        }

        lvl.spawnPoint = { x: 80, y: 400 };
        lvl.portal = { x: 49 * 32, y: 9 * 32, width: 36, height: 56 };

        lvl.enemySpawns = [
          { type: 'flying', x: 10 * 32, y: 6 * 32 },
          { type: 'spitter', x: 20 * 32, y: 7 * 32 },
          { type: 'flying', x: 25 * 32, y: 5 * 32 },
          { type: 'crawler', x: 30 * 32, y: 9 * 32 },
          { type: 'flying', x: 40 * 32, y: 4 * 32 },
          { type: 'spitter', x: 48 * 32, y: 10 * 32 }
        ];

        return lvl;
      }

      // ----------------------------------------------------
      // FASE 4: FÁBRICA CIBERNÉTICA ABANDONADA (GOSMAS COM ESPINHOS)
      // ----------------------------------------------------
      case 4: {
        const lvl = new LevelData(
          4,
          "Fábrica Cibernética Abandonada",
          "Gosmas endurecidas com carapaças de espinhos de obsidiana. Ataques normais são repelidos!",
          58, 18,
          {
            skyTop: '#080914', skyBottom: '#181b36',
            farColor: '#101228', midColor: '#1e2246',
            tileBg: '#252a54', tileTop: '#ffaa00', tileGrout: '#3b4382',
            moonColor: '#ffaa00', moonGlow: 'rgba(255, 170, 0, 0.4)'
          },
          "As gosmas aqui absorveram metal e blindagem! Socos comuns causam pouco efeito em sua couraça espinhosa. Devo usar o Disparo Foguete ou o Impacto Sísmico para despedaçá-las!"
        );

        lvl.tiles = Array.from({ length: lvl.height }, () => Array(lvl.width).fill(0));

        for (let c = 0; c < lvl.width; c++) {
          lvl.tiles[15][c] = 1;
          lvl.tiles[16][c] = 1;
          lvl.tiles[17][c] = 1;
        }

        // Estruturas de fábrica em vários andares
        for (let c = 10; c <= 18; c++) lvl.tiles[11][c] = 1;
        for (let c = 22; c <= 30; c++) lvl.tiles[8][c] = 1;
        for (let c = 34; c <= 42; c++) lvl.tiles[11][c] = 1;
        for (let c = 45; c <= 53; c++) lvl.tiles[7][c] = 1;

        // Paredes internas para wall jump
        for (let r = 8; r <= 15; r++) lvl.tiles[r][32] = 1;

        for (let r = 0; r < 15; r++) {
          lvl.tiles[r][0] = 1;
          lvl.tiles[r][lvl.width - 1] = 1;
        }

        lvl.spawnPoint = { x: 80, y: 400 };
        lvl.portal = { x: 50 * 32, y: 5 * 32, width: 36, height: 56 };

        lvl.enemySpawns = [
          { type: 'spike', x: 14 * 32, y: 10 * 32 },
          { type: 'spitter', x: 25 * 32, y: 7 * 32 },
          { type: 'spike', x: 38 * 32, y: 10 * 32 },
          { type: 'flying', x: 42 * 32, y: 5 * 32 },
          { type: 'spike', x: 48 * 32, y: 6 * 32 }
        ];

        return lvl;
      }

      // ----------------------------------------------------
      // FASE 5: A FLORESTA DAS SOMBRAS MORTAIS (STALKERS VELOZES)
      // ----------------------------------------------------
      case 5: {
        const lvl = new LevelData(
          5,
          "A Floresta das Sombras Mortais",
          "Predadores negros ágeis que atacam na velocidade de um raio. Reação rápida e Turbo Dash são vitais.",
          60, 18,
          {
            skyTop: '#100018', skyBottom: '#2d0042',
            farColor: '#1f002d', midColor: '#3a0054',
            tileBg: '#340049', tileTop: '#ff007f', tileGrout: '#5a007d',
            moonColor: '#ff007f', moonGlow: 'rgba(255, 0, 127, 0.4)'
          },
          "Essas sombras movem-se com a velocidade de espectros! Seus botes são mortais. Devo usar o Turbo Dash para me esquivar no instante exato do ataque!"
        );

        lvl.tiles = Array.from({ length: lvl.height }, () => Array(lvl.width).fill(0));

        // Terreno com altos e baixos e abismos
        for (let c = 0; c < lvl.width; c++) {
          if ((c >= 18 && c <= 21) || (c >= 35 && c <= 38)) {
            lvl.hazards.push({ x: c * 32, y: 16 * 32, w: 32, h: 64 });
          } else {
            lvl.tiles[15][c] = 1;
            lvl.tiles[16][c] = 1;
            lvl.tiles[17][c] = 1;
          }
        }

        for (let c = 8; c <= 14; c++) lvl.tiles[11][c] = 1;
        for (let c = 19; c <= 25; c++) lvl.tiles[9][c] = 1;
        for (let c = 28; c <= 33; c++) lvl.tiles[6][c] = 1;
        for (let c = 40; c <= 46; c++) lvl.tiles[10][c] = 1;
        for (let c = 49; c <= 55; c++) lvl.tiles[7][c] = 1;

        for (let r = 0; r < 15; r++) {
          lvl.tiles[r][0] = 1;
          lvl.tiles[r][lvl.width - 1] = 1;
        }

        lvl.spawnPoint = { x: 80, y: 400 };
        lvl.portal = { x: 53 * 32, y: 5 * 32, width: 36, height: 56 };

        lvl.enemySpawns = [
          { type: 'stalker', x: 12 * 32, y: 10 * 32 },
          { type: 'flying', x: 21 * 32, y: 5 * 32 },
          { type: 'stalker', x: 30 * 32, y: 5 * 32 },
          { type: 'spitter', x: 42 * 32, y: 9 * 32 },
          { type: 'stalker', x: 51 * 32, y: 6 * 32 },
          { type: 'spike', x: 26 * 32, y: 14 * 32 }
        ];

        return lvl;
      }

      // ----------------------------------------------------
      // FASE 6: LABORATÓRIO DO VAZIO (TITÃS DIVISORES)
      // ----------------------------------------------------
      case 6: {
        const lvl = new LevelData(
          6,
          "Laboratório do Vazio",
          "Gosmas gigantescas que ao serem atingidas dividem-se em cópias menores e mais furiosas!",
          64, 18,
          {
            skyTop: '#001018', skyBottom: '#00293d',
            farColor: '#001a26', midColor: '#003752',
            tileBg: '#0f3a4e', tileTop: '#00f0ff', tileGrout: '#1b5b7a',
            moonColor: '#00f0ff', moonGlow: 'rgba(0, 240, 255, 0.5)'
          },
          "As gosmas aqui atingiram tamanho colossal! Destruí-las uma vez não basta, elas se multiplicam! Preciso guardar energia para desferir o Impacto Sísmico e aniquilar a horda dividida de uma só vez!"
        );

        lvl.tiles = Array.from({ length: lvl.height }, () => Array(lvl.width).fill(0));

        for (let c = 0; c < lvl.width; c++) {
          lvl.tiles[15][c] = 1;
          lvl.tiles[16][c] = 1;
          lvl.tiles[17][c] = 1;
        }

        // Arenas de contenção
        for (let c = 12; c <= 20; c++) lvl.tiles[10][c] = 1;
        for (let c = 24; c <= 32; c++) lvl.tiles[8][c] = 1;
        for (let c = 36; c <= 44; c++) lvl.tiles[10][c] = 1;
        for (let c = 48; c <= 56; c++) lvl.tiles[7][c] = 1;

        for (let r = 0; r < 15; r++) {
          lvl.tiles[r][0] = 1;
          lvl.tiles[r][lvl.width - 1] = 1;
        }

        lvl.spawnPoint = { x: 80, y: 400 };
        lvl.portal = { x: 58 * 32, y: 13 * 32, width: 36, height: 56 };

        lvl.enemySpawns = [
          { type: 'splitter', x: 16 * 32, y: 8 * 32 },
          { type: 'stalker', x: 28 * 32, y: 6 * 32 },
          { type: 'splitter', x: 40 * 32, y: 8 * 32 },
          { type: 'spike', x: 52 * 32, y: 5 * 32 },
          { type: 'splitter', x: 48 * 32, y: 13 * 32 }
        ];

        return lvl;
      }

      // ----------------------------------------------------
      // FASE 7: A GRANDE ASCENSÃO (FUGA DA MARÉ NEGRA - NÍVEL VERTICAL)
      // ----------------------------------------------------
      case 7: {
        const lvl = new LevelData(
          7,
          "A Grande Ascensão: Fuga da Maré Negra",
          "O abismo se rompeu! Um oceano de gosma preta fervente sobe velozmente engolindo tudo. ESCALE OU MORRA!",
          34, 46, // Nível muito alto (vertical)
          {
            skyTop: '#150005', skyBottom: '#3d0012',
            farColor: '#2b000d', midColor: '#4f0019',
            tileBg: '#3d1624', tileTop: '#ff0055', tileGrout: '#63253b',
            moonColor: '#ff0055', moonGlow: 'rgba(255, 0, 85, 0.6)'
          },
          "O chão colapsou! A Maré Negra está subindo com fúria implacável! Não posso hesitar nem por um segundo: preciso escalar as paredes, saltar entre plataformas e usar o gancho do braço biônico para alcançar o cume!"
        );

        lvl.tiles = Array.from({ length: lvl.height }, () => Array(lvl.width).fill(0));

        // Chão inicial
        for (let c = 0; c < lvl.width; c++) {
          lvl.tiles[44][c] = 1;
          lvl.tiles[45][c] = 1;
        }

        // Paredes laterais para escalada / Wall Jump constante
        for (let r = 0; r < 44; r++) {
          lvl.tiles[r][0] = 1;
          lvl.tiles[r][1] = 1;
          lvl.tiles[r][lvl.width - 2] = 1;
          lvl.tiles[r][lvl.width - 1] = 1;
        }

        // Plataformas escalonadas subindo até o cume
        for (let r = 40; r >= 4; r -= 4) {
          const shift = (r % 8 === 0) ? 6 : 16;
          for (let c = shift; c <= shift + 10; c++) {
            lvl.tiles[r][c] = 1;
          }
        }

        lvl.spawnPoint = { x: 80, y: 42 * 32 };
        lvl.portal = { x: 15 * 32, y: 2 * 32, width: 36, height: 56 };

        // Maré Negra ativada!
        lvl.risingTide = true;
        lvl.tideY = 48 * 32;
        lvl.tideSpeed = 0.45; // Sobe continuamente em direção ao topo com ritmo justo e emocionante

        // Inimigos colocados na subida para atrapalhar a escalada
        lvl.enemySpawns = [
          { type: 'flying', x: 10 * 32, y: 35 * 32 },
          { type: 'spitter', x: 20 * 32, y: 31 * 32 },
          { type: 'stalker', x: 12 * 32, y: 23 * 32 },
          { type: 'flying', x: 18 * 32, y: 18 * 32 },
          { type: 'spike', x: 14 * 32, y: 11 * 32 },
          { type: 'stalker', x: 20 * 32, y: 7 * 32 }
        ];

        return lvl;
      }

      // ----------------------------------------------------
      // FASE 8: O CORAÇÃO DO VAZIO (BATALHA CONTRA O SOBERANO ABISSAL)
      // ----------------------------------------------------
      case 8: {
        const lvl = new LevelData(
          8,
          "O Coração do Vazio",
          "A origem da escuridão. O Soberano Abissal aguarda em seu trono corrompido. Esta é a batalha definitiva!",
          42, 18,
          {
            skyTop: '#020005', skyBottom: '#120021',
            farColor: '#0a0014', midColor: '#1d0038',
            tileBg: '#1f0d36', tileTop: '#00f0ff', tileGrout: '#3f1f69',
            moonColor: '#ff0055', moonGlow: 'rgba(255, 0, 85, 0.8)'
          },
          "Enfim, cheguei ao epicentro do Vazio! O Soberano das Gosmas Pretas ergue-se à minha frente. Não há mais onde fugir... O Braço Biônico foi construído para este exato momento! Pela honra da Máscara Branca, EU O DESTRUIREI!"
        );

        lvl.tiles = Array.from({ length: lvl.height }, () => Array(lvl.width).fill(0));

        // Arena fechada de chefe
        for (let c = 0; c < lvl.width; c++) {
          lvl.tiles[15][c] = 1;
          lvl.tiles[16][c] = 1;
          lvl.tiles[17][c] = 1;
        }

        // Paredes laterais altas
        for (let r = 0; r < 15; r++) {
          lvl.tiles[r][0] = 1;
          lvl.tiles[r][1] = 1;
          lvl.tiles[r][lvl.width - 2] = 1;
          lvl.tiles[r][lvl.width - 1] = 1;
        }

        // Plataformas laterais para manobras contra o chefe
        for (let c = 4; c <= 10; c++) lvl.tiles[10][c] = 1;
        for (let c = lvl.width - 11; c <= lvl.width - 5; c++) lvl.tiles[10][c] = 1;
        for (let c = 14; c <= 26; c++) lvl.tiles[6][c] = 1;

        lvl.spawnPoint = { x: 4 * 32, y: 13 * 32 };
        // Portal inativo até o chefe morrer
        lvl.portal = { x: 20 * 32, y: 4 * 32, width: 36, height: 56 };

        // O GRANDE CHEFE FINAL
        lvl.enemySpawns = [
          { type: 'boss', x: 26 * 32, y: 8 * 32 }
        ];

        return lvl;
      }

      default:
        return LevelManager.getLevel(1);
    }
  }
}
