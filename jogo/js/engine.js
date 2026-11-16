/**
 * ENGINE: GERENCIADOR DE ENTRADAS (TECLADO, MOUSE, TOUCH, GAMEPAD),
 * CÂMERA COM SEGUIDOR SUAVE E TREMOR (SCREEN SHAKE), E LOOP DO JOGO.
 */

// Polyfill para ctx.roundRect (compatibilidade com qualquer versão de navegador)
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'undefined') r = 4;
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    this.beginPath();
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
    return this;
  };
}

class InputManager {
  constructor() {
    this.keys = {};
    this.prevKeys = {};

    // Disparadores discretos (just pressed)
    this.jumpPressed = false;
    this.punchPressed = false;
    this.shootPressed = false;
    this.rocketPressed = false;
    this.dashPressed = false;
    this.slamPressed = false;

    this.mouse = { x: 0, y: 0, isDown: false, rightDown: false };
    this.setupKeyboard();
    this.setupTouch();
    this.setupMouse();
  }

  // Getters em tempo real: leem o estado imediato das teclas sem depender de ordem de frames!
  get left() {
    return !!(this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']);
  }
  set left(val) {
    this._left = val;
  }

  get right() {
    return !!(this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']);
  }
  set right(val) {
    this._right = val;
  }

  get up() {
    return !!(this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']);
  }
  set up(val) {
    this._up = val;
  }

  get down() {
    return !!(this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']);
  }
  set down(val) {
    this._down = val;
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.key) {
        this.keys[e.key.toLowerCase()] = true;
        this.keys[e.key.toUpperCase()] = true;
      }

      // Se houver diálogo ativo na tela, qualquer tecla avança o diálogo
      if (window.game && window.game.state === 'dialog') {
        window.game.advanceDialog();
      }

      // Registro imediato de comandos de ação
      if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W') {
        this.jumpPressed = true;
      }
      if (e.code === 'KeyJ' || e.code === 'KeyZ' || e.key === 'j' || e.key === 'J' || e.key === 'z' || e.key === 'Z') {
        this.punchPressed = true;
      }
      // Tiro de Longo Alcance: Teclas I, U, V, X
      if (e.code === 'KeyI' || e.code === 'KeyU' || e.code === 'KeyV' || e.code === 'KeyX' || e.key === 'i' || e.key === 'u' || e.key === 'v' || e.key === 'x') {
        this.shootPressed = true;
      }
      if (e.code === 'KeyK' || e.key === 'k' || e.key === 'K') {
        this.rocketPressed = true;
      }
      if (e.code === 'KeyL' || e.code === 'KeyC' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'l' || e.key === 'L' || e.key === 'c' || e.key === 'C') {
        this.dashPressed = true;
      }
      if (e.code === 'KeyE' || e.code === 'KeyQ' || e.code === 'KeyF' || e.key === 'e' || e.key === 'E' || e.key === 'q' || e.key === 'Q' || e.key === 'f' || e.key === 'F') {
        this.slamPressed = true;
      }

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      // Atalhos globais
      if (e.code === 'KeyM' || e.key === 'm' || e.key === 'M') {
        if (window.audio) {
          const enabled = window.audio.toggleAudio();
          if (window.engine) {
            window.engine.showToast(enabled ? 'Som Ativado 🔊' : 'Som Mudo 🔇');
          }
        }
      }
      if (e.code === 'Escape') {
        if (window.game && window.game.state === 'playing') {
          window.game.pauseGame();
        } else if (window.game && window.game.state === 'paused') {
          window.game.resumeGame();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.key) {
        this.keys[e.key.toLowerCase()] = false;
        this.keys[e.key.toUpperCase()] = false;
      }
    });
  }

  setupMouse() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    const updateMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    };

    canvas.addEventListener('mousedown', (e) => {
      updateMousePos(e);
      if (window.game && window.game.state === 'dialog') {
        window.game.advanceDialog();
      }
      if (e.button === 0) { // Botão Esquerdo = Disparo de Longo Alcance
        this.shootPressed = true;
      } else if (e.button === 2) { // Botão Direito = Foguete / Gancho
        this.rocketPressed = true;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      updateMousePos(e);
    });
  }

