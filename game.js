(() => {
  const state = {
    phase: "explore",
    location: "town",
    turn: 1,
    gameOver: false,
    hero: {
      hp: 100,
      maxHp: 100,
      atk: 12,
      level: 1,
      exp: 0,
      expToNext: 30,
      potions: 3,
      gold: 20,
      guarding: false,
      skillCd: 0,
    },
    enemy: null,
  };

  const el = {
    scene: document.getElementById("scene"),
    log: document.getElementById("log"),
    heroHp: document.getElementById("hero-hp"),
    heroMax: document.getElementById("hero-max"),
    heroBar: document.getElementById("hero-bar"),
    heroLevel: document.getElementById("hero-level"),
    heroExp: document.getElementById("hero-exp"),
    heroPotions: document.getElementById("hero-potions"),
    heroGold: document.getElementById("hero-gold"),
    enemyName: document.getElementById("enemy-name"),
    enemyHp: document.getElementById("enemy-hp"),
    enemyMax: document.getElementById("enemy-max"),
    enemyBar: document.getElementById("enemy-bar"),
    enemyNote: document.getElementById("enemy-note"),
    goTown: document.getElementById("go-town"),
    goCave: document.getElementById("go-cave"),
    goCastle: document.getElementById("go-castle"),
    rest: document.getElementById("rest"),
    attack: document.getElementById("attack"),
    skill: document.getElementById("skill"),
    potion: document.getElementById("potion"),
    guard: document.getElementById("guard"),
    restart: document.getElementById("restart"),
    canvas: document.getElementById("screen"),
  };

  const ctx = el.canvas.getContext("2d");

  const data = {
    caveEnemies: [
      { name: "スライム", icon: "🟢", hp: 35, atkMin: 6, atkMax: 10, exp: 12, gold: 10 },
      { name: "ゴブリン", icon: "👺", hp: 46, atkMin: 8, atkMax: 12, exp: 16, gold: 14 },
      { name: "洞窟オオカミ", icon: "🐺", hp: 52, atkMin: 9, atkMax: 14, exp: 18, gold: 16 },
    ],
    boss: { name: "魔王", icon: "👹", hp: 160, atkMin: 12, atkMax: 20, exp: 80, gold: 60, rage: 0 },
  };

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function addLog(text) {
    const p = document.createElement("p");
    p.textContent = text;
    el.log.prepend(p);
  }

  function drawBackground() {
    const w = el.canvas.width;
    const h = el.canvas.height;

    if (state.location === "town") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#93c5fd");
      grad.addColorStop(1, "#dbeafe");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(0, h * 0.65, w, h * 0.35);
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(90, 180, 130, 95);
      ctx.fillStyle = "#b91c1c";
      ctx.beginPath();
      ctx.moveTo(80, 180);
      ctx.lineTo(155, 120);
      ctx.lineTo(230, 180);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.font = "26px sans-serif";
      ctx.fillText("🏘️ 王都", 40, 50);
    }

    if (state.location === "cave") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#1f2937");
      grad.addColorStop(1, "#111827");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#374151";
      for (let i = 0; i < 6; i += 1) {
        ctx.beginPath();
        const x = i * 120;
        ctx.moveTo(x, h);
        ctx.lineTo(x + 60, h - rand(120, 190));
        ctx.lineTo(x + 120, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.arc(560, 65, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "24px sans-serif";
      ctx.fillText("🕳️ 洞窟", 40, 50);
    }

    if (state.location === "castle") {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#7f1d1d");
      grad.addColorStop(1, "#111827");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(230, 120, 180, 180);
      ctx.fillRect(190, 85, 35, 215);
      ctx.fillRect(415, 85, 35, 215);
      ctx.fillStyle = "#fca5a5";
      ctx.fillRect(302, 230, 36, 70);
      ctx.fillStyle = "#fee2e2";
      ctx.font = "24px sans-serif";
      ctx.fillText("🏰 魔王城", 40, 50);
    }
  }

  function drawCharacters() {
    ctx.font = "80px sans-serif";
    ctx.fillText("🧙", 120, 310);

    if (state.phase === "battle" && state.enemy) {
      ctx.font = "92px sans-serif";
      ctx.fillText(state.enemy.icon, 460, 300);
    }
  }

  function renderScene() {
    drawBackground();
    drawCharacters();
  }

  function enemySpawn(kind) {
    if (kind === "boss") {
      const b = data.boss;
      return {
        name: b.name,
        icon: b.icon,
        hp: b.hp,
        maxHp: b.hp,
        atkMin: b.atkMin,
        atkMax: b.atkMax,
        exp: b.exp,
        gold: b.gold,
        rage: 0,
        isBoss: true,
      };
    }
    const base = data.caveEnemies[rand(0, data.caveEnemies.length - 1)];
    return {
      name: base.name,
      icon: base.icon,
      hp: base.hp + rand(-4, 6),
      maxHp: base.hp + rand(-4, 6),
      atkMin: base.atkMin,
      atkMax: base.atkMax,
      exp: base.exp,
      gold: base.gold,
      rage: 0,
      isBoss: false,
    };
  }

  function refresh() {
    el.heroHp.textContent = String(state.hero.hp);
    el.heroMax.textContent = String(state.hero.maxHp);
    el.heroLevel.textContent = String(state.hero.level);
    el.heroExp.textContent = `${state.hero.exp}/${state.hero.expToNext}`;
    el.heroPotions.textContent = String(state.hero.potions);
    el.heroGold.textContent = String(state.hero.gold);
    el.heroBar.style.width = `${(state.hero.hp / state.hero.maxHp) * 100}%`;

    if (state.enemy) {
      el.enemyName.textContent = `${state.enemy.icon} ${state.enemy.name}`;
      el.enemyHp.textContent = String(state.enemy.hp);
      el.enemyMax.textContent = String(state.enemy.maxHp);
      el.enemyBar.style.width = `${(state.enemy.hp / state.enemy.maxHp) * 100}%`;
      el.enemyNote.textContent = state.enemy.isBoss ? `怒り: ${state.enemy.rage}/4` : "通常モンスター";
    } else {
      el.enemyName.textContent = "👹 敵情報";
      el.enemyHp.textContent = "-";
      el.enemyMax.textContent = "-";
      el.enemyBar.style.width = "0%";
      el.enemyNote.textContent = "探索中は敵がいません。";
    }

    const inBattle = state.phase === "battle" && !!state.enemy;
    el.attack.disabled = !inBattle || state.gameOver;
    el.skill.disabled = !inBattle || state.gameOver || state.hero.skillCd > 0;
    el.potion.disabled = state.gameOver || state.hero.potions <= 0;
    el.guard.disabled = !inBattle || state.gameOver;

    el.goTown.disabled = state.gameOver || inBattle;
    el.goCave.disabled = state.gameOver || inBattle;
    el.goCastle.disabled = state.gameOver || inBattle;
    el.rest.disabled = state.gameOver || inBattle;
    el.restart.disabled = !state.gameOver;

    renderScene();
  }

  function levelUpIfNeeded() {
    while (state.hero.exp >= state.hero.expToNext) {
      state.hero.exp -= state.hero.expToNext;
      state.hero.level += 1;
      state.hero.expToNext += 20;
      state.hero.maxHp += 12;
      state.hero.hp = state.hero.maxHp;
      state.hero.atk += 2;
      addLog(`⬆️ レベル${state.hero.level}になった！ 最大HPと攻撃力が上昇。`);
    }
  }

  function endGame(win) {
    state.gameOver = true;
    state.phase = "explore";
    state.enemy = null;
    if (win) {
      el.scene.textContent = "🎉 魔王を倒した！街に平和が戻った！";
      addLog("🏆 エンディング: 勇者は英雄として讃えられた。");
    } else {
      el.scene.textContent = "💀 勇者は倒れた…もう一度冒険しよう。";
      addLog("☠️ ゲームオーバー。");
    }
    refresh();
  }

  function enemyTurn() {
    if (!state.enemy || state.gameOver) return;

    let damage = rand(state.enemy.atkMin, state.enemy.atkMax);
    if (state.enemy.isBoss) {
      state.enemy.rage += 1;
      if (state.enemy.rage >= 4) {
        damage += rand(7, 13);
        state.enemy.rage = 0;
        addLog("🔥 魔王の怒り爆発！超強力な攻撃！");
      }
    }

    if (state.hero.guarding) {
      damage = Math.floor(damage * 0.45);
      addLog("🛡️ 防御でダメージを軽減した。 ");
    }

    state.hero.hp = clamp(state.hero.hp - damage, 0, state.hero.maxHp);
    addLog(`${state.enemy.icon} ${state.enemy.name}の攻撃！ ${damage}ダメージ。`);
    state.hero.guarding = false;

    if (state.hero.hp <= 0) {
      endGame(false);
      return;
    }

    if (state.hero.skillCd > 0) state.hero.skillCd -= 1;
    state.turn += 1;
    refresh();
  }

  function winBattle() {
    const e = state.enemy;
    addLog(`✨ ${e.name}を倒した！ EXP ${e.exp} / ${e.gold}G 獲得。`);
    state.hero.exp += e.exp;
    state.hero.gold += e.gold;
    levelUpIfNeeded();

    if (e.isBoss) {
      endGame(true);
      return;
    }

    state.phase = "explore";
    state.enemy = null;
    el.scene.textContent = "洞窟を進んだ。次はどうする？";
    refresh();
  }

  function actionAttack() {
    if (!state.enemy || state.gameOver) return;
    const damage = rand(state.hero.atk - 2, state.hero.atk + 6);
    state.enemy.hp = clamp(state.enemy.hp - damage, 0, state.enemy.maxHp);
    addLog(`⚔️ 勇者の攻撃！${damage}ダメージ。`);
    if (state.enemy.hp <= 0) return winBattle();
    enemyTurn();
  }

  function actionSkill() {
    if (!state.enemy || state.hero.skillCd > 0 || state.gameOver) return;
    const damage = rand(state.hero.atk + 12, state.hero.atk + 20);
    state.enemy.hp = clamp(state.enemy.hp - damage, 0, state.enemy.maxHp);
    state.hero.skillCd = 3;
    addLog(`✨ ひっさつ斬り！${damage}ダメージ。`);
    if (state.enemy.hp <= 0) return winBattle();
    enemyTurn();
  }

  function actionPotion() {
    if (state.hero.potions <= 0 || state.gameOver) return;
    state.hero.potions -= 1;
    const heal = rand(20, 35);
    state.hero.hp = clamp(state.hero.hp + heal, 0, state.hero.maxHp);
    addLog(`🧪 HPを${heal}回復。`);
    if (state.phase === "battle" && state.enemy) enemyTurn();
    refresh();
  }

  function actionGuard() {
    if (!state.enemy || state.gameOver) return;
    state.hero.guarding = true;
    addLog("🛡️ 防御姿勢をとった。 ");
    enemyTurn();
  }

  function goTown() {
    state.location = "town";
    state.phase = "explore";
    state.enemy = null;
    el.scene.textContent = "王都に戻った。宿で回復したり、次の目的地を選ぼう。";
    addLog("🏘️ 街に到着。人々が勇者を応援している。");
    refresh();
  }

  function goCave() {
    state.location = "cave";
    state.phase = "battle";
    state.enemy = enemySpawn("cave");
    el.scene.textContent = `洞窟で ${state.enemy.name} が現れた！`;
    addLog(`🕳️ 洞窟探索中、${state.enemy.name} と遭遇！`);
    refresh();
  }

  function goCastle() {
    state.location = "castle";
    state.phase = "battle";
    state.enemy = enemySpawn("boss");
    el.scene.textContent = "玉座の間で魔王が待ち構えている！";
    addLog("🏰 最終決戦！魔王との戦いが始まった。");
    refresh();
  }

  function restAtInn() {
    if (state.phase === "battle" || state.gameOver) return;
    if (state.hero.gold < 10) {
      addLog("💸 ゴールドが足りない…（必要: 10G）");
      return;
    }
    state.hero.gold -= 10;
    state.hero.hp = state.hero.maxHp;
    addLog("🛏️ 宿で休んだ。HPが全回復！");
    refresh();
  }

  function restart() {
    state.phase = "explore";
    state.location = "town";
    state.turn = 1;
    state.gameOver = false;
    state.enemy = null;

    state.hero.hp = 100;
    state.hero.maxHp = 100;
    state.hero.atk = 12;
    state.hero.level = 1;
    state.hero.exp = 0;
    state.hero.expToNext = 30;
    state.hero.potions = 3;
    state.hero.gold = 20;
    state.hero.guarding = false;
    state.hero.skillCd = 0;

    el.log.innerHTML = "";
    el.scene.textContent = "王都に到着。準備を整えて冒険へ出発しよう！";
    addLog("🌟 新しい冒険が始まった！");
    refresh();
  }

  el.goTown.addEventListener("click", goTown);
  el.goCave.addEventListener("click", goCave);
  el.goCastle.addEventListener("click", goCastle);
  el.rest.addEventListener("click", restAtInn);
  el.attack.addEventListener("click", actionAttack);
  el.skill.addEventListener("click", actionSkill);
  el.potion.addEventListener("click", actionPotion);
  el.guard.addEventListener("click", actionGuard);
  el.restart.addEventListener("click", restart);

  addLog("🌟 新しい冒険が始まった！");
  refresh();
})();
