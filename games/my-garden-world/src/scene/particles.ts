export function mountPetals(host: HTMLElement): void {
  const layer = document.createElement("div");
  layer.className = "petals";
  const colors = ["#f7cad0", "#f4e7b5", "#e76f51", "#fffdf4", "#c9e4c5"];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("i");
    p.className = "petal";
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length] ?? "#f7cad0";
    p.style.animationDelay = `${-Math.random() * 12}s`;
    p.style.animationDuration = `${10 + Math.random() * 8}s`;
    layer.append(p);
  }
  host.append(layer);
}

export function burst(host: HTMLElement, x: number, y: number, color: string): void {
  for (let i = 0; i < 8; i++) {
    const d = document.createElement("i");
    d.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:7px;height:7px;border-radius:50%;background:${color};pointer-events:none;z-index:20;`;
    host.append(d);
    const dx = (Math.random() - 0.5) * 80;
    const dy = -20 - Math.random() * 60;
    d.animate(
      [
        { transform: "translate(0,0)", opacity: 1 },
        { transform: `translate(${dx}px,${dy}px)`, opacity: 0 },
      ],
      { duration: 600, easing: "ease-out" },
    ).onfinish = () => d.remove();
  }
}
