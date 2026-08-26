/** 主循环入口（Opus-4 所有权）。脚手架仅挂载占位屏。 */
export function boot(root) {
  if (!root) return;
  root.innerHTML = `
    <section class="boot-card">
      <h2>指挥部就绪</h2>
      <p>Round 1 脚手架已就位。物理、战斗、英雄与关卡将由并发子代理填入。</p>
      <canvas id="stage" width="480" height="800" aria-label="战场"></canvas>
    </section>
  `;
}
