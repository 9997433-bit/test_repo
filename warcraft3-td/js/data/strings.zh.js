(function (global) {
  'use strict';

  global.WC3.Strings = global.WC3.Strings || {};
  global.WC3.Strings.zh = {
    lang: '中文',
    title: '铁誓要塞 · 塔防',
    subtitle: '致敬经典即时战略自定义塔防 —— 美术与音效全部原创',

    difficulty: '难度',
    easy: '简单', normal: '普通', hard: '困难', insane: '疯狂',
    pickRace: '起始阵营（命令卡默认页）',
    pickHero: '英雄',
    startGame: '开始战役',
    howto: '玩法',
    howtoBody: '左键选择命令卡上的塔 → 在草地上左键建造 → 右键取消。' +
      '空中单位只能被穿刺/魔法/混沌攻击命中。漏怪扣生命，30 波全清即胜利。',

    gold: '黄金', lumber: '木材', lives: '生命', wave: '波次', time: '时间', score: '得分',
    supply: '人口',

    nextWave: '下一波', callEarly: '提前召唤', autoIn: '自动开始',
    pause: '暂停', resume: '继续', speedLabel: '速度',
    restart: '重新开始', surrender: '投降', settings: '设置', menu: '菜单',
    close: '关闭', resumeGame: '返回游戏', quit: '退出到主菜单',
    log: '战报', allies: '盟友', quests: '任务',

    build: '建造', sell: '出售', upgrade: '升级', cancel: '取消',
    targetMode: '索敌', tFirst: '最前', tLast: '最后', tStrong: '最强', tWeak: '最弱', tClose: '最近',

    damage: '攻击力', armor: '护甲', range: '射程', attackSpeed: '攻速',
    dps: '每秒伤害', kills: '击杀', invested: '总投入', sellFor: '售价',
    attackType: '攻击类型', armorType: '护甲类型', hp: '生命值', speed: '移动速度',
    effect: '特效', splash: '溅射', flying: '飞行', ground: '地面',
    spellImmune: '魔法免疫', bounty: '赏金',
    hotkey: '快捷键', cost: '花费', level: '等级',

    normalAtk: '普通', pierceAtk: '穿刺', siegeAtk: '攻城', magicAtk: '魔法',
    chaosAtk: '混沌', heroAtk: '英雄', spellsAtk: '法术',
    unarmoredArm: '无甲', lightArm: '轻甲', mediumArm: '中甲', heavyArm: '重甲',
    fortifiedArm: '护甲', heroArm: '英雄', divineArm: '神圣',

    effSlow: '减速', effPoison: '剧毒', effRoot: '缠绕', effChain: '闪电链',

    logWaveIn: '第 {n} 波：{name} 已从裂隙之门涌出！',
    logBoss: '⚔ 首领来袭 —— 第 {n} 波：{name}！',
    logLeak: '{name} 冲破了防线！剩余生命 {lives}。',
    logVictory: '任务完成：30 波全部击退，要塞屹立不倒！',
    logDefeat: '要塞陷落…… 你坚持到了第 {n} 波。',
    logBuild: '建造 {name}。',
    logSell: '出售 {name}，回收 {gold} 金。',
    logUpgrade: '{name} 升级完成。',
    logInterest: '利息收入 +{gold} 金（{rate}%）。',
    logLumber: '获得 1 木材（第 {n} 波）。',
    logEarly: '提前召唤奖励 +{gold} 金。',
    errGold: '黄金不足！',
    errLumber: '木材不足！',
    errSpot: '这里无法建造。',

    victory: '胜利', defeat: '战败',
    victoryBody: '要塞守住了。全部 30 波敌人被击退。',
    defeatBody: '裂隙之门吞没了要塞。',
    statsWaves: '通过波次', statsKills: '总击杀', statsGold: '累计黄金',
    statsLeaks: '漏怪', statsBest: '最佳记录', playAgain: '再来一局',

    setLanguage: '语言', setMaster: '主音量', setSfx: '音效', setMusic: '氛围',
    setDamageText: '伤害数字', setRange: '始终显示射程', setColorblind: '色盲友好',
    setFps: '显示帧率', on: '开', off: '关',

    hero: '英雄', heroTemplar: '圣殿守护', heroSwordmaster: '剑豪',
    heroNightblade: '夜刃', heroDreadKnight: '恐惧骑士',
    mana: '魔法', abilityQ: '震荡新星', abilityW: '疾行',
    heroMove: '右键移动英雄', heroDesc: '英雄可移动，攻击范围内的敌人。',
    radiance: '光辉', whirlwind: '旋风斩', emberAura: '余烬光环', soulbolt: '灵魂弹',

    fps: '帧率', creeps: '敌人', towersBuilt: '防御塔'
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
