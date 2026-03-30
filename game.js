(() => {

  const MAP_W = 20;
  const MAP_H = 20;
  const TILE = 32;

  const tileColors = {
    G: "#84cc16", // grass
    F: "#65a30d", // forest
    M: "#6b7280", // mountain
    W: "#38bdf8", // water
    R: "#eab308", // road
    T: "#f59e0b", // town
    C: "#7c3aed", // cave
    B: "#b91c1c", // boss castle
  };

  const mapRows = [
    "WWWWWWWWWWWWWWWWWWWW",
    "WGGGGGGGGGFFFFGGGGGW",
    "WGGRRRRGGGFFFFGGMMGW",
    "WGGRTTRGGGGGFGGGMMGW",
    "WGGGRRRGGGGGFGGGGGGW",
    "WGGGGGGGGMMMFGGGGGGW",
    "WGGGFFFFGGMMMFGGGGGW",
    "WGGGFFFFGGGGGFGGGGGW",
    "WGGGGGGGGGGGGFGGGGGW",
    "WGGGGMMMGGGGGFGGGGGW",
    "WGGGGMMMGGGGGFGGGGGW",
    "WGGGGGGGGGGGGFGGGGGW",
    "WGGGGFGGGGGGGFGGGGGW",
    "WGGGGFGGGCCCCFGGGGGW",
    "WGGGGFGGGCCCCFGGGGGW",
    "WGGGGFGGGGGGGFGGGGGW",
    "WGGGGFGGGGGGGFGGGGGW",
    "WGGGGFGGGGGGGFGGGBBW",
    "WGGGGGGGGGGGGGGGGBBW",
    "WWWWWWWWWWWWWWWWWWWW",
  ];

  const state = {
    mode: "field", // field | battle
    gameOver: false,
    hero: {
      x: 4,
      y: 3,
      hp: 100,
      maxHp: 100,
      atk: 12,
      level: 1,
      exp: 0,
      expToNext: 24,
      gold: 30,
      potions: 3,
      guarding: false,
      skillCd: 0,
    },
    enemy: null,
  };

  const enemies = [
    { name: "スライム", icon: "🟢", hp: 30, atkMin: 6, atkMax: 10, exp: 9, gold: 6 },
    { name: "ゴースト", icon: "👻", hp: 38, atkMin: 7, atkMax: 11, exp: 12, gold: 8 },
    { name: "キラービー", icon: "🐝", hp: 34, atkMin: 8, atkMax: 13, exp: 13, gold: 9 },
    { name: "ドラキー", icon: "🦇", hp: 42, atkMin: 9, atkMax: 14, exp: 15, gold: 11 },
  ];

  const bossBase = { name: "魔王", icon: "👹", hp: 180, atkMin: 12, atkMax: 20, exp: 100, gold: 120 };

  const el = {
    scene: document.getElementById("scene"),
    log: document.getElementById("log"),
    heroHp: document.getElementById("hero-hp"),
    heroMax: document.getElementById("hero-max"),
    heroBar: document.getElementById("hero-bar"),
    heroLevel: document.getElementById("hero-level"),
    heroExp: document.getElementById("hero-exp"),
    heroGold: document.getElementById("hero-gold"),
    heroPotions: document.getElementById("hero-potions"),
    coordX: document.getElementById("coord-x"),
    coordY: document.getElementById("coord-y"),
    enemyName: document.getElementById("enemy-name"),
    enemyHp: document.getElementById("enemy-hp"),
    enemyMax: document.getElementById("enemy-max"),
    enemyBar: document.getElementById("enemy-bar"),
    enemyNote: document.getElementById("enemy-note"),
    moveUp: document.getElementById("move-up"),
    moveDown: document.getElementById("move-down"),
    moveLeft: document.getElementById("move-left"),
    moveRight: document.getElementById("move-right"),
    interact: document.getElementById("interact"),
    rest: document.getElementById("rest"),
    attack: document.getElementById("attack"),
    skill: document.getElementById("skill"),
    guard: document.getElementById("guard"),
    potion: document.getElementById("potion"),
    restart: document.getElementById("restart"),
    canvas: document.getElementById("screen"),
  };

  const ctx = el.canvas.getContext("2d");

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function log(text) {
    const p = document.createElement("p");
    p.textContent = text;
    el.log.prepend(p);
  }

  function tileAt(x, y) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return "W";
    return mapRows[y][x];
  }

  function drawMap() {
    ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);
    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        const t = mapRows[y][x];
        ctx.fillStyle = tileColors[t] || "#84cc16";
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);

        if (t === "W") {
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.fillRect(x * TILE, y * TILE + 6, TILE, 4);
        }
        if (t === "M") {
          ctx.fillStyle = "#374151";
          ctx.beginPath();
          ctx.moveTo(x * TILE + 4, y * TILE + TILE - 4);
          ctx.lineTo(x * TILE + TILE / 2, y * TILE + 7);
          ctx.lineTo(x * TILE + TILE - 4, y * TILE + TILE - 4);
          ctx.closePath();
          ctx.fill();
        }
        if (t === "T" || t === "C" || t === "B") {
          ctx.fillStyle = "#fff";
          ctx.font = "18px sans-serif";
          const icon = t === "T" ? "🏘️" : t === "C" ? "🕳️" : "🏰";
          ctx.fillText(icon, x * TILE + 4, y * TILE + 24);
        }
      }
    }

    if (state.mode === "battle" && state.enemy) {
      ctx.fillStyle = "rgba(0,0,0,0.36)";
      ctx.fillRect(0, 0, 640, 640);
      ctx.fillStyle = "#fff";
      ctx.font = "42px sans-serif";
      ctx.fillText("⚔️ 戦闘中", 228, 90);
      ctx.font = "92px sans-serif";
      ctx.fillText("🧙", 120, 360);
      ctx.fillText(state.enemy.icon, 430, 350);
    } else {
      ctx.font = "26px sans-serif";
      ctx.fillText("🧙", state.hero.x * TILE + 2, state.hero.y * TILE + 26);
    }
  }

  function spawnEnemy(isBoss = false) {
    if (isBoss) {
      return {
        ...bossBase,
        hp: bossBase.hp,
        maxHp: bossBase.hp,
        rage: 0,
        isBoss: true,
      };
    }
    const b = enemies[rand(0, enemies.length - 1)];
    const hp = b.hp + rand(-3, 5);
    return {
      ...b,
      hp,
      maxHp: hp,
      rage: 0,
      isBoss: false,
    };
  }

  function enterBattle(isBoss = false) {
    state.mode = "battle";
    state.enemy = spawnEnemy(isBoss);
    state.hero.guarding = false;
    el.scene.textContent = isBoss ? "🏰 魔王が現れた！最終決戦！" : `${state.enemy.name} が現れた！`;
    log(isBoss ? "👹 魔王との戦いが始まった！" : `👾 ${state.enemy.name} と遭遇！`);
    refresh();
  }

  function gainRewards(e) {
    state.hero.exp += e.exp;
    state.hero.gold += e.gold;
    log(`✨ ${e.name}を倒した！ EXP+${e.exp} / G+${e.gold}`);

    while (state.hero.exp >= state.hero.expToNext) {
      state.hero.exp -= state.hero.expToNext;
      state.hero.level += 1;
      state.hero.expToNext += 18;
      state.hero.maxHp += 10;
      state.hero.hp = state.hero.maxHp;
      state.hero.atk += 2;
      log(`⬆️ レベル${state.hero.level}！ 最大HP/攻撃アップ！`);
    }
  }

  function finishGame(win) {
    state.gameOver = true;
    state.mode = "field";
    state.enemy = null;
    el.scene.textContent = win ? "🎉 魔王を倒した！世界に平和が戻った！" : "💀 勇者は倒れた…。";
    log(win ? "🏆 エンディング達成！" : "☠️ ゲームオーバー。再挑戦しよう。");
    refresh();
  }

  function endBattleWin() {
    const e = state.enemy;
    if (!e) return;
    gainRewards(e);
    if (e.isBoss) {
      finishGame(true);
      return;
    }
    state.mode = "field";
    state.enemy = null;
    el.scene.textContent = "勝利！フィールド探索に戻った。";
    refresh();
  }

  function enemyTurn() {
    if (!state.enemy || state.gameOver) return;
    let damage = rand(state.enemy.atkMin, state.enemy.atkMax);

    if (state.enemy.isBoss) {
      state.enemy.rage += 1;
      if (state.enemy.rage >= 4) {
        state.enemy.rage = 0;
        damage += rand(8, 14);
        log("🔥 魔王の怒りが爆発！");
      }
    }

    if (state.hero.guarding) {
      damage = Math.floor(damage * 0.4);
      log("🛡️ 防御でダメージ軽減！");
    }

    state.hero.hp = clamp(state.hero.hp - damage, 0, state.hero.maxHp);
    state.hero.guarding = false;
    log(`${state.enemy.icon} ${state.enemy.name}の攻撃！ ${damage}ダメージ。`);

  const state = {
    hero: {
      hp: 100,
      maxHp: 100,
      potions: 3,
      skillCooldown: 0,
      guarding: false,
    },
    boss: {
      hp: 120,
      maxHp: 120,
      rage: 0,
    },
    gameOver: false,
    turn: 1,
  };

  const els = {
    heroHpText: document.getElementById("hero-hp-text"),
    heroHpBar: document.getElementById("hero-hp-bar"),
    bossHpText: document.getElementById("boss-hp-text"),
    bossHpBar: document.getElementById("boss-hp-bar"),
    potions: document.getElementById("potions"),
    rage: document.getElementById("rage"),
    scene: document.getElementById("scene"),
    log: document.getElementById("log"),
    attackBtn: document.getElementById("attack-btn"),
    skillBtn: document.getElementById("skill-btn"),
    healBtn: document.getElementById("heal-btn"),
    guardBtn: document.getElementById("guard-btn"),
    restartBtn: document.getElementById("restart-btn"),
    heroMaxHp: document.getElementById("hero-max-hp"),
    bossMaxHp: document.getElementById("boss-max-hp"),
  };

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function addLog(text) {
    const p = document.createElement("p");
    p.textContent = text;
    els.log.prepend(p);
  }

  function updateView() {
    els.heroHpText.textContent = String(state.hero.hp);
    els.bossHpText.textContent = String(state.boss.hp);
    els.heroMaxHp.textContent = String(state.hero.maxHp);
    els.bossMaxHp.textContent = String(state.boss.maxHp);
    els.potions.textContent = String(state.hero.potions);
    els.rage.textContent = String(state.boss.rage);

    const heroRate = (state.hero.hp / state.hero.maxHp) * 100;
    const bossRate = (state.boss.hp / state.boss.maxHp) * 100;
    els.heroHpBar.style.width = `${clamp(heroRate, 0, 100)}%`;
    els.bossHpBar.style.width = `${clamp(bossRate, 0, 100)}%`;

    els.skillBtn.disabled = state.hero.skillCooldown > 0 || state.gameOver;
    els.attackBtn.disabled = state.gameOver;
    els.healBtn.disabled = state.gameOver || state.hero.potions <= 0;
    els.guardBtn.disabled = state.gameOver;
    els.restartBtn.disabled = !state.gameOver;

    if (!state.gameOver) {
      els.scene.textContent = `ターン ${state.turn}: 勇者の行動を選んでください。`;
    }
  }

  function finishGame(heroWon) {
    state.gameOver = true;
    if (heroWon) {
      els.scene.textContent = "🎉 勇者は魔王を倒した！王国に平和が戻った！";
      addLog("🏆 勝利！伝説として語り継がれる冒険になった。");
    } else {
      els.scene.textContent = "💀 勇者は倒れ、世界は闇に包まれた…。";
      addLog("☠️ 敗北…しかし物語はここで終わらない。");
    }
    updateView();
  }

  function bossTurn() {
    if (state.boss.hp <= 0 || state.gameOver) {
      return;
    }

    let damage;
    const usedRageBurst = state.boss.rage >= 5;
    if (usedRageBurst) {
      damage = rand(20, 28);
      state.boss.rage = 0;
      addLog("🔥 魔王の怒りが爆発！強烈な一撃！");
    } else {
      damage = rand(8, 15);
      state.boss.rage += 1;
    }

    if (state.hero.guarding) {
      damage = Math.floor(damage * 0.45);
      addLog("🛡️ 勇者は防御してダメージを軽減した！");
    }

    state.hero.hp = clamp(state.hero.hp - damage, 0, state.hero.maxHp);
    addLog(`👹 魔王の攻撃！勇者に ${damage} ダメージ。`);

    state.hero.guarding = false;
    state.turn += 1;


    if (state.hero.hp <= 0) {
      finishGame(false);
      return;
    }


    if (state.hero.skillCd > 0) state.hero.skillCd -= 1;
    refresh();
  }

  function attack() {
    if (state.mode !== "battle" || !state.enemy || state.gameOver) return;
    const damage = rand(state.hero.atk - 1, state.hero.atk + 6);
    state.enemy.hp = clamp(state.enemy.hp - damage, 0, state.enemy.maxHp);
    log(`⚔️ 攻撃！ ${damage}ダメージ。`);
    if (state.enemy.hp <= 0) return endBattleWin();
    enemyTurn();
  }

  function skill() {
    if (state.mode !== "battle" || !state.enemy || state.hero.skillCd > 0 || state.gameOver) return;
    const damage = rand(state.hero.atk + 10, state.hero.atk + 18);
    state.enemy.hp = clamp(state.enemy.hp - damage, 0, state.enemy.maxHp);
    state.hero.skillCd = 3;
    log(`✨ ひっさつ！ ${damage}ダメージ。`);
    if (state.enemy.hp <= 0) return endBattleWin();
    enemyTurn();
  }

  function guard() {
    if (state.mode !== "battle" || state.gameOver) return;
    state.hero.guarding = true;
    log("🛡️ 防御姿勢をとった。 ");
    enemyTurn();
  }

  function usePotion() {
    if (state.hero.potions <= 0 || state.gameOver) return;
    state.hero.potions -= 1;
    const heal = rand(22, 36);
    state.hero.hp = clamp(state.hero.hp + heal, 0, state.hero.maxHp);
    log(`🧪 HPが${heal}回復。`);
    if (state.mode === "battle") enemyTurn();
    refresh();
  }

  function canMoveTo(x, y) {
    const t = tileAt(x, y);
    return t !== "W";
  }

  function maybeEncounter(tile) {
    if (state.mode !== "field" || state.gameOver) return;
    if (tile === "T") {
      el.scene.textContent = "🏘️ 町に入った。休んで準備できる。";
      return;
    }
    if (tile === "C") {
      el.scene.textContent = "🕳️ 洞窟入口だ。調べると奥へ進める。";
      return;
    }
    if (tile === "B") {
      el.scene.textContent = "🏰 魔王城の門前。調べると最終決戦。";
      return;
    }

    const rate = tile === "F" ? 0.26 : 0.12;
    if (Math.random() < rate) {
      enterBattle(false);
    } else {
      el.scene.textContent = tile === "F" ? "🌲 森を進んでいる…" : "草原を進んでいる。";
      refresh();
    }
  }

  function move(dx, dy) {
    if (state.mode !== "field" || state.gameOver) return;
    const nx = state.hero.x + dx;
    const ny = state.hero.y + dy;
    if (!canMoveTo(nx, ny)) {
      log("🌊 そこには進めない。 ");
      return;
    }
    state.hero.x = nx;
    state.hero.y = ny;
    const t = tileAt(nx, ny);
    maybeEncounter(t);
    refresh();
  }

  function interact() {
    if (state.mode !== "field" || state.gameOver) return;
    const t = tileAt(state.hero.x, state.hero.y);
    if (t === "T") {
      el.scene.textContent = "🏘️ 宿屋と道具屋がある町。";
      log("町人『気をつけて旅を！』");
    } else if (t === "C") {
      log("洞窟の奥で魔物が襲いかかってきた！");
      enterBattle(false);
      return;
    } else if (t === "B") {
      enterBattle(true);
      return;
    } else {
      log("特に何もない。 ");
    }
    refresh();
  }

  function rest() {
    if (state.mode !== "field" || state.gameOver) return;
    const t = tileAt(state.hero.x, state.hero.y);
    if (t !== "T") {
      log("🏘️ 町の中でしか休めない。 ");
      return;
    }
    if (state.hero.gold < 8) {
      log("💸 ゴールド不足（8G必要）。");
      return;
    }
    state.hero.gold -= 8;
    state.hero.hp = state.hero.maxHp;
    log("🛏️ 宿で休んで全回復！");
    refresh();
  }

  function refresh() {
    el.heroHp.textContent = String(state.hero.hp);
    el.heroMax.textContent = String(state.hero.maxHp);
    el.heroLevel.textContent = String(state.hero.level);
    el.heroExp.textContent = `${state.hero.exp}/${state.hero.expToNext}`;
    el.heroGold.textContent = String(state.hero.gold);
    el.heroPotions.textContent = String(state.hero.potions);
    el.coordX.textContent = String(state.hero.x);
    el.coordY.textContent = String(state.hero.y);
    el.heroBar.style.width = `${(state.hero.hp / state.hero.maxHp) * 100}%`;

    if (state.enemy) {
      el.enemyName.textContent = `${state.enemy.icon} ${state.enemy.name}`;
      el.enemyHp.textContent = String(state.enemy.hp);
      el.enemyMax.textContent = String(state.enemy.maxHp);
      el.enemyBar.style.width = `${(state.enemy.hp / state.enemy.maxHp) * 100}%`;
      el.enemyNote.textContent = state.enemy.isBoss ? `怒り: ${state.enemy.rage}/4` : "通常エンカウント";
    } else {
      el.enemyName.textContent = "👾 敵情報";
      el.enemyHp.textContent = "-";
      el.enemyMax.textContent = "-";
      el.enemyBar.style.width = "0%";
      el.enemyNote.textContent = "フィールド探索中";
    }

    const battle = state.mode === "battle";
    el.attack.disabled = !battle || state.gameOver;
    el.skill.disabled = !battle || state.gameOver || state.hero.skillCd > 0;
    el.guard.disabled = !battle || state.gameOver;
    el.potion.disabled = state.hero.potions <= 0 || state.gameOver;

    el.moveUp.disabled = battle || state.gameOver;
    el.moveDown.disabled = battle || state.gameOver;
    el.moveLeft.disabled = battle || state.gameOver;
    el.moveRight.disabled = battle || state.gameOver;
    el.interact.disabled = battle || state.gameOver;
    el.rest.disabled = battle || state.gameOver;
    el.restart.disabled = !state.gameOver;

    drawMap();
  }

  function restart() {
    state.mode = "field";
    state.gameOver = false;
    state.enemy = null;
    state.hero.x = 4;
    state.hero.y = 3;
    state.hero.hp = 100;
    state.hero.maxHp = 100;
    state.hero.atk = 12;
    state.hero.level = 1;
    state.hero.exp = 0;
    state.hero.expToNext = 24;
    state.hero.gold = 30;
    state.hero.potions = 3;
    state.hero.guarding = false;
    state.hero.skillCd = 0;
    el.log.innerHTML = "";
    el.scene.textContent = "王都ラダトームから冒険開始！まずは洞窟を目指そう。";
    log("🌟 新しい冒険が始まった！");
    refresh();
  }

  el.moveUp.addEventListener("click", () => move(0, -1));
  el.moveDown.addEventListener("click", () => move(0, 1));
  el.moveLeft.addEventListener("click", () => move(-1, 0));
  el.moveRight.addEventListener("click", () => move(1, 0));
  el.interact.addEventListener("click", interact);
  el.rest.addEventListener("click", rest);

  el.attack.addEventListener("click", attack);
  el.skill.addEventListener("click", skill);
  el.guard.addEventListener("click", guard);
  el.potion.addEventListener("click", usePotion);
  el.restart.addEventListener("click", restart);

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === "ArrowUp") move(0, -1);
    if (e.key === "ArrowDown") move(0, 1);
    if (e.key === "ArrowLeft") move(-1, 0);
    if (e.key === "ArrowRight") move(1, 0);
    if (e.key.toLowerCase() === "z") interact();
    if (e.key.toLowerCase() === "x") usePotion();
  });

  log("🌟 新しい冒険が始まった！ 方向キーで移動できます。");
  refresh();

    if (state.hero.skillCooldown > 0) {
      state.hero.skillCooldown -= 1;
    }

    updateView();
  }

  function heroAttack() {
    const damage = rand(12, 20);
    state.boss.hp = clamp(state.boss.hp - damage, 0, state.boss.maxHp);
    addLog(`⚔️ 勇者のこうげき！魔王に ${damage} ダメージ。`);
    if (state.boss.hp <= 0) {
      finishGame(true);
      return;
    }
    bossTurn();
  }

  function heroSkill() {
    if (state.hero.skillCooldown > 0) {
      return;
    }
    const damage = rand(24, 35);
    state.boss.hp = clamp(state.boss.hp - damage, 0, state.boss.maxHp);
    state.hero.skillCooldown = 3;
    addLog(`✨ ひっさつ炸裂！魔王に ${damage} ダメージ。`);
    if (state.boss.hp <= 0) {
      finishGame(true);
      return;
    }
    bossTurn();
  }

  function heroHeal() {
    if (state.hero.potions <= 0) {
      return;
    }
    state.hero.potions -= 1;
    const heal = rand(18, 30);
    state.hero.hp = clamp(state.hero.hp + heal, 0, state.hero.maxHp);
    addLog(`🧪 ポーションでHPを ${heal} 回復した。`);
    bossTurn();
  }

  function heroGuard() {
    state.hero.guarding = true;
    addLog("🛡️ 勇者は防御姿勢をとった。");
    bossTurn();
  }

  function resetGame() {
    state.hero.hp = 100;
    state.hero.maxHp = 100;
    state.hero.potions = 3;
    state.hero.skillCooldown = 0;
    state.hero.guarding = false;

    state.boss.hp = 120;
    state.boss.maxHp = 120;
    state.boss.rage = 0;

    state.gameOver = false;
    state.turn = 1;
    els.log.innerHTML = "";
    addLog("🌟 新しい冒険が始まった！");
    updateView();
  }

  els.attackBtn.addEventListener("click", heroAttack);
  els.skillBtn.addEventListener("click", heroSkill);
  els.healBtn.addEventListener("click", heroHeal);
  els.guardBtn.addEventListener("click", heroGuard);
  els.restartBtn.addEventListener("click", resetGame);

  addLog("🌟 新しい冒険が始まった！");
  updateView();

})();
