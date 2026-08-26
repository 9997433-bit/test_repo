export function startEngine({ store, render, tickMs = 100 }) {
  let last = performance.now();
  let acc = 0;
  let raf = 0;
  let running = true;

  const loop = (now) => {
    if (!running) return;
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    acc += dt;
    while (acc >= tickMs / 1000) {
      store.dispatch({ type: "TICK", now: Date.now(), dt: tickMs / 1000 });
      acc -= tickMs / 1000;
    }
    render(store.get());
    raf = requestAnimationFrame(loop);
  };

  raf = requestAnimationFrame(loop);
  return () => {
    running = false;
    cancelAnimationFrame(raf);
  };
}
