export function mountApp(root, game = {}) {
  root.innerHTML = `
    <header>
      <h1>兵器王者·炉火</h1>
      <p>寻器 · 造器 · 用器</p>
    </header>
    <main>
      <p>${game.boot ? '工坊脚手架已就绪，等待锻造系统接入。' : ''}</p>
    </main>
  `;
}
