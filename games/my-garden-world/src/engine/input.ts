export interface PlotPointerOptions {
  /** 命中的花圃元素 → 花圃编号，非花圃返回 null */
  plotIdOf: (el: Element) => number | null;
  /** 当前工具是否为拖拽型（洒水） */
  isDragTool: () => boolean;
  /** 拖拽首次经过某块花圃 */
  onDragOver: (plotId: number, el: Element) => void;
  /** 一次拖拽结束，visited 为本次经过的花圃编号 */
  onDragEnd: (visited: number[]) => void;
  /** 点按花圃（按下与抬起落在同一块） */
  onTap: (plotId: number, el: Element) => void;
  selector?: string;
}

interface PlotHit {
  id: number;
  el: Element;
}

function pointerKey(e: PointerEvent): number {
  return typeof e.pointerId === "number" ? e.pointerId : -1;
}

/**
 * 花圃指针交互：按下拖过多块花圃即可连续浇灌，抬起视为点按。
 * 事件委托在容器上，因此花园重绘替换子节点也不会丢失交互。
 */
export function installPlotPointer(host: HTMLElement, opts: PlotPointerOptions): () => void {
  const selector = opts.selector ?? ".plot";
  const doc = host.ownerDocument;
  let active: number | null = null;
  let dragging = false;
  let startPlot: number | null = null;
  let visited: number[] = [];
  const seen = new Set<number>();

  const hitPlot = (e: PointerEvent): PlotHit | null => {
    let node: Element | null = null;
    if (typeof doc.elementFromPoint === "function") {
      try {
        node = doc.elementFromPoint(e.clientX, e.clientY);
      } catch {
        node = null;
      }
    }
    if (!node && e.target instanceof Element) node = e.target;
    const el = node?.closest(selector) ?? null;
    if (!el || !host.contains(el)) return null;
    const id = opts.plotIdOf(el);
    return id == null ? null : { id, el };
  };

  const visit = (hit: PlotHit): void => {
    if (seen.has(hit.id)) return;
    seen.add(hit.id);
    visited.push(hit.id);
    opts.onDragOver(hit.id, hit.el);
  };

  const reset = (): void => {
    active = null;
    dragging = false;
    startPlot = null;
    visited = [];
    seen.clear();
  };

  // 触摸默认会把后续事件锁回按下的元素，释放后才能拖过相邻花圃
  const releaseCapture = (e: PointerEvent): void => {
    const el = e.target;
    if (!(el instanceof Element)) return;
    if (typeof el.hasPointerCapture !== "function" || typeof el.releasePointerCapture !== "function") return;
    try {
      const id = pointerKey(e);
      if (el.hasPointerCapture(id)) el.releasePointerCapture(id);
    } catch {
      /* 不支持指针捕获时忽略 */
    }
  };

  const onDown = (e: PointerEvent): void => {
    if (e.button > 0) return;
    const hit = hitPlot(e);
    const drag = opts.isDragTool();
    if (!hit && !drag) return;
    reset();
    active = pointerKey(e);
    dragging = drag;
    startPlot = hit?.id ?? null;
    releaseCapture(e);
    if (drag && hit) visit(hit);
  };

  const onMove = (e: PointerEvent): void => {
    if (!dragging || active === null || pointerKey(e) !== active) return;
    const hit = hitPlot(e);
    if (hit) visit(hit);
  };

  const onUp = (e: PointerEvent): void => {
    if (active === null || pointerKey(e) !== active) return;
    const hit = hitPlot(e);
    const wasDragging = dragging;
    const from = startPlot;
    const passed = [...visited];
    reset();
    if (wasDragging) {
      if (hit && !passed.includes(hit.id)) {
        passed.push(hit.id);
        opts.onDragOver(hit.id, hit.el);
      }
      opts.onDragEnd(passed);
    } else if (hit && hit.id === from) {
      opts.onTap(hit.id, hit.el);
    }
  };

  const onCancel = (e: PointerEvent): void => {
    if (active === null || pointerKey(e) !== active) return;
    const wasDragging = dragging;
    const passed = [...visited];
    reset();
    if (wasDragging) opts.onDragEnd(passed);
  };

  host.style.touchAction = "none";
  host.addEventListener("pointerdown", onDown);
  doc.addEventListener("pointermove", onMove);
  doc.addEventListener("pointerup", onUp);
  doc.addEventListener("pointercancel", onCancel);

  return () => {
    host.removeEventListener("pointerdown", onDown);
    doc.removeEventListener("pointermove", onMove);
    doc.removeEventListener("pointerup", onUp);
    doc.removeEventListener("pointercancel", onCancel);
    reset();
  };
}
