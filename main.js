// ===============================
// DQ風ミニRPG（拡張版 その3 スマホ対応）
// - ボス撃破後に👹タイルが消える
// - 敵強化＆EXP/G減少でレベル＆お金稼ぎを難しく
// - 洞窟に宝箱📦追加（中身はアイテムやお金）
// - ショップは「決定ボタン(Zキー)で即購入」
// - MP導入（呪文ごとにMP消費）
// - 必殺技はHP消費あり
// - スマホ用タッチ操作（十字キー＋ステータス＋決定）
// ===============================
// -------------------------------
// タイル定義
// -------------------------------
const TILE = {
  SEA: "🌊",
  PLAIN: "🟩",
  FOREST: "🌳",
  MOUNTAIN: "⛰",
  CASTLE: "🏰",
  TOWN1_ENTRANCE: "🏡",
  TOWN2_ENTRANCE: "🏬",
  TOWN3_ENTRANCE: "🏙",
  CAVE1_ENTRANCE: "🕳",
  CAVE2_ENTRANCE: "🏔",
  CAVE3_ENTRANCE: "🗻",
  CAVE_FLOOR: "⬛",
  CAVE_WALL: "🧱",
  CAVE_EXIT: "⬆",
  CAVE_DOWN: "⬇",
  TOWN_FLOOR: "⬜",
  TOWN_HOUSE: "🏠",
  TOWN_EXIT: "🚪",
  SHOP_INN: "💤",
  SHOP_WEAPON: "⚔",
  SHOP_ARMOR: "🛡",
  SHOP_ITEM: "🧺",
  CHEST: "📦",   // たからばこ
  BOSS: "👹",
};
const MAP_TYPE = {
  WORLD: "world",
  CAVE: "cave",
  TOWN: "town",
};
// エンカウント率（やや高め）
const ENCOUNTER_RATE = {
  [MAP_TYPE.WORLD]: {
    [TILE.PLAIN]: 0.24,
    [TILE.FOREST]: 0.38,
  },
  [MAP_TYPE.CAVE]: {
    [TILE.CAVE_FLOOR]: 0.48,
  },
  [MAP_TYPE.TOWN]: {},
};
// 通行不可タイル
const BLOCK_TILES = new Set([
  TILE.SEA,
  TILE.MOUNTAIN,
  TILE.CAVE_WALL,
  TILE.TOWN_HOUSE,
]);
const NPC_TILES = new Set(["👴", "👧", "🧙", "🧔", "👦"]);
// -------------------------------
// ワールド生成
// -------------------------------
const WORLD_WIDTH = 40;
const WORLD_HEIGHT = 30;
function generateWorld(width, height) {
  const data = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        row.push(TILE.SEA);
      } else {
        const r = Math.random();
        if (r < 0.6) row.push(TILE.PLAIN);
        else if (r < 0.9) row.push(TILE.FOREST);
        else row.push(TILE.MOUNTAIN);
      }
    }
    data.push(row);
  }
  const castleX = Math.floor(width / 2);
  const castleY = Math.floor(height / 2);
  data[castleY][castleX] = TILE.CASTLE;
  for (let yy = castleY - 1; yy <= castleY + 1; yy++) {
    for (let xx = castleX - 1; xx <= castleX + 1; xx++) {
      if (xx > 0 && xx < width - 1 && yy > 0 && yy < height - 1) {
        if (!(xx === castleX && yy === castleY)) {
          data[yy][xx] = TILE.PLAIN;
        }
      }
    }
  }
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);
  const regions = [
    { x1: 1,     x2: midX - 1, y1: 1,      y2: midY - 1 },
    { x1: midX,  x2: width-2,  y1: 1,      y2: midY - 1 },
    { x1: 1,     x2: midX - 1, y1: midY,   y2: height - 2 },
    { x1: midX,  x2: width-2,  y1: midY,   y2: height - 2 },
  ];
  function placeInRegion(tileType, regionIndex) {
    const r = regions[regionIndex];
    for (let i = 0; i < 500; i++) {
      const x = r.x1 + Math.floor(Math.random() * (r.x2 - r.x1 + 1));
      const y = r.y1 + Math.floor(Math.random() * (r.y2 - r.y1 + 1));
      if (data[y][x] === TILE.PLAIN || data[y][x] === TILE.FOREST) {
        data[y][x] = tileType;
        return { x, y };
      }
    }
    return { x: castleX, y: castleY + 2 };
  }
  const town1Pos = placeInRegion(TILE.TOWN1_ENTRANCE, 0);
  const town2Pos = placeInRegion(TILE.TOWN2_ENTRANCE, 1);
  const town3Pos = placeInRegion(TILE.TOWN3_ENTRANCE, 2);
  const cave1Pos = placeInRegion(TILE.CAVE1_ENTRANCE, 0);
  const cave2Pos = placeInRegion(TILE.CAVE2_ENTRANCE, 2);
  const cave3Pos = placeInRegion(TILE.CAVE3_ENTRANCE, 3);
  return {
    map: data,
    castleX,
    castleY,
    town1Pos,
    town2Pos,
    town3Pos,
    cave1Pos,
    cave2Pos,
    cave3Pos,
  };
}
const worldInfo = generateWorld(WORLD_WIDTH, WORLD_HEIGHT);
const CASTLE_POS = { x: worldInfo.castleX, y: worldInfo.castleY };
// -------------------------------
// 洞窟マップ（宝箱📦追加）
// -------------------------------
const CAVE1_F1 = [
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
  ["🧱","⬛","⬛","📦","🧱","⬛","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","🧱","⬛","🧱","⬛","🧱","🧱","⬛","🧱","⬛","🧱"],
  ["🧱","⬛","🧱","⬛","⬛","⬛","⬛","🧱","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","🧱","⬛","📦","⬛","⬛","🧱","⬛","🧱"],
  ["🧱","⬛","🧱","⬛","⬛","⬛","🧱","🧱","⬛","⬛","⬛","🧱"],
  ["🧱","⬆","⬛","⬛","⬛","⬛","⬛","⬛","⬇","🧱","⬛","🧱"],
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
];
const CAVE1_F2 = [
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","📦","⬛","⬛","🧱"],
  ["🧱","⬛","🧱","⬛","🧱","⬛","🧱","⬛","⬛","🧱","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","🧱","⬛","🧱","⬛","⬛","⬛","🧱","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","👹","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬆","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
];
const CAVE2_F1 = [
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","📦","⬛","🧱"],
  ["🧱","⬛","🧱","🧱","⬛","🧱","🧱","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","🧱","⬛","🧱","⬛","🧱","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","📦","⬇","🧱"],
  ["🧱","⬆","⬛","⬛","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
];
const CAVE2_F2 = [
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
  ["🧱","⬛","⬛","📦","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","🧱","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","👹","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬆","⬛","⬛","⬛","🧱"],
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
];
const CAVE3_F1 = [
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","📦","🧱"],
  ["🧱","⬛","🧱","🧱","⬛","🧱","🧱","⬛","🧱","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","🧱","⬛","🧱"],
  ["🧱","⬛","🧱","⬛","🧱","⬛","🧱","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","📦","🧱"],
  ["🧱","⬆","⬛","⬛","⬛","⬛","⬛","⬛","⬇","⬛","🧱"],
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
];
const CAVE3_F2 = [
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","🧱","⬛","🧱","⬛","🧱","⬛","⬛","📦","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","👹","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","⬛","⬛","⬛","⬛","⬆","⬛","⬛","⬛","⬛","🧱"],
  ["🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱","🧱"],
];
// -------------------------------
// 街マップ
// -------------------------------
const TOWN1_DATA = [
  ["🌳","🌳","🌳","🌳","🌳","🌳","🌳","🌳","🌳","🌳","🌳"],
  ["🌳","⬜","👴","⬜","🏠","💤","🏠","⬜","👧","⬜","🌳"],
  ["🌳","⬜","🏠","⬜","⬜","⬜","⬜","⬜","🏠","⬜","🌳"],
  ["🌳","⬜","⬜","🧺","⬜","⚔","🛡","⬜","⬜","⬜","🌳"],
  ["🌳","⬜","🏠","⬜","⬜","⬜","⬜","⬜","🏠","⬜","🌳"],
  ["🌳","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","🌳"],
  ["🌳","⬜","⬜","⬜","⬜","🚪","⬜","⬜","⬜","⬜","🌳"],
  ["🌳","🌳","🌳","🌳","🌳","🌳","🌳","🌳","🌳","🌳","🌳"],
];
const TOWN2_DATA = [
  ["🌊","🌊","🌊","🌊","🌊","🌊","🌊","🌊","🌊","🌊","🌊"],
  ["🌊","⬜","⬜","⬜","🏠","💤","🏠","⬜","🧙","⬜","🌊"],
  ["🌊","⬜","🌊","⬜","⬜","🌊","⬜","⬜","🌊","⬜","🌊"],
  ["🌊","⬜","🌊","🧺","⬜","⚔","🛡","⬜","🌊","⬜","🌊"],
  ["🌊","⬜","🌊","⬜","🏠","⬜","🏠","⬜","🌊","⬜","🌊"],
  ["🌊","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","🌊"],
  ["🌊","⬜","⬜","⬜","⬜","🚪","⬜","⬜","⬜","⬜","🌊"],
  ["🌊","🌊","🌊","🌊","🌊","🌊","🌊","🌊","🌊","🌊","🌊"],
];
const TOWN3_DATA = [
  ["⛰","⛰","⛰","⛰","⛰","⛰","⛰","⛰","⛰","⛰","⛰"],
  ["⛰","⬜","👦","⬜","🏠","💤","🏠","⬜","🧔","⬜","⛰"],
  ["⛰","⬜","⛰","⬜","⬜","⬜","⬜","⬜","⛰","⬜","⛰"],
  ["⛰","⬜","⛰","🧺","⬜","⚔","🛡","⬜","⛰","⬜","⛰"],
  ["⛰","⬜","🏠","⬜","⬜","⬜","⬜","⬜","🏠","⬜","⛰"],
  ["⛰","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⬜","⛰"],
  ["⛰","⬜","⬜","⬜","⬜","🚪","⬜","⬜","⬜","⬜","⛰"],
  ["⛰","⛰","⛰","⛰","⛰","⛰","⛰","⛰","⛰","⛰","⛰"],
];
// -------------------------------
// マップ管理
// -------------------------------
const maps = {
  world: {
    id: "world",
    type: MAP_TYPE.WORLD,
    data: worldInfo.map,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    entrances: {
      town1: worldInfo.town1Pos,
      town2: worldInfo.town2Pos,
      town3: worldInfo.town3Pos,
      cave1: worldInfo.cave1Pos,
      cave2: worldInfo.cave2Pos,
      cave3: worldInfo.cave3Pos,
    },
  },
  cave1_1: {
    id: "cave1_1",
    type: MAP_TYPE.CAVE,
    data: CAVE1_F1,
    width: CAVE1_F1[0].length,
    height: CAVE1_F1.length,
    entry: { x: 1, y: 6 },
    exitToWorldKey: "cave1",
    downMapId: "cave1_2",
  },
  cave1_2: {
    id: "cave1_2",
    type: MAP_TYPE.CAVE,
    data: CAVE1_F2,
    width: CAVE1_F2[0].length,
    height: CAVE1_F2.length,
    entry: { x: 6, y: 6 },
    upMapId: "cave1_1",
  },
  cave2_1: {
    id: "cave2_1",
    type: MAP_TYPE.CAVE,
    data: CAVE2_F1,
    width: CAVE2_F1[0].length,
    height: CAVE2_F1.length,
    entry: { x: 1, y: 6 },
    exitToWorldKey: "cave2",
    downMapId: "cave2_2",
  },
  cave2_2: {
    id: "cave2_2",
    type: MAP_TYPE.CAVE,
    data: CAVE2_F2,
    width: CAVE2_F2[0].length,
    height: CAVE2_F2.length,
    entry: { x: 5, y: 6 },
    upMapId: "cave2_1",
  },
  cave3_1: {
    id: "cave3_1",
    type: MAP_TYPE.CAVE,
    data: CAVE3_F1,
    width: CAVE3_F1[0].length,
    height: CAVE3_F1.length,
    entry: { x: 1, y: 6 },
    exitToWorldKey: "cave3",
    downMapId: "cave3_2",
  },
  cave3_2: {
    id: "cave3_2",
    type: MAP_TYPE.CAVE,
    data: CAVE3_F2,
    width: CAVE3_F2[0].length,
    height: CAVE3_F2.length,
    entry: { x: 5, y: 6 },
    upMapId: "cave3_1",
  },
  town1: {
    id: "town1",
    type: MAP_TYPE.TOWN,
    data: TOWN1_DATA,
    width: TOWN1_DATA[0].length,
    height: TOWN1_DATA.length,
    entry: { x: 5, y: 5 },
    exitToWorldKey: "town1",
  },
  town2: {
    id: "town2",
    type: MAP_TYPE.TOWN,
    data: TOWN2_DATA,
    width: TOWN2_DATA[0].length,
    height: TOWN2_DATA.length,
    entry: { x: 5, y: 5 },
    exitToWorldKey: "town2",
  },
  town3: {
    id: "town3",
    type: MAP_TYPE.TOWN,
    data: TOWN3_DATA,
    width: TOWN3_DATA[0].length,
    height: TOWN3_DATA.length,
    entry: { x: 5, y: 5 },
    exitToWorldKey: "town3",
  },
};
let currentMap = maps.world;
// -------------------------------
// ビューポート
// -------------------------------
const VIEW_WIDTH = 19;
const VIEW_HEIGHT = 13;
// -------------------------------
// 装備＆アイテム定義
// -------------------------------
const WEAPONS = {
  "たけざお":         { atk: 1,  price: 0,   sell: 0 },
  "こんぼう":         { atk: 3,  price: 24,  sell: 12 },
  "どうのつるぎ":     { atk: 6,  price: 60,  sell: 30 },
  "てつのつるぎ":     { atk: 9,  price: 110, sell: 55 },
  "ぎんのつるぎ":     { atk: 13, price: 0,   sell: 0 },  // ボス報酬用
  "まじんのかなづち": { atk: 18, price: 0,   sell: 0 },  // ボス専用報酬
};
const ARMORS = {
  "ぬののふく":     { def: 1,  price: 0,   sell: 0 },
  "かわのよろい":   { def: 3,  price: 36,  sell: 18 },
  "くさりかたびら": { def: 6,  price: 90,  sell: 45 },
  "てつのよろい":   { def: 9,  price: 150, sell: 75 },
  "ドラゴンメイル": { def: 13, price: 0,   sell: 0 },  // ボス専用報酬
};
// アイテム定義（戦闘中で使う）
const ITEM_DEFS = {
  herb: {
    key: "herb",
    name: "やくそう",
    price: 10,
    type: "heal",
    heal: 30,
  },
  hiHerb: {
    key: "hiHerb",
    name: "上やくそう",
    price: 28,
    type: "heal",
    heal: 70,
  },
  powerSeed: {
    key: "powerSeed",
    name: "ちからのたね",
    price: 70,
    type: "buff",
    buff: "atk",
    amount: 3,
  },
  guardSeed: {
    key: "guardSeed",
    name: "まもりのたね",
    price: 70,
    type: "buff",
    buff: "def",
    amount: 3,
  },
};
// 呪文MP消費
const SPELL_COST = {
  "ホイミ": 3,
  "ベホイミ": 6,
  "ベホマ": 10,
  "ギラ": 4,
  "イオ": 8,
  "メラゾーマ": 12,
  "イオナズン": 18,
  "スカラ": 3,
  "バイキルト": 4,
};
// 必殺技HP消費
const TECH_HP_COST = {
  "かいしんぎり": 6,
  "みだれぎり": 5,
  "まわしげり": 5,
  "きりさきのまい": 7,
  "かげぶんしんぎり": 9,
};
// -------------------------------
// プレイヤー
// -------------------------------
const player = {
  name: "ゆうしゃ",
  x: CASTLE_POS.x,
  y: CASTLE_POS.y,
  level: 1,
  maxHp: 24,
  hp: 24,
  maxMp: 10,
  mp: 10,
  atk: 4,
  def: 1,
  exp: 0,
  nextExp: 15,   // 初期必要EXP
  gold: 12,      // 初期所持金
  emoji: "🧙",
  weapon: { name: "たけざお", ...WEAPONS["たけざお"] },
  armor: { name: "ぬののふく", ...ARMORS["ぬののふく"] },
  spells: [],
  techs: [],
  items: {
    herb: 3,
    hiHerb: 0,
    powerSeed: 0,
    guardSeed: 0,
  },
};
let battleBuff = { atk: 0, def: 0 };
function getPlayerAtk() {
  return player.atk + (player.weapon?.atk || 0) + battleBuff.atk;
}
function getPlayerDef() {
  return player.def + (player.armor?.def || 0) + battleBuff.def;
}
// -------------------------------
// 敵定義（強化＆EXP/G調整）
// -------------------------------
const ENEMIES = [
  { name: "スライム",      emoji: "🔵", maxHp: 16, atk: 5,  def: 1, exp: 4,  gold: 2 },
  { name: "ドラキー",      emoji: "🦇", maxHp: 22, atk: 7,  def: 2, exp: 7,  gold: 4 },
  { name: "ゴースト",      emoji: "👻", maxHp: 28, atk: 8,  def: 3, exp: 11, gold: 6 },
  { name: "おおねずみ",    emoji: "🐭", maxHp: 34, atk: 9,  def: 4, exp: 15, gold: 8 },
  { name: "がいこつ",      emoji: "💀", maxHp: 42, atk: 11, def: 5, exp: 22, gold: 11 },
  { name: "ウルフ",        emoji: "🐺", maxHp: 52, atk: 13, def: 6, exp: 30, gold: 14 },
  { name: "キラーマシン",  emoji: "🤖", maxHp: 64, atk: 15, def: 8, exp: 40, gold: 18 },
  { name: "ドラゴン",      emoji: "🐉", maxHp: 80, atk: 18, def: 9, exp: 55, gold: 22 },
  { name: "メタルスライム",emoji: "🩶", maxHp: 6,  atk: 9,  def: 18,exp: 140,gold: 4 },
];
// ボス（強化＆EXP/G調整）
const BOSS_ENEMIES = [
  { name: "まどうし",       emoji: "🧙", maxHp: 90,  atk: 17, def: 8,  exp: 160, gold: 80 },
  { name: "キラーアーマー", emoji: "🛡", maxHp: 120, atk: 19, def: 10, exp: 230, gold: 120 },
  { name: "ドラゴンロード", emoji: "🐲", maxHp: 150, atk: 21, def: 12, exp: 320, gold: 160 },
  { name: "まおう",         emoji: "😈", maxHp: 220, atk: 24, def: 14, exp: 500, gold: 0 },
];
const bossState = {
  cave1: false,
  cave2: false,
  cave3: false,
  final: false,
};
// -------------------------------
// ショップフラグ＋保留中購入状態
// -------------------------------
const shopFlags = {
  town1WeaponBought: false,
  town2WeaponBought: false,
  town3WeaponBought: false,
  town1ArmorBought: false,
  town2ArmorBought: false,
  town3ArmorBought: false,
};
// ショップで「決定（Z）」を待っている状態
let pendingShop = null;
// -------------------------------
// NPC会話
// -------------------------------
const NPC_DIALOG = {
  town1: {
    "👴": [
      "「このさきの　どうくつには\n　つよい　まものが　すんでおるぞ。」",
      "「しろの　おうさまも\n　まおうの　うわさに　おびえておる。」",
    ],
    "👧": [
      "「レベルが　あがると\n　いろんな　じゅもんや　ひっさつを　おぼえるよ！」",
      "「スライムは　かわいいけど\n　なかまに　なったりは　しないんだって。」",
    ],
  },
  town2: {
    "🧙": [
      "「ホイミや　ベホイミで\n　じぶんを　まもるのじゃ。」",
      "「ギラや　イオは\n　つよい　ちからを　ひめておるぞ。」",
    ],
  },
  town3: {
    "👦": [
      "「やまの　うえは　かぜが　つよいんだ。」",
      "「このへんの　まものは\n　ちょっと　つよいから　きをつけてね。」",
    ],
    "🧔": [
      "「やまおくの　どうくつには\n　きょうぼうな　ドラゴンが　いるという。」",
      "「ぶきや　ぼうぐを　ととのえてから\n　ちょうせんするんだな。」",
    ],
  },
};
// -------------------------------
// 効果音
// -------------------------------
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function playBeep(freq, duration, type = "square", volume = 0.06, delay = 0) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const t = ctx.currentTime + delay;
  osc.start(t);
  osc.stop(t + duration);
}
const SFX = {
  encounter() {
    playBeep(880, 0.09, "square", 0.06, 0);
    playBeep(1320, 0.09, "square", 0.06, 0.08);
  },
  attack() {
    playBeep(600, 0.06, "square", 0.07, 0);
    playBeep(500, 0.06, "square", 0.07, 0.05);
  },
  damage() {
    playBeep(300, 0.08, "sawtooth", 0.07, 0);
    playBeep(200, 0.08, "sawtooth", 0.07, 0.07);
  },
  win() {
    playBeep(880, 0.08, "triangle", 0.06, 0);
    playBeep(1100, 0.08, "triangle", 0.06, 0.08);
    playBeep(1320, 0.1, "triangle", 0.06, 0.16);
  },
  levelUp() {
    playBeep(600, 0.08, "triangle", 0.07, 0);
    playBeep(800, 0.08, "triangle", 0.07, 0.08);
    playBeep(1000, 0.08, "triangle", 0.07, 0.16);
    playBeep(1200, 0.12, "triangle", 0.07, 0.24);
  },
  heal() {
    playBeep(900, 0.08, "sine", 0.06, 0);
    playBeep(1200, 0.1, "sine", 0.06, 0.08);
  },
  runSuccess() {
    playBeep(700, 0.08, "triangle", 0.06, 0);
    playBeep(950, 0.08, "triangle", 0.06, 0.07);
  },
  runFail() {
    playBeep(400, 0.08, "triangle", 0.06, 0);
    playBeep(250, 0.08, "triangle", 0.06, 0.07);
  },
  spell() {
    playBeep(900, 0.06, "sine", 0.06, 0);
    playBeep(1200, 0.06, "sine", 0.06, 0.05);
    playBeep(1500, 0.1, "sine", 0.06, 0.1);
  },
  tech() {
    playBeep(1200, 0.06, "sawtooth", 0.07, 0);
    playBeep(900, 0.06, "sawtooth", 0.07, 0.05);
    playBeep(600, 0.08, "sawtooth", 0.07, 0.1);
  },
  shop() {
    playBeep(1000, 0.06, "square", 0.06, 0);
    playBeep(1300, 0.08, "square", 0.06, 0.06);
  },
  chest() {
    playBeep(700, 0.06, "triangle", 0.06, 0);
    playBeep(900, 0.08, "triangle", 0.06, 0.06);
    playBeep(1100,0.1,  "triangle", 0.06, 0.12);
  },
};
// -------------------------------
// 状態＆DOM参照
// -------------------------------
let inBattle = false;
let inBossBattle = false;
let currentBossKey = null;
let currentBossIndex = null;
let currentEnemy = null;
let techUsedThisBattle = false;
let statusOpen = false;
const mapEl = document.getElementById("map");
const msgLogEl = document.getElementById("message-log");
const stNameEl = document.getElementById("st-name");
const stLevelEl = document.getElementById("st-level");
const stHpEl = document.getElementById("st-hp");
const stMpEl = document.getElementById("st-mp");
const stExpEl = document.getElementById("st-exp");
const stNextExpEl = document.getElementById("st-next-exp");
const stGoldEl = document.getElementById("st-gold");
const battlePanelEl = document.getElementById("battle-panel");
const enemyEmojiEl = document.getElementById("enemy-emoji");
const enemyNameEl = document.getElementById("enemy-name");
const enemyHpEl = document.getElementById("enemy-hp");
const cmdAttackBtn = document.getElementById("cmd-attack");
const cmdSpellBtn = document.getElementById("cmd-spell");
const cmdTechBtn = document.getElementById("cmd-tech");
const cmdHealBtn = document.getElementById("cmd-heal");
const cmdRunBtn = document.getElementById("cmd-run");
const statusOverlayEl = document.getElementById("status-overlay");
const statusDetailEl = document.getElementById("status-detail");
const statusWindowEl = document.getElementById("status-window");
// スマホ用ボタン
const dpadButtons = document.querySelectorAll("#dpad button");
const btnStatus = document.getElementById("btn-status");
const btnOk = document.getElementById("btn-ok");
// -------------------------------
// 初期化
// -------------------------------
function init() {
  renderMap();
  updateStatus();
  writeMessage("ここは　ひろい　せかい。\nゆうしゃは　ぼうけんに　でた！");
}
window.addEventListener("load", init);
// -------------------------------
// 描画
// -------------------------------
function renderMap() {
  mapEl.innerHTML = "";
  const mapData = currentMap.data;
  const mapWidth = currentMap.width;
  const mapHeight = currentMap.height;
  const halfW = Math.floor(VIEW_WIDTH / 2);
  const halfH = Math.floor(VIEW_HEIGHT / 2);
  let startX = player.x - halfW;
  let startY = player.y - halfH;
  let endX = startX + VIEW_WIDTH - 1;
  let endY = startY + VIEW_HEIGHT - 1;
  if (startX < 0) { startX = 0; endX = VIEW_WIDTH - 1; }
  if (startY < 0) { startY = 0; endY = VIEW_HEIGHT - 1; }
  if (endX >= mapWidth) {
    endX = mapWidth - 1;
    startX = Math.max(0, endX - VIEW_WIDTH + 1);
  }
  if (endY >= mapHeight) {
    endY = mapHeight - 1;
    startY = Math.max(0, endY - VIEW_HEIGHT + 1);
  }
  for (let y = startY; y <= endY; y++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "map-row";
    for (let x = startX; x <= endX; x++) {
      const span = document.createElement("span");
      span.className = "tile";
      if (x === player.x && y === player.y) {
        span.textContent = player.emoji;
        span.classList.add("player");
      } else {
        span.textContent = mapData[y][x];
      }
      rowDiv.appendChild(span);
    }
    mapEl.appendChild(rowDiv);
  }
}
function updateStatus() {
  stNameEl.textContent = player.name;
  stLevelEl.textContent = player.level;
  stHpEl.textContent = `${player.hp}/${player.maxHp}`;
  stMpEl.textContent = `${player.mp}/${player.maxMp}`;
  stExpEl.textContent = player.exp;
  stNextExpEl.textContent = player.nextExp;
  stGoldEl.textContent = player.gold;
}
function writeMessage(text) {
  msgLogEl.textContent = text;
}
// -------------------------------
// ステータス画面
// -------------------------------
function updateStatusOverlay() {
  const atk = getPlayerAtk();
  const def = getPlayerDef();
  const weaponName = player.weapon ? `${player.weapon.name}（+${player.weapon.atk}）` : "なし";
  const armorName = player.armor ? `${player.armor.name}（+${player.armor.def}）` : "なし";
  const spells = player.spells.length ? player.spells.join(" / ") : "なし";
  const techs  = player.techs.length  ? player.techs.join(" / ")  : "なし";
  let itemLines = "";
  for (const key of Object.keys(ITEM_DEFS)) {
    const def = ITEM_DEFS[key];
    const cnt = player.items[key] || 0;
    itemLines += `  ${def.name}: ${cnt}こ\n`;
  }
  let text = "";
  text += `なまえ: ${player.name}\n`;
  text += `レベル: ${player.level}\n`;
  text += `HP   : ${player.hp}/${player.maxHp}\n`;
  text += `MP   : ${player.mp}/${player.maxMp}\n`;
  text += `ちから: ${atk}（基礎${player.atk} + 武器${player.weapon?.atk || 0} + バフ${battleBuff.atk}）\n`;
  text += `まもり: ${def}（基礎${player.def} + 防具${player.armor?.def || 0} + バフ${battleBuff.def}）\n`;
  text += `EXP  : ${player.exp}/${player.nextExp}\n`;
  text += `G    : ${player.gold}\n`;
  text += `\n[そうび]\n`;
  text += `  ぶき: ${weaponName}\n`;
  text += `  よろい: ${armorName}\n`;
  text += `\n[どうぐ]\n${itemLines}`;
  text += `\n[じゅもん]\n  ${spells}\n`;
  text += `\n[ひっさつ]\n  ${techs}\n`;
  statusDetailEl.textContent = text;
}
function openStatusOverlay() {
  statusOpen = true;
  updateStatusOverlay();
  statusOverlayEl.classList.remove("hidden");
}
function closeStatusOverlay() {
  statusOpen = false;
  statusOverlayEl.classList.add("hidden");
}
statusOverlayEl.addEventListener("click", (e) => {
  if (!statusOpen) return;
  if (!statusWindowEl.contains(e.target)) {
    closeStatusOverlay();
  }
});
// -------------------------------
// 入力（キーボード）
// -------------------------------
document.addEventListener("keydown", (e) => {
  // Sキーでステータス
  if (e.key === "s" || e.key === "S") {
    e.preventDefault();
    if (inBattle) return;
    if (statusOpen) closeStatusOverlay();
    else openStatusOverlay();
    return;
  }
  // ショップ購入確定（Zキー）
  if (pendingShop && (e.key === "z" || e.key === "Z")) {
    e.preventDefault();
    handleShopConfirm();
    return;
  }
  if (statusOpen) {
    if (e.key === "Escape") closeStatusOverlay();
    return;
  }
  if (inBattle) return;
  let dx = 0, dy = 0;
  switch (e.key) {
    case "ArrowUp": dy = -1; break;
    case "ArrowDown": dy = 1; break;
    case "ArrowLeft": dx = -1; break;
    case "ArrowRight": dx = 1; break;
    default: return;
  }
  e.preventDefault();
  tryMove(dx, dy);
});
// -------------------------------
// 入力（スマホ用タッチ）
// -------------------------------
// 十字キーで移動
dpadButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (inBattle || statusOpen) return;
    const dir = btn.dataset.dir;
    let dx = 0, dy = 0;
    if (dir === "up") dy = -1;
    else if (dir === "down") dy = 1;
    else if (dir === "left") dx = -1;
    else if (dir === "right") dx = 1;
    tryMove(dx, dy);
  });
});
// ステータスボタン
btnStatus.addEventListener("click", () => {
  if (inBattle) return;
  if (statusOpen) closeStatusOverlay();
  else openStatusOverlay();
});
// 「決定 / かう」ボタン（ショップ購入）
btnOk.addEventListener("click", () => {
  if (pendingShop) {
    handleShopConfirm();
  }
});
// -------------------------------
// 移動・マップ遷移・宝箱
// -------------------------------
function tryMove(dx, dy) {
  const mapData = currentMap.data;
  const mapWidth = currentMap.width;
  const mapHeight = currentMap.height;
  const nx = player.x + dx;
  const ny = player.y + dy;
  if (nx < 0 || nx >= mapWidth || ny < 0 || ny >= mapHeight) return;
  const tile = mapData[ny][nx];
  if (BLOCK_TILES.has(tile)) {
    writeMessage("そこには　いけない！");
    return;
  }
  player.x = nx;
  player.y = ny;
  renderMap();
  if (handleMapTransition(tile)) return;
  if (handleBossOnTile(tile)) return;
  if (currentMap.id === "world" && tile === TILE.CASTLE) {
    if (!bossState.final && bossState.cave1 && bossState.cave2 && bossState.cave3) {
      startBossBattle("final", 3);
      return;
    }
    writeMessage("ここは　しろだ。\nHPとMPが　かいふくした！");
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    updateStatus();
    SFX.heal();
    return;
  }
  // 洞窟内の宝箱
  if (currentMap.type === MAP_TYPE.CAVE &&
      currentMap.data[player.y][player.x] === TILE.CHEST) {
    openChestAt(player.x, player.y);
    return;
  }
  if (currentMap.type === MAP_TYPE.TOWN) {
    handleTownTile(tile);
    return;
  }
  checkEncounter(tile);
}
function enterSubMap(mapId, message) {
  const next = maps[mapId];
  currentMap = next;
  player.x = next.entry.x;
  player.y = next.entry.y;
  renderMap();
  updateStatus();
  writeMessage(
    message ||
    (next.type === MAP_TYPE.CAVE ? "くらやみの　どうくつだ。" :
     next.type === MAP_TYPE.TOWN ? "にぎやかな　まちに　やってきた。" :
     "")
  );
}
function returnToWorld(whichKey) {
  currentMap = maps.world;
  const pos = maps.world.entrances[whichKey];
  player.x = pos.x;
  player.y = pos.y;
  renderMap();
  updateStatus();
  writeMessage("もとの　せかいに　もどってきた。");
}
function handleMapTransition(tile) {
  if (currentMap.id === "world") {
    if (tile === TILE.CAVE1_ENTRANCE) {
      enterSubMap("cave1_1", "どうくつの　なかに　はいった。");
      return true;
    }
    if (tile === TILE.CAVE2_ENTRANCE) {
      enterSubMap("cave2_1", "がけの　どうくつに　はいった。");
      return true;
    }
    if (tile === TILE.CAVE3_ENTRANCE) {
      enterSubMap("cave3_1", "もりのおくの　どうくつだ。");
      return true;
    }
    if (tile === TILE.TOWN1_ENTRANCE) {
      enterSubMap("town1", "ちいさな　まちに　ついた。");
      return true;
    }
    if (tile === TILE.TOWN2_ENTRANCE) {
      enterSubMap("town2", "みずの　みやこに　ついた。");
      return true;
    }
    if (tile === TILE.TOWN3_ENTRANCE) {
      enterSubMap("town3", "やまの　まちに　ついた。");
      return true;
    }
    return false;
  }
  if (currentMap.type === MAP_TYPE.CAVE) {
    if (tile === TILE.CAVE_EXIT) {
      if (currentMap.exitToWorldKey) {
        returnToWorld(currentMap.exitToWorldKey);
        return true;
      } else if (currentMap.upMapId) {
        enterSubMap(currentMap.upMapId, "いっかい　うえの　かいに　あがった。");
        return true;
      }
    }
    if (tile === TILE.CAVE_DOWN && currentMap.downMapId) {
      enterSubMap(currentMap.downMapId, "さらに　ふかい　かいへ　おりていった。");
      return true;
    }
  }
  if (currentMap.type === MAP_TYPE.TOWN && tile === TILE.TOWN_EXIT) {
    if (currentMap.exitToWorldKey) {
      returnToWorld(currentMap.exitToWorldKey);
      return true;
    }
  }
  return false;
}
// 宝箱を開ける
function openChestAt(x, y) {
  const mapId = currentMap.id;
  let msg = "ゆうしゃは　たからばこを　あけた！\n";
  let gold = 0;
  let itemKey = null;
  let weaponName = null;
  let armorName = null;
  const r = Math.random();
  if (mapId.startsWith("cave1")) {
    if (r < 0.4) { gold = 20 + Math.floor(Math.random() * 20); }
    else if (r < 0.8) { itemKey = "herb"; }
    else { itemKey = "hiHerb"; }
  } else if (mapId.startsWith("cave2")) {
    if (r < 0.3) { gold = 30 + Math.floor(Math.random() * 40); }
    else if (r < 0.6) { itemKey = "hiHerb"; }
    else if (r < 0.8) { itemKey = "powerSeed"; }
    else { itemKey = "guardSeed"; }
  } else if (mapId.startsWith("cave3")) {
    if (r < 0.3) { gold = 50 + Math.floor(Math.random() * 60); }
    else if (r < 0.6) { itemKey = "hiHerb"; }
    else if (r < 0.8) { itemKey = "powerSeed"; }
    else { itemKey = "guardSeed"; }
  } else {
    gold = 10 + Math.floor(Math.random() * 10);
  }
  // めったに装備が出る
  if (mapId === "cave3_2" && Math.random() < 0.15) {
    if (Math.random() < 0.5) {
      weaponName = "ぎんのつるぎ";
    } else {
      armorName = "ドラゴンメイル";
    }
  }
  if (gold > 0) {
    player.gold += gold;
    msg += `${gold}ゴールドを　てにいれた！\n`;
  }
  if (itemKey) {
    player.items[itemKey] = (player.items[itemKey] || 0) + 1;
    msg += `${ITEM_DEFS[itemKey].name} を　1こ　てにいれた！\n`;
  }
  if (weaponName) {
    const w = WEAPONS[weaponName];
    if (!player.weapon || player.weapon.atk < w.atk) {
      player.weapon = { name: weaponName, ...w };
      msg += `${weaponName} を　てにいれた！\n`;
    } else {
      msg += `${weaponName} を　みつけたが　いまのぶきのほうが　つよかった。\n`;
    }
  }
  if (armorName) {
    const a = ARMORS[armorName];
    if (!player.armor || player.armor.def < a.def) {
      player.armor = { name: armorName, ...a };
      msg += `${armorName} を　てにいれた！\n`;
    } else {
      msg += `${armorName} を　みつけたが　いまのぼうぐのほうが　つよかった。\n`;
    }
  }
  if (gold === 0 && !itemKey && !weaponName && !armorName) {
    msg += "しかし　なかは　からっぽだった……\n";
  }
  currentMap.data[y][x] = TILE.CAVE_FLOOR;
  updateStatus();
  renderMap();
  writeMessage(msg.trimEnd());
  SFX.chest();
}
// -------------------------------
// ボス戦
// -------------------------------
function handleBossOnTile(tile) {
  if (tile !== TILE.BOSS && !(currentMap.id === "world" && tile === TILE.CASTLE)) {
    return false;
  }
  if (currentMap.id === "cave1_2" && tile === TILE.BOSS && !bossState.cave1) {
    startBossBattle("cave1", 0);
    return true;
  }
  if (currentMap.id === "cave2_2" && tile === TILE.BOSS && !bossState.cave2) {
    startBossBattle("cave2", 1);
    return true;
  }
  if (currentMap.id === "cave3_2" && tile === TILE.BOSS && !bossState.cave3) {
    startBossBattle("cave3", 2);
    return true;
  }
  return false;
}
function startBossBattle(key, index) {
  inBattle = true;
  inBossBattle = true;
  currentBossKey = key;
  currentBossIndex = index;
  techUsedThisBattle = false;
  battleBuff = { atk: 0, def: 0 };
  const tmpl = BOSS_ENEMIES[index];
  currentEnemy = {
    name: tmpl.name,
    emoji: tmpl.emoji,
    maxHp: tmpl.maxHp,
    hp: tmpl.maxHp,
    atk: tmpl.atk,
    def: tmpl.def,
    exp: tmpl.exp,
    gold: tmpl.gold,
  };
  battlePanelEl.classList.remove("hidden");
  enemyEmojiEl.textContent = currentEnemy.emoji;
  enemyNameEl.textContent = currentEnemy.name;
  updateEnemyHp();
  writeMessage(`${currentEnemy.name} が　たちはだかった！`);
  SFX.encounter();
}
// -------------------------------
// 街：店＋NPC
// -------------------------------
function handleTownTile(tile) {
  if (tile === TILE.SHOP_INN) {
    openInn(12);
    return;
  }
  if (tile === TILE.SHOP_WEAPON) {
    openWeaponShop();
    return;
  }
  if (tile === TILE.SHOP_ARMOR) {
    openArmorShop();
    return;
  }
  if (tile === TILE.SHOP_ITEM) {
    openItemShop();
    return;
  }
  if (NPC_TILES.has(tile)) {
    talkToNpc(tile, currentMap.id);
    return;
  }
  writeMessage("まちは　へいわだ。");
}
function openInn(price) {
  writeMessage(`ここは　やどやだ。\n${price}Gで　とまって　いくかい？`);
  const yes = window.confirm(`${price}Gで　とまりますか？`);
  if (!yes) return;
  if (player.gold < price) {
    writeMessage("おかねが　たりない！");
    return;
  }
  player.gold -= price;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  updateStatus();
  writeMessage("ゆうしゃは　やどに　とまった！\nHPとMPが　かいふくした！");
  SFX.heal();
}
// 武器屋（決定/Zキーで即購入）
function openWeaponShop() {
  let name, flagKey;
  if (currentMap.id === "town1") {
    name = "こんぼう"; flagKey = "town1WeaponBought";
  } else if (currentMap.id === "town2") {
    name = "どうのつるぎ"; flagKey = "town2WeaponBought";
  } else {
    name = "てつのつるぎ"; flagKey = "town3WeaponBought";
  }
  if (!WEAPONS[name]) {
    writeMessage("「いま　うる　ぶきは　ないよ。」");
    return;
  }
  if (shopFlags[flagKey]) {
    writeMessage("「もう　あたえる　ぶきは　のこってないよ。」");
    return;
  }
  const w = WEAPONS[name];
  const newAtk = w.atk;
  const oldAtk = player.weapon?.atk || 0;
  const diff = newAtk - oldAtk;
  const trade = player.weapon ? (player.weapon.sell || Math.floor((player.weapon.price || 0) / 2)) : 0;
  const netPrice = w.price - trade;
  let msg = `「${name}　は　どうだい？」\n`;
  msg += `  いまのぶき: ${player.weapon?.name || "なし"}（+${oldAtk}）\n`;
  msg += `  あたらしい: ${name}（+${newAtk}）\n`;
  msg += `  こうげき: ${diff >= 0 ? "+" + diff : diff} されるはずだよ。\n`;
  msg += `  きみのぶきを　${trade}Gで　ひきとるから\n  じっさいの しはらいは ${netPrice}G だね。\n`;
  msg += `\nかうなら　したの『決定』ボタンを　おしてくれ。`;
  writeMessage(msg);
  pendingShop = {
    kind: "weapon",
    name,
    flagKey,
    netPrice,
    data: w,
  };
}
// 防具屋（決定/Zキーで即購入）
function openArmorShop() {
  let name, flagKey;
  if (currentMap.id === "town1") {
    name = "かわのよろい"; flagKey = "town1ArmorBought";
  } else if (currentMap.id === "town2") {
    name = "くさりかたびら"; flagKey = "town2ArmorBought";
  } else {
    name = "てつのよろい"; flagKey = "town3ArmorBought";
  }
  if (!ARMORS[name]) {
    writeMessage("「いま　うる　ぼうぐは　ないよ。」");
    return;
  }
  if (shopFlags[flagKey]) {
    writeMessage("「もう　あたえる　ぼうぐは　のこってないよ。」");
    return;
  }
  const a = ARMORS[name];
  const newDef = a.def;
  const oldDef = player.armor?.def || 0;
  const diff = newDef - oldDef;
  const trade = player.armor ? (player.armor.sell || Math.floor((player.armor.price || 0) / 2)) : 0;
  const netPrice = a.price - trade;
  let msg = `「${name}　は　どうだい？」\n`;
  msg += `  いまのよろい: ${player.armor?.name || "なし"}（+${oldDef}）\n`;
  msg += `  あたらしい: ${name}（+${newDef}）\n`;
  msg += `  まもり: ${diff >= 0 ? "+" + diff : diff} されるはずだよ。\n`;
  msg += `  きみのよろいを　${trade}Gで　ひきとるから\n  じっさいの しはらいは ${netPrice}G だね。\n`;
  msg += `\nかうなら　したの『決定』ボタンを　おしてくれ。`;
  writeMessage(msg);
  pendingShop = {
    kind: "armor",
    name,
    flagKey,
    netPrice,
    data: a,
  };
}
// 道具屋（決定/Zキーで即購入）
function openItemShop() {
  let key;
  if (currentMap.id === "town1") {
    key = "herb";
  } else if (currentMap.id === "town2") {
    key = "hiHerb";
  } else {
    key = Math.random() < 0.5 ? "powerSeed" : "guardSeed";
  }
  const def = ITEM_DEFS[key];
  const price = def.price;
  let msg = `「${def.name}　はいかがです？\n　ひとつ ${price}G ですよ。」\n`;
  msg += `\nかうなら　したの『決定』ボタンを　おしてくれ。`;
  writeMessage(msg);
  pendingShop = {
    kind: "item",
    itemKey: key,
    price,
  };
}
// 決定/Zキーでの購入確定処理（confirmなし）
function handleShopConfirm() {
  if (!pendingShop) return;
  if (pendingShop.kind === "weapon") {
    const { name, flagKey, netPrice, data } = pendingShop;
    if (player.gold < netPrice) {
      writeMessage("「おかねが　たりないみたいだね。」");
      pendingShop = null;
      return;
    }
    player.gold -= netPrice;
    player.weapon = { name, ...data };
    shopFlags[flagKey] = true;
    updateStatus();
    writeMessage(`ゆうしゃは　${name} を　てにいれた！\nちからが　あがった！`);
    SFX.shop();
    pendingShop = null;
    return;
  }
  if (pendingShop.kind === "armor") {
    const { name, flagKey, netPrice, data } = pendingShop;
    if (player.gold < netPrice) {
      writeMessage("「おかねが　たりないみたいだね。」");
      pendingShop = null;
      return;
    }
    player.gold -= netPrice;
    player.armor = { name, ...data };
    shopFlags[flagKey] = true;
    updateStatus();
    writeMessage(`ゆうしゃは　${name} を　てにいれた！\nまもりが　あがった！`);
    SFX.shop();
    pendingShop = null;
    return;
  }
  if (pendingShop.kind === "item") {
    const { itemKey, price } = pendingShop;
    const def = ITEM_DEFS[itemKey];
    if (player.gold < price) {
      writeMessage("「おかねが　たりないみたいだね。」");
      pendingShop = null;
      return;
    }
    player.gold -= price;
    player.items[itemKey] = (player.items[itemKey] || 0) + 1;
    updateStatus();
    writeMessage(`ゆうしゃは　${def.name} を　1こ　てにいれた！`);
    SFX.shop();
    pendingShop = null;
    return;
  }
  pendingShop = null;
}
function talkToNpc(tile, mapId) {
  const table = NPC_DIALOG[mapId];
  let msg = "";
  if (table && table[tile]) {
    const arr = table[tile];
    msg = arr[Math.floor(Math.random() * arr.length)];
  } else {
    msg = "「よそから　きたのかい？」";
  }
  writeMessage(msg);
}
// -------------------------------
// エンカウント・戦闘
// -------------------------------
function checkEncounter(tile) {
  const table = ENCOUNTER_RATE[currentMap.type] || {};
  const rate = table[tile] ?? 0;
  if (Math.random() < rate) {
    startNormalBattle();
  } else {
    writeMessage("あたりを　みわたした。");
  }
}
function startNormalBattle() {
  inBattle = true;
  inBossBattle = false;
  currentBossKey = null;
  currentBossIndex = null;
  techUsedThisBattle = false;
  battleBuff = { atk: 0, def: 0 };
  let candidates;
  if (player.level < 3) {
    candidates = ENEMIES.slice(0, 3);
  } else if (player.level < 5) {
    candidates = ENEMIES.slice(1, 4);
  } else if (player.level < 7) {
    candidates = ENEMIES.slice(2, 6);
  } else if (player.level < 9) {
    candidates = ENEMIES.slice(3, 7);
  } else {
    candidates = ENEMIES.slice(4, 8);
  }
  let tmpl = candidates[Math.floor(Math.random() * candidates.length)];
  // たまにメタルスライム
  if (Math.random() < 0.07) {
    tmpl = ENEMIES[8]; // メタルスライム
  }
  currentEnemy = {
    name: tmpl.name,
    emoji: tmpl.emoji,
    maxHp: tmpl.maxHp,
    hp: tmpl.maxHp,
    atk: tmpl.atk,
    def: tmpl.def,
    exp: tmpl.exp,
    gold: tmpl.gold,
  };
  battlePanelEl.classList.remove("hidden");
  enemyEmojiEl.textContent = currentEnemy.emoji;
  enemyNameEl.textContent = currentEnemy.name;
  updateEnemyHp();
  writeMessage(`${currentEnemy.name} が　あらわれた！`);
  SFX.encounter();
}
function updateEnemyHp() {
  enemyHpEl.textContent = `${currentEnemy.hp}/${currentEnemy.maxHp}`;
}
function endBattle() {
  inBattle = false;
  inBossBattle = false;
  currentBossKey = null;
  currentBossIndex = null;
  currentEnemy = null;
  battlePanelEl.classList.add("hidden");
  battleBuff = { atk: 0, def: 0 };
  renderMap();
}
function calcDamage(attackerAtk, target) {
  const targetDef = target.def ?? 0;
  const raw = attackerAtk - Math.floor(targetDef * 0.7);
  const base = Math.max(1, raw);
  const variance = 4;
  const dmg = base + Math.floor(Math.random() * variance);
  return Math.max(1, dmg);
}
function enemyAttack() {
  if (!currentEnemy) return;
  const dmg = calcDamage(currentEnemy.atk, { def: getPlayerDef() });
  player.hp = Math.max(0, player.hp - dmg);
  updateStatus();
  writeMessage(`${currentEnemy.name} の　こうげき！\nゆうしゃは　${dmg} のダメージを　うけた！`);
  SFX.damage();
  if (player.hp <= 0) {
    setTimeout(() => {
      writeMessage("ゆうしゃは　ちからつきた……\nHPとMPが　かいふくし　しろに　もどされた。");
      currentMap = maps.world;
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      player.x = CASTLE_POS.x;
      player.y = CASTLE_POS.y;
      updateStatus();
      renderMap();
      endBattle();
    }, 800);
  }
}
function winBattle() {
  const expGain = currentEnemy.exp;
  const goldGain = currentEnemy.gold;
  player.exp += expGain;
  player.gold += goldGain;
  updateStatus();
  let msg = `${currentEnemy.name} を　たおした！\n`;
  msg += `${expGain} のけいけんちを　えた！\n`;
  msg += `${goldGain} ゴールドを　てにいれた！`;
  // ボス撃破処理＆ボス消去
  if (inBossBattle && currentBossKey) {
    if (!bossState[currentBossKey]) {
      bossState[currentBossKey] = true;
      if (currentMap.type === MAP_TYPE.CAVE &&
          currentMap.data[player.y][player.x] === TILE.BOSS) {
        currentMap.data[player.y][player.x] = TILE.CAVE_FLOOR;
      }
      if (currentBossKey === "cave1") {
        const w = WEAPONS["ぎんのつるぎ"];
        if (!player.weapon || player.weapon.atk < w.atk) {
          player.weapon = { name: "ぎんのつるぎ", ...w };
          msg += `\n\nボスを　たおし　ぎんのつるぎを　てにいれた！`;
        } else {
          msg += `\n\nボスを　たおしたが　とくべつな　ぶきは　なにも　みつからなかった。`;
        }
      } else if (currentBossKey === "cave2") {
        const a = ARMORS["ドラゴンメイル"];
        if (!player.armor || player.armor.def < a.def) {
          player.armor = { name: "ドラゴンメイル", ...a };
          msg += `\n\nボスを　たおし　ドラゴンメイルを　てにいれた！`;
        } else {
          msg += `\n\nボスを　たおしたが　とくべつな　ぼうぐは　なにも　みつからなかった。`;
        }
      } else if (currentBossKey === "cave3") {
        const w = WEAPONS["まじんのかなづち"];
        if (!player.weapon || player.weapon.atk < w.atk) {
          player.weapon = { name: "まじんのかなづち", ...w };
          msg += `\n\nボスを　たおし　まじんのかなづちを　てにいれた！`;
        } else {
          msg += `\n\nボスを　たおしたが　とくべつな　ぶきは　なにも　みつからなかった。`;
        }
      } else if (currentBossKey === "final") {
        msg += `\n\nまおうを　たおした！\nせかいに　へいわが　もどった！`;
      } else {
        msg += `\n\nまおうの　ちからが　よわまったようだ。`;
      }
    }
  }
  writeMessage(msg);
  SFX.win();
  if (player.exp >= player.nextExp) {
    levelUp();
  }
  setTimeout(() => {
    endBattle();
  }, 900);
}
function levelUp() {
  player.level++;
  const hpUp = 6 + Math.floor(Math.random() * 5);
  const mpUp = 3 + Math.floor(Math.random() * 3);
  const atkUp = 1 + Math.floor(Math.random() * 2);
  const defUp = 1 + (Math.random() < 0.5 ? 1 : 0);
  player.maxHp += hpUp;
  player.maxMp += mpUp;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.atk += atkUp;
  player.def += defUp;
  player.nextExp = Math.floor(player.nextExp * 2.1); // 必要EXPを重く
  let msg = `レベルが　あがった！\n`;
  msg += `最大HPが　${hpUp} あがった！\n`;
  msg += `最大MPが　${mpUp} あがった！\n`;
  msg += `ちからが　${atkUp} あがった！\n`;
  msg += `みのまもりが　${defUp} あがった！`;
  // 呪文習得
  if (player.level === 2 && !player.spells.includes("ホイミ")) {
    player.spells.push("ホイミ");
    msg += `\nホイミを　おぼえた！`;
  }
  if (player.level === 3 && !player.spells.includes("ギラ")) {
    player.spells.push("ギラ");
    msg += `\nギラを　おぼえた！`;
  }
  if (player.level === 4 && !player.spells.includes("スカラ")) {
    player.spells.push("スカラ");
    msg += `\nスカラを　おぼえた！（ぼうぎょ力アップ）`;
  }
  if (player.level === 5 && !player.spells.includes("ベホイミ")) {
    player.spells.push("ベホイミ");
    msg += `\nベホイミを　おぼえた！`;
  }
  if (player.level === 6 && !player.spells.includes("バイキルト")) {
    player.spells.push("バイキルト");
    msg += `\nバイキルトを　おぼえた！（こうげき力アップ）`;
  }
  if (player.level === 7 && !player.spells.includes("イオ")) {
    player.spells.push("イオ");
    msg += `\nイオを　おぼえた！`;
  }
  if (player.level === 9 && !player.spells.includes("ベホマ")) {
    player.spells.push("ベホマ");
    msg += `\nベホマを　おぼえた！（HP全回復）`;
  }
  if (player.level === 10 && !player.spells.includes("メラゾーマ")) {
    player.spells.push("メラゾーマ");
    msg += `\nメラゾーマを　おぼえた！（つよい　ひの　じゅもん）`;
  }
  if (player.level === 11 && !player.spells.includes("イオナズン")) {
    player.spells.push("イオナズン");
    msg += `\nイオナズンを　おぼえた！（さいきょうクラスの　じゅもん）`;
  }
  // 必殺技
  if (player.level === 4 && !player.techs.includes("かいしんぎり")) {
    player.techs.push("かいしんぎり");
    msg += `\nひっさつ「かいしんぎり」を　おぼえた！`;
  }
  if (player.level === 6 && !player.techs.includes("みだれぎり")) {
    player.techs.push("みだれぎり");
    msg += `\nひっさつ「みだれぎり」を　おぼえた！`;
  }
  if (player.level === 8 && !player.techs.includes("まわしげり")) {
    player.techs.push("まわしげり");
    msg += `\nひっさつ「まわしげり」を　おぼえた！`;
  }
  if (player.level === 9 && !player.techs.includes("きりさきのまい")) {
    player.techs.push("きりさきのまい");
    msg += `\nひっさつ「きりさきのまい」を　おぼえた！`;
  }
  if (player.level === 10 && !player.techs.includes("かげぶんしんぎり")) {
    player.techs.push("かげぶんしんぎり");
    msg += `\nひっさつ「かげぶんしんぎり」を　おぼえた！`;
  }
  updateStatus();
  writeMessage(msg);
  SFX.levelUp();
}
// -------------------------------
// エフェクト
// -------------------------------
function showEnemyEffect(kind) {
  const cls = kind === "spell" ? "effect-spell" : "effect-tech";
  enemyEmojiEl.classList.add(cls);
  setTimeout(() => {
    enemyEmojiEl.classList.remove(cls);
  }, 400);
}
// -------------------------------
// コマンド：たたかう / どうぐ / にげる
// -------------------------------
cmdAttackBtn.addEventListener("click", () => {
  if (!inBattle || !currentEnemy) return;
  const dmg = calcDamage(getPlayerAtk(), currentEnemy);
  currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
  writeMessage(`ゆうしゃの　こうげき！\n${currentEnemy.name} に　${dmg} のダメージ！`);
  SFX.attack();
  updateEnemyHp();
  if (currentEnemy.hp <= 0) { winBattle(); return; }
  setTimeout(enemyAttack, 600);
});
// 「どうぐ」ボタン（戦闘中アイテム使用）
cmdHealBtn.addEventListener("click", () => {
  if (!inBattle || !currentEnemy) return;
  useItemInBattle();
});
function useItemInBattle() {
  const entries = Object.entries(player.items)
    .filter(([key, count]) => count > 0 && ITEM_DEFS[key]);
  if (entries.length === 0) {
    writeMessage("つかえる　どうぐを　もっていない。");
    return;
  }
  let menu = "つかう　どうぐを　えらんでください。\n";
  entries.forEach(([key, count], i) => {
    const def = ITEM_DEFS[key];
    menu += `${i + 1}: ${def.name} x${count}\n`;
  });
  const choice = window.prompt(menu);
  if (!choice) return;
  const idx = parseInt(choice, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= entries.length) {
    writeMessage("わからない　どうぐ　だ。");
    return;
  }
  const [key] = entries[idx];
  const def = ITEM_DEFS[key];
  player.items[key]--;
  if (def.type === "heal") {
    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + def.heal);
    const real = player.hp - before;
    updateStatus();
    writeMessage(`ゆうしゃは　${def.name} を　つかった！\nHPが　${real} かいふくした！`);
    SFX.heal();
    setTimeout(enemyAttack, 600);
  } else if (def.type === "buff") {
    if (def.buff === "atk") {
      battleBuff.atk += def.amount;
      writeMessage(`ゆうしゃは　${def.name} を　つかった！\nちからが　${def.amount} あがった！`);
    } else if (def.buff === "def") {
      battleBuff.def += def.amount;
      writeMessage(`ゆうしゃは　${def.name} を　つかった！\nみのまもりが　${def.amount} あがった！`);
    }
    SFX.spell();
    setTimeout(enemyAttack, 600);
  } else {
    writeMessage("その　どうぐは　いまは　つかえないようだ。");
  }
}
cmdRunBtn.addEventListener("click", () => {
  if (!inBattle || !currentEnemy) return;
  const success = Math.random() < 0.6;
  if (success) {
    writeMessage("うまく　にげきれた！");
    SFX.runSuccess();
    endBattle();
  } else {
    writeMessage("にげられなかった！");
    SFX.runFail();
    setTimeout(enemyAttack, 600);
  }
});
// -------------------------------
// じゅもん（MP制）
// -------------------------------
cmdSpellBtn.addEventListener("click", () => {
  if (!inBattle || !currentEnemy) return;
  if (player.spells.length === 0) {
    writeMessage("まだ　つかえる　じゅもんを　おぼえていない。");
    return;
  }
  let menu = "つかう　じゅもんを　えらんでください。\n";
  player.spells.forEach((name, i) => {
    const cost = SPELL_COST[name] ?? 0;
    menu += `${i + 1}: ${name} (MP${cost})\n`;
  });
  const choice = window.prompt(menu);
  if (!choice) return;
  const idx = parseInt(choice, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= player.spells.length) {
    writeMessage("わからない　じゅもん　だ。");
    return;
  }
  castSpell(player.spells[idx]);
});
function castSpell(name) {
  if (!inBattle || !currentEnemy) return;
  const cost = SPELL_COST[name] ?? 0;
  if (player.mp < cost) {
    writeMessage("しかし　MPが　たりない！");
    return;
  }
  player.mp -= cost;
  updateStatus();
  if (name === "ホイミ") {
    const healAmount = 25;
    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    const real = player.hp - before;
    updateStatus();
    writeMessage(`ゆうしゃは　ホイミを　となえた！\nHPが　${real} かいふくした！`);
    SFX.spell();
    showEnemyEffect("spell");
    setTimeout(enemyAttack, 600);
  } else if (name === "ベホイミ") {
    const healAmount = 60;
    const before = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    const real = player.hp - before;
    updateStatus();
    writeMessage(`ゆうしゃは　ベホイミを　となえた！\nHPが　${real} かいふくした！`);
    SFX.spell();
    showEnemyEffect("spell");
    setTimeout(enemyAttack, 600);
  } else if (name === "ベホマ") {
    const before = player.hp;
    player.hp = player.maxHp;
    const real = player.hp - before;
    updateStatus();
    writeMessage(`ゆうしゃは　ベホマを　となえた！\nHPが　${real} かいふくした！`);
    SFX.spell();
    showEnemyEffect("spell");
    setTimeout(enemyAttack, 600);
  } else if (name === "ギラ") {
    const dmg = 14 + Math.floor(Math.random() * 10);
    currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    writeMessage(`ゆうしゃは　ギラを　となえた！\n${currentEnemy.name} に　${dmg} のダメージ！`);
    SFX.spell();
    showEnemyEffect("spell");
    updateEnemyHp();
    if (currentEnemy.hp <= 0) { winBattle(); return; }
    setTimeout(enemyAttack, 600);
  } else if (name === "イオ") {
    const dmg = 22 + Math.floor(Math.random() * 12);
    currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    writeMessage(`ゆうしゃは　イオを　となえた！\n${currentEnemy.name} に　${dmg} のダメージ！`);
    SFX.spell();
    showEnemyEffect("spell");
    updateEnemyHp();
    if (currentEnemy.hp <= 0) { winBattle(); return; }
    setTimeout(enemyAttack, 600);
  } else if (name === "メラゾーマ") {
    const dmg = 30 + Math.floor(Math.random() * 15);
    currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    writeMessage(`ゆうしゃは　メラゾーマを　となえた！\n${currentEnemy.name} に　${dmg} のダメージ！`);
    SFX.spell();
    showEnemyEffect("spell");
    updateEnemyHp();
    if (currentEnemy.hp <= 0) { winBattle(); return; }
    setTimeout(enemyAttack, 600);
  } else if (name === "イオナズン") {
    const dmg = 45 + Math.floor(Math.random() * 20);
    currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    writeMessage(`ゆうしゃは　イオナズンを　となえた！\n${currentEnemy.name} に　${dmg} のダメージ！`);
    SFX.spell();
    showEnemyEffect("spell");
    updateEnemyHp();
    if (currentEnemy.hp <= 0) { winBattle(); return; }
    setTimeout(enemyAttack, 600);
  } else if (name === "スカラ") {
    battleBuff.def += 4;
    writeMessage("ゆうしゃは　スカラを　となえた！\nみのまもりが　あがった！");
    SFX.spell();
    showEnemyEffect("spell");
    setTimeout(enemyAttack, 600);
  } else if (name === "バイキルト") {
    battleBuff.atk += 6;
    writeMessage("ゆうしゃは　バイキルトを　となえた！\nちからが　あがった！");
    SFX.spell();
    showEnemyEffect("spell");
    setTimeout(enemyAttack, 600);
  } else {
    writeMessage("その　じゅもんは　まだ　つかえない。");
  }
}
// -------------------------------
// ひっさつ（HP消費あり）
// -------------------------------
cmdTechBtn.addEventListener("click", () => {
  if (!inBattle || !currentEnemy) return;
  if (player.techs.length === 0) {
    writeMessage("まだ　ひっさつわざを　おぼえていない。");
    return;
  }
  let menu = "つかう　ひっさつわざを　えらんでください。\n";
  player.techs.forEach((name, i) => {
    const cost = TECH_HP_COST[name] ?? 0;
    menu += `${i + 1}: ${name} (HP${cost})\n`;
  });
  const choice = window.prompt(menu);
  if (!choice) return;
  const idx = parseInt(choice, 10) - 1;
  if (isNaN(idx) || idx < 0 || idx >= player.techs.length) {
    writeMessage("わからない　ひっさつわざ　だ。");
    return;
  }
  useTech(player.techs[idx]);
});
function useTech(name) {
  if (!inBattle || !currentEnemy) return;
  const hpCost = TECH_HP_COST[name] ?? 0;
  if (player.hp <= hpCost + 1) {
    writeMessage("しかし　HPが　たりない！");
    return;
  }
  if (name === "かいしんぎり") {
    if (techUsedThisBattle) {
      writeMessage("もう　ひっさつわざは　つかえない！");
      return;
    }
    techUsedThisBattle = true;
    player.hp -= hpCost;
    updateStatus();
    const base = calcDamage(getPlayerAtk(), currentEnemy);
    const dmg = base * 2;
    currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    writeMessage(
      `ゆうしゃは　かいしんぎりを　はなった！\n` +
      `${currentEnemy.name} に　${dmg} のダメージ！\n` +
      `（HPを ${hpCost} けずった！）`
    );
    SFX.tech();
    showEnemyEffect("tech");
    updateEnemyHp();
    if (currentEnemy.hp <= 0) { winBattle(); return; }
    setTimeout(enemyAttack, 600);
  } else if (name === "みだれぎり") {
    player.hp -= hpCost;
    updateStatus();
    let total = 0;
    for (let i = 0; i < 2; i++) {
      const dmg = calcDamage(getPlayerAtk(), currentEnemy);
      currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
      total += dmg;
      if (currentEnemy.hp <= 0) break;
    }
    writeMessage(
      `ゆうしゃは　みだれぎりを　はなった！\n` +
      `${currentEnemy.name} に　${total} のダメージ！\n` +
      `（HPを ${hpCost} けずった！）`
    );
    SFX.tech();
    showEnemyEffect("tech");
    updateEnemyHp();
    if (currentEnemy.hp <= 0) { winBattle(); return; }
    setTimeout(enemyAttack, 600);
  } else if (name === "まわしげり") {
    player.hp -= hpCost;
    updateStatus();
    const base = calcDamage(getPlayerAtk(), { def: currentEnemy.def - 2 });
    const dmg = Math.floor(base * 1.5);
    currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    writeMessage(
      `ゆうしゃは　まわしげりを　くりだした！\n` +
      `${currentEnemy.name} に　${dmg} のダメージ！\n` +
      `（HPを ${hpCost} けずった！）`
    );
    SFX.tech();
    showEnemyEffect("tech");
    updateEnemyHp();
    if (currentEnemy.hp <= 0) { winBattle(); return; }
    setTimeout(enemyAttack, 600);
  } else if (name === "きりさきのまい") {
    player.hp -= hpCost;
    updateStatus();
    let total = 0;
    const hits = 3;
    for (let i = 0; i < hits; i++) {
      const dmg = Math.max(1, Math.floor(calcDamage(getPlayerAtk(), currentEnemy) * 0.7));
      currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
      total += dmg;
      if (currentEnemy.hp <= 0) break;
    }
    writeMessage(
      `ゆうしゃは　きりさきのまいを　おどった！\n` +
      `${currentEnemy.name} に　${total} のダメージ！\n` +
      `（HPを ${hpCost} けずった！）`
    );
    SFX.tech();
    showEnemyEffect("tech");
    updateEnemyHp();
    if (currentEnemy.hp <= 0) { winBattle(); return; }
    setTimeout(enemyAttack, 600);
  } else if (name === "かげぶんしんぎり") {
    if (techUsedThisBattle) {
      writeMessage("もう　ひっさつわざは　つかえない！");
      return;
    }
    techUsedThisBattle = true;
    player.hp -= hpCost;
    updateStatus();
    const base = calcDamage(getPlayerAtk(), currentEnemy);
    const dmg = base * 3;
    currentEnemy.hp = Math.max(0, currentEnemy.hp - dmg);
    writeMessage(
      `ゆうしゃは　かげぶんしんぎりを　はなった！\n` +
      `${currentEnemy.name} に　${dmg} のダメージ！\n` +
      `（HPを ${hpCost} けずった！）`
    );
    SFX.tech();
    showEnemyEffect("tech");
    updateEnemyHp();
    if (currentEnemy.hp <= 0) { winBattle(); return; }
    setTimeout(enemyAttack, 600);
  } else {
    writeMessage("その　ひっさつわざは　まだ　つかえない。");
  }
}
