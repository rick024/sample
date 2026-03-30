(() => {
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
