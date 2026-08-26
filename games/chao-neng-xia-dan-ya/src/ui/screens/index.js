import { adventureScreen } from "./adventure.js";
import { battleScreen } from "./battle.js";
import { codexScreen } from "./codex.js";
import { fishingScreen } from "./fishing.js";
import { raidIntroScreen, rogueIntroScreen } from "./intro.js";
import { menuScreen } from "./menu.js";
import { resultScreen } from "./result.js";
import { settingsScreen } from "./settings.js";
import { teamScreen } from "./team.js";
import { towerScreen } from "./tower.js";

export const SCREENS = Object.fromEntries(
  [
    menuScreen,
    teamScreen,
    adventureScreen,
    battleScreen,
    resultScreen,
    codexScreen,
    towerScreen,
    rogueIntroScreen,
    raidIntroScreen,
    fishingScreen,
    settingsScreen,
  ].map((s) => [s.id, s]),
);
