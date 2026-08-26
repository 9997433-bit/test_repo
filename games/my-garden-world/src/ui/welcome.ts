import { FLOWER_MAP } from "../data/flowers";
import { formatAway, type OfflineReport } from "../systems/offline";

/** 回归结算的「欢迎回园」折子：汇报离园期间水缸、生长与盛放。 */
export function showWelcomeBack(host: HTMLElement, report: OfflineReport): void {
  host.querySelector(".modal.welcome")?.remove();
  const lines: string[] = [];
  if (report.waterGained > 0) lines.push(`水缸回了 ${report.waterGained} 滴水`);
  if (report.stageAdvances > 0) lines.push(`花圃悄悄长了 ${report.stageAdvances} 段`);
  if (report.bloomed.length) {
    const names = report.bloomed.map((id) => FLOWER_MAP[id]?.name ?? id).join("、");
    lines.push(`${names} 已然盛放，待你来剪`);
  }
  lines.push("客人们都还候在门外，订单一单未失");

  const box = document.createElement("div");
  box.className = "modal welcome";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "welcome-title");
  box.innerHTML = `<div class="modal-card">
    <div class="muted step-label">离园 ${formatAway(report.awayMs)}</div>
    <h2 id="welcome-title">欢迎回园</h2>
    <p>${lines.map((l) => `◌ ${l}`).join("<br/>")}</p>
    <button type="button" class="cta">回到园中</button>
  </div>`;
  const btn = box.querySelector<HTMLButtonElement>("button");
  btn?.addEventListener("click", () => box.remove());
  host.append(box);
  btn?.focus();
}
