(function (global) {
  'use strict';

  global.WC3.Strings = global.WC3.Strings || {};
  global.WC3.Strings.en = {
    lang: 'English',
    title: 'Azeroth Keep TD',
    subtitle: 'A tribute to classic Warcraft III custom tower defense (no Blizzard assets)',

    difficulty: 'Difficulty',
    easy: 'Easy', normal: 'Normal', hard: 'Hard', insane: 'Insane',
    pickRace: 'Starting race (command card page)',
    pickHero: 'Hero',
    startGame: 'Begin Campaign',
    howto: 'How to play',
    howtoBody: 'Pick a tower on the command card, left-click grass to build, right-click to cancel. ' +
      'Air units can only be hit by pierce / magic / chaos. Leaks cost lives; clear 30 waves to win.',

    gold: 'Gold', lumber: 'Lumber', lives: 'Lives', wave: 'Wave', time: 'Time', score: 'Score',
    supply: 'Food',

    nextWave: 'Next Wave', callEarly: 'Call Early', autoIn: 'Auto in',
    pause: 'Pause', resume: 'Resume', speedLabel: 'Speed',
    restart: 'Restart', surrender: 'Surrender', settings: 'Settings', menu: 'Menu',
    close: 'Close', resumeGame: 'Return to Game', quit: 'Quit to Menu',
    log: 'Log', allies: 'Allies', quests: 'Quests',

    build: 'Build', sell: 'Sell', upgrade: 'Upgrade', cancel: 'Cancel',
    targetMode: 'Targeting', tFirst: 'First', tLast: 'Last', tStrong: 'Strongest', tWeak: 'Weakest', tClose: 'Closest',

    damage: 'Damage', armor: 'Armor', range: 'Range', attackSpeed: 'Attack Speed',
    dps: 'DPS', kills: 'Kills', invested: 'Invested', sellFor: 'Sell value',
    attackType: 'Attack type', armorType: 'Armor type', hp: 'Hit Points', speed: 'Move Speed',
    effect: 'Effect', splash: 'Splash', flying: 'Flying', ground: 'Ground',
    spellImmune: 'Spell Immune', bounty: 'Bounty',
    hotkey: 'Hotkey', cost: 'Cost', level: 'Level',

    normalAtk: 'Normal', pierceAtk: 'Pierce', siegeAtk: 'Siege', magicAtk: 'Magic',
    chaosAtk: 'Chaos', heroAtk: 'Hero', spellsAtk: 'Spells',
    unarmoredArm: 'Unarmored', lightArm: 'Light', mediumArm: 'Medium', heavyArm: 'Heavy',
    fortifiedArm: 'Fortified', heroArm: 'Hero', divineArm: 'Divine',

    effSlow: 'Slow', effPoison: 'Poison', effRoot: 'Entangle', effChain: 'Chain Lightning',

    logWaveIn: 'Wave {n}: a pack of {name} has entered the battlefield!',
    logBoss: '⚔ Boss wave {n}: {name} approaches!',
    logLeak: '{name} broke through! {lives} lives remain.',
    logVictory: 'Quest complete — all 30 waves repelled. The keep stands!',
    logDefeat: 'The keep has fallen... you reached wave {n}.',
    logBuild: 'Built {name}.',
    logSell: 'Sold {name} for {gold} gold.',
    logUpgrade: '{name} upgrade complete.',
    logInterest: 'Interest income +{gold} gold ({rate}%).',
    logLumber: 'Gained 1 lumber (wave {n}).',
    logEarly: 'Early call bonus +{gold} gold.',
    errGold: 'Not enough gold!',
    errLumber: 'Not enough lumber!',
    errSpot: 'You cannot build there.',

    victory: 'Victory', defeat: 'Defeat',
    victoryBody: 'The keep held. All 30 waves were destroyed.',
    defeatBody: 'The dark portal has consumed the keep.',
    statsWaves: 'Waves cleared', statsKills: 'Total kills', statsGold: 'Gold earned',
    statsLeaks: 'Leaks', statsBest: 'Best run', playAgain: 'Play Again',

    setLanguage: 'Language', setMaster: 'Master', setSfx: 'Effects', setMusic: 'Ambience',
    setDamageText: 'Damage numbers', setRange: 'Always show range', setColorblind: 'Colorblind friendly',
    setFps: 'Show FPS', on: 'On', off: 'Off',

    hero: 'Hero', heroPaladin: 'Paladin', heroBlademaster: 'Blademaster',
    heroDemonHunter: 'Demon Hunter', heroDeathKnight: 'Death Knight',
    mana: 'Mana', abilityQ: 'War Stomp', abilityW: 'Windwalk',
    heroMove: 'Right-click to move the hero', heroDesc: 'The hero roams and attacks nearby enemies.',
    holyLight: 'Holy Light', bladestorm: 'Bladestorm', immolation: 'Immolation', deathCoil: 'Death Coil',

    fps: 'FPS', creeps: 'Creeps', towersBuilt: 'Towers'
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
