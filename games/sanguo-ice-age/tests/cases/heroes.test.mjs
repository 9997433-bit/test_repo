import { suite, test, assert, assertEq, assertClose } from "../harness.mjs";
import { createInitialState } from "../../js/sim/state.js";
import {
  gachaRates,
  rollQuality,
  recruitOnce,
  buyToken,
  heroStats,
  levelUpHero,
  levelUpCost,
  setTeamSlot,
  teamHeroes,
} from "../../js/sim/heroes.js";
import { HERO_POOL, HEROES_BY_ID } from "../../js/data/heroes.js";
import { mulberry32 } from "../../js/engine/rng.js";
import { QUALITIES, HERO } from "../../js/config.js";

suite("heroes：武将池数据", () => {
  test("四阵营 × 四品质均有覆盖，id 唯一", () => {
    const ids = new Set(HERO_POOL.map((h) => h.id));
    assertEq(ids.size, HERO_POOL.length, "id 不能重复");
    for (const f of ["wei", "shu", "wu", "qun"]) {
      assert(HERO_POOL.some((h) => h.faction === f), `阵营 ${f} 应有武将`);
    }
    for (const q of QUALITIES) {
      assert(HERO_POOL.some((h) => h.quality === q), `品质 ${q} 应有武将`);
    }
    assert(HERO_POOL.length >= 40, "武将池至少 40 人");
  });

  test("三兵种均有覆盖且每人有技能", () => {
    for (const t of ["infantry", "archer", "cavalry"]) {
      assert(HERO_POOL.some((h) => h.troop === t));
    }
    for (const h of HERO_POOL) assert(h.skill && h.skill.mult > 1, `${h.name} 缺技能`);
  });
});

suite("heroes：招贤概率", () => {
  test("概率和为 1，馆等级提升红/橙概率", () => {
    const r1 = gachaRates(1);
    assertClose(r1.red + r1.orange + r1.purple + r1.blue, 1, 1e-9);
    const r10 = gachaRates(10);
    assert(r10.red > r1.red && r10.orange > r1.orange);
    assert(r10.blue < r1.blue);
  });

  test("10000 次抽取分布贴近理论值", () => {
    const rng = mulberry32(42);
    const counts = { blue: 0, purple: 0, orange: 0, red: 0 };
    const n = 10000;
    for (let i = 0; i < n; i++) counts[rollQuality(rng, 1)]++;
    const rates = gachaRates(1);
    for (const q of QUALITIES) {
      const observed = counts[q] / n;
      assert(
        Math.abs(observed - rates[q]) < 0.02,
        `${q} 观测 ${observed.toFixed(3)} vs 理论 ${rates[q].toFixed(3)}`,
      );
    }
  });
});

suite("heroes：招募/养成/编队", () => {
  test("招募消耗招贤令；无招贤馆时拒绝", () => {
    const s = createInitialState(11);
    assert(recruitOnce(s).error, "无招贤馆应报错");
    s.buildings.recruitHall = 1;
    const before = s.tokens;
    const r = recruitOnce(s);
    assert(!r.error && r.hero);
    assertEq(s.tokens, before - 1);
    assertEq(s.heroes.length, 1);
    assertEq(s.stats.recruits, 1);
  });

  test("重复武将折算将魂", () => {
    const s = createInitialState(12);
    s.buildings.recruitHall = 1;
    s.tokens = 200;
    let sawDupe = false;
    for (let i = 0; i < 100 && !sawDupe; i++) {
      const r = recruitOnce(s);
      if (!r.isNew) {
        sawDupe = true;
        assert(r.souls > 0 && s.souls > 0);
      }
    }
    assert(sawDupe, "100 连抽必有重复");
  });

  test("同一种子招募结果可复现", () => {
    const a = createInitialState(77);
    const b = createInitialState(77);
    for (const s of [a, b]) {
      s.buildings.recruitHall = 3;
      s.tokens = 10;
    }
    const seqA = [];
    const seqB = [];
    for (let i = 0; i < 10; i++) {
      seqA.push(recruitOnce(a).hero.id);
      seqB.push(recruitOnce(b).hero.id);
    }
    assertEq(seqA.join(","), seqB.join(","));
  });

  test("升级消耗将魂并成长属性；封顶", () => {
    const s = createInitialState(13);
    s.heroes.push({ id: "guanyu", level: 1, dupes: 0 });
    const inst = s.heroes[0];
    const base = heroStats(inst);
    s.souls = 100000;
    const cost = levelUpCost(inst);
    assertEq(levelUpHero(s, "guanyu").ok, true);
    assertEq(s.souls, 100000 - cost);
    const grown = heroStats(inst);
    assert(grown.atk > base.atk && grown.lead > base.lead);
    inst.level = HERO.maxLevel[HEROES_BY_ID.guanyu.quality];
    assert(!levelUpHero(s, "guanyu").ok, "满级不能再升");
  });

  test("换将令牌兑换与编队去重", () => {
    const s = createInitialState(14);
    s.buildings.recruitHall = 1;
    s.resources.food = 500;
    s.resources.iron = 100;
    const before = s.tokens;
    assertEq(buyToken(s).ok, true);
    assertEq(s.tokens, before + 1);

    s.heroes.push({ id: "zhaoyun", level: 1, dupes: 0 }, { id: "guanyu", level: 1, dupes: 0 });
    setTeamSlot(s, 0, "zhaoyun");
    setTeamSlot(s, 1, "guanyu");
    setTeamSlot(s, 2, "zhaoyun"); // 换位，去重
    assertEq(s.team[0], null, "同一武将不能占两个栏位");
    assertEq(s.team[2], "zhaoyun");
    assertEq(teamHeroes(s).length, 2);
  });
});