  setupTouch() {
    // Detecta se dispositivo suporta touch
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const touchPanel = document.getElementById('touch-controls');
    if (isTouch && touchPanel) {
      touchPanel.classList.remove('hidden');
    }

    const bindTouch = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onDown();
      }, { passive: false });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        onUp();
      }, { passive: false });
    };

    bindTouch('t-left', () => { this.keys['ArrowLeft'] = true; }, () => { this.keys['ArrowLeft'] = false; });
    bindTouch('t-right', () => { this.keys['ArrowRight'] = true; }, () => { this.keys['ArrowRight'] = false; });
    bindTouch('t-jump', () => { this.jumpPressed = true; }, () => {});
    bindTouch('t-punch', () => { this.punchPressed = true; }, () => {});
    bindTouch('t-rocket', () => { this.rocketPressed = true; }, () => {});
    bindTouch('t-dash', () => { this.dashPressed = true; }, () => {});
    bindTouch('t-slam', () => { this.slamPressed = true; }, () => {});
  }

  isKeyJustPressed(code) {
    return !!this.keys[code] && !this.prevKeys[code];
  }

  update() {
    // Checa Gamepad conectado
    this.pollGamepad();

    // Movimentação contínua (suporta A/D, setas, minúsculas e maiúsculas)
    this.left = !!(this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']);
    this.right = !!(this.keys['KeyD'] || this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']);
    this.up = !!(this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']);
    this.down = !!(this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']);

    // Ações Just Pressed
    if (this.isKeyJustPressed('Space') || this.isKeyJustPressed('KeyW') || this.isKeyJustPressed('ArrowUp') || this.isKeyJustPressed('w') || this.isKeyJustPressed('W')) {
      this.jumpPressed = true;
    }
    if (this.isKeyJustPressed('KeyJ') || this.isKeyJustPressed('KeyZ') || this.isKeyJustPressed('j') || this.isKeyJustPressed('z')) {
      this.punchPressed = true;
    }
    if (this.isKeyJustPressed('KeyK') || this.isKeyJustPressed('KeyX') || this.isKeyJustPressed('k') || this.isKeyJustPressed('x')) {
      this.rocketPressed = true;
    }
    if (this.isKeyJustPressed('KeyL') || this.isKeyJustPressed('KeyC') || this.isKeyJustPressed('l') || this.isKeyJustPressed('c') || this.isKeyJustPressed('ShiftLeft') || this.isKeyJustPressed('ShiftRight')) {
      this.dashPressed = true;
    }
    if (this.isKeyJustPressed('KeyE') || this.isKeyJustPressed('KeyQ') || this.isKeyJustPressed('KeyF') || this.isKeyJustPressed('e') || this.isKeyJustPressed('q') || this.isKeyJustPressed('f')) {
      this.slamPressed = true;
    }

    // Clona keys para comparação do próximo frame
    this.prevKeys = { ...this.keys };
  }

  clearJustPressed() {
    this.jumpPressed = false;
    this.punchPressed = false;
    this.shootPressed = false;
    this.rocketPressed = false;
    this.dashPressed = false;
    this.slamPressed = false;
  }

  pollGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (!gp) return;

    // Eixos analógicos ou D-pad
    if (gp.axes[0] < -0.3 || (gp.buttons[14] && gp.buttons[14].pressed)) this.keys['ArrowLeft'] = true;
    else if (gp.axes[0] > 0.3 || (gp.buttons[15] && gp.buttons[15].pressed)) this.keys['ArrowRight'] = true;

    // Botão A (Pulo)
    if (gp.buttons[0] && gp.buttons[0].pressed && !this.prevGpA) this.jumpPressed = true;
    this.prevGpA = gp.buttons[0] && gp.buttons[0].pressed;

    // Botão X (Soco)
    if (gp.buttons[2] && gp.buttons[2].pressed && !this.prevGpX) this.punchPressed = true;
    this.prevGpX = gp.buttons[2] && gp.buttons[2].pressed;

    // Botão B ou Gatilho R2 (Foguete)
    if (gp.buttons[1] && gp.buttons[1].pressed && !this.prevGpB) this.rocketPressed = true;
    this.prevGpB = gp.buttons[1] && gp.buttons[1].pressed;

    // Botão RB / R1 (Dash)
    if (gp.buttons[5] && gp.buttons[5].pressed && !this.prevGpRB) this.dashPressed = true;
    this.prevGpRB = gp.buttons[5] && gp.buttons[5].pressed;

    // Botão Y (Slam)
    if (gp.buttons[3] && gp.buttons[3].pressed && !this.prevGpY) this.slamPressed = true;
    this.prevGpY = gp.buttons[3] && gp.buttons[3].pressed;
  }
}

// ============================================================================
// CÂMERA 2D COM SEGUIDOR SUAVE & SCREEN SHAKE
// ============================================================================
class Camera {
  constructor(viewWidth = 960, viewHeight = 540) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  shake(intensity = 6, duration = 10) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  update(target, level) {
    // Lookahead inteligente baseado na velocidade e direção do jogador
    const lookaheadX = target.facing * 50 + target.vx * 15;
    const targetX = target.x + target.width / 2 + lookaheadX - this.viewWidth / 2;
    const targetY = target.y + target.height / 2 - this.viewHeight * 0.58;

    // Interpolação linear suave (LERP)
    this.x += (targetX - this.x) * 0.1;
    this.y += (targetY - this.y) * 0.12;

    // Limites da câmera aos limites do nível
    this.x = Math.max(0, Math.min(this.x, level.pixelWidth - this.viewWidth));
    this.y = Math.max(0, Math.min(this.y, level.pixelHeight - this.viewHeight));

    // Screen Shake com decaimento
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      this.shakeOffsetX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= 0.9;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  apply(ctx) {
    ctx.save();
    ctx.translate(-Math.round(this.x + this.shakeOffsetX), -Math.round(this.y + this.shakeOffsetY));
  }

  restore(ctx) {
    ctx.restore();
  }
}

// ============================================================================
// ENGINE PRINCIPAL
// ============================================================================
class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.input = new InputManager();
    this.camera = new Camera(960, 540);
  }

  showToast(message, duration = 2400) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

const engine = new GameEngine();
window.engine = engine;
