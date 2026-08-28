// 渲染适配层 · 帧计时。与引擎无关，单独放一处免得后端和场景图互相牵扯。

const now = () =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

export class Clock {
  constructor(autoStart = true) {
    this.autoStart = autoStart;
    this.startTime = 0;
    this.oldTime = 0;
    this.elapsedTime = 0;
    this.running = false;
  }

  start() {
    this.startTime = now();
    this.oldTime = this.startTime;
    this.elapsedTime = 0;
    this.running = true;
  }

  stop() {
    this.getElapsedTime();
    this.running = false;
    this.autoStart = false;
  }

  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }

  getDelta() {
    let diff = 0;
    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }
    if (this.running) {
      const t = now();
      diff = (t - this.oldTime) / 1000;
      this.oldTime = t;
      this.elapsedTime += diff;
    }
    return diff;
  }
}
