# 🐺 O Lobo Negro de Máscara Branca: A Fuga das Gosmas Negras

Um jogo completo de ação, plataforma e sobrevivência em ritmo frenético desenvolvido em HTML5 Canvas, JavaScript ES6 puro, CSS3 moderno e sintetizador de áudio Web Audio API (sem dependências externas).

---

## 🎮 História & Protagonista
Você controla o lendário **Lobo Negro de Máscara Branca**, um guerreiro ágil do santuário ancestral que teve suas terras corrompidas por uma praga voraz: **As Gosmas Pretas do Vazio** (poças de piche, tentáculos e criaturas gelatinosas mutantes que devoram toda matéria viva).

Equipado com seu lendário **Braço Biônico Cibernético**, o lobo deve fugir da corrupção, atravessar 8 zonas mortais e alcançar os portais dimensionais para expurgar o Soberano Abissal.

---

## ⚡ Arsenal do Braço Biônico & Comandos

| Comando | Teclas (Teclado) | Mouse / Celular | Descrição |
| :--- | :--- | :--- | :--- |
| **Mover** | `A` / `D` ou `Setas ◀ ▶` | Botões direcionais virtuais | Corrida rápida com física e inércia |
| **Pular** | `W` / `Espaço` / `Seta ▲` | Botão 🦘 | Pulo ágil, **Pulo Duplo** e **Salto na Parede (Wall Jump)** |
| **Deslizar na Parede** | Segurar na direção da parede | Direcional na parede | O braço biônico finca garras na parede liberando faíscas e desacelerando a queda |
| **Soco Biônico** | `J` ou `Z` | Clique Esquerdo / Botão 🥊 | **Combo de 3 golpes**: Jab rápido ➔ Gancho ➔ Soco de impacto com descarga de energia |
| **Braço Foguete / Gancho** | `K` ou `X` | Clique Direito / Botão 🚀 | O punho biônico se desprende conectado a um cabo de energia, esmaga inimigos distantes e **puxa você até plataformas**! |
| **Turbo Dash (Esquiva)** | `L` ou `C` ou `Shift` | Botão ⚡ | Propulsão a jato com rastro neon e invulnerabilidade momentânea |
| **Impacto Sísmico (EMP)** | `E` ou `Q` ou `F` | Botão 💥 | Esmagamento aéreo no solo que cria uma onda de choque desintegrando gosmas na área |
| **Pausar** | `ESC` | Botão ⏸️ | Menu de pausa, reiniciar ou retornar |
| **Ligar/Desligar Som** | `M` | Botão 🔊 | Liga ou desliga efeitos e música chiptune |

---

## 🏆 As 8 Fases (Dificuldade Progressiva)

1. **Fase 1: As Ruínas do Santuário** *(Dificuldade: Iniciação)*
   - O despertar sob a lua cheia. Treino de movimentação básica, pulos e socos contra as primeiras gosmas rastejantes lentas.
2. **Fase 2: Cavernas de Piche Fervente** *(Dificuldade: Moderada)*
   - O chão é cortado por fossos de piche letal. Introdução das **Gosmas Cuspidoras** que disparam projéteis de ácido negro à distância.
3. **Fase 3: O Pântano Sombrio** *(Dificuldade: Desafio)*
   - Invasão aérea: **Gosmas Aladas** atacam em mergulho rasante dos céus enquanto você salta entre pilares suspensos.
4. **Fase 4: Fábrica Cibernética Abandonada** *(Dificuldade: Avançada)*
   - Introdução das **Gosmas com Espinhos de Obsidiana** que repelem socos convencionais. Exige uso preciso do Braço Foguete e Impacto Sísmico.
5. **Fase 5: A Floresta das Sombras Mortais** *(Dificuldade: Perigosa)*
   - **Gosmas Predadoras Rápidas (Stalkers)** atacam com botes velozes nas sombras. Requer esquivas com Turbo Dash.
6. **Fase 6: Laboratório do Vazio** *(Dificuldade: Insana)*
   - **Gosmas Titãs Divisoras**: Ao serem golpeadas, dividem-se em cópias menores agressivas que sobrecarregam o cenário.
7. **Fase 7: A Grande Ascensão (Fuga da Maré Negra)** *(Dificuldade: Fuga Brutal)*
   - Nível vertical frenético! O chão colapsa e uma **gigantesca onda de gosma preta fervente sobe implacavelmente**, exigindo escalada rápida por paredes e gancho sem hesitação.
8. **Fase 8: O Coração do Vazio (O Soberano Abissal)** *(Dificuldade: Chefe Supremo)*
   - Batalha final contra o Titã das Gosmas em 3 fases: Chuva de piche, tentáculos, lasers cósmicos e pontos fracos expostos!

---

## 🚀 Como Jogar

### Opção 1: Abrir diretamente no navegador (Mais simples)
Basta dar um duplo clique no arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox, Brave, Safari, Opera).

### Opção 2: Servidor Local (Recomendado)
Se preferir executar como servidor local:
```bash
python -m http.server 8000
```
Em seguida, acesse no navegador: [http://localhost:8000](http://localhost:8000).

---

## 🎧 Áudio & Efeitos Sonoros
- **Web Audio API Procedural**: Músicas em estilo Synthwave / Darkwave sintetizadas em tempo real via osciladores, ruído branco e filtros de frequência.
- Sem necessidade de baixar arquivos MP3 externos pesados; carrega instantaneamente!
