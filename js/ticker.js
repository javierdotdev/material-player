/**
 * Ticker
 * ------
 * Minimal, dependency-free progress driver for the (fake) player track.
 *
 * This replaces the external CodePen script (codepen.io/Oka/pen/ZYWzeO.js) that the
 * demo originally relied on, so the project no longer depends on CodePen at runtime.
 *
 * It animates the width of a target element (as a percentage) to simulate playback.
 *
 * @param {Object}  options
 * @param {string}  options.element   CSS selector of the element to grow (e.g. '.complete').
 * @param {number} [options.start=0]  Initial progress, as a percentage (0–100).
 * @param {number} [options.time=100] Seconds it takes to fill from 0% to 100%.
 */
function Ticker(options) {
  options = options || {};

  this.element = document.querySelector(options.element);
  this.start = typeof options.start === 'number' ? options.start : 0;
  this.time = typeof options.time === 'number' && options.time > 0 ? options.time : 100;

  this.progress = this.start;
  this.paused = true;

  this._timerId = null;
  this._stepMs = 100; // update 10 times per second
  this._stepPercent = (100 / this.time) * (this._stepMs / 1000);

  this._render();
  this.play(); // auto-start so the initial "pause" icon reflects a playing track
}

Ticker.prototype._render = function () {
  if (this.element) {
    this.element.style.width = Math.min(this.progress, 100) + '%';
  }
};

Ticker.prototype.play = function () {
  if (!this.paused) {
    return;
  }

  this.paused = false;

  var self = this;
  this._timerId = window.setInterval(function () {
    self.progress += self._stepPercent;

    if (self.progress >= 100) {
      self.progress = 100;
      self._render();
      self.pause();
      return;
    }

    self._render();
  }, this._stepMs);
};

Ticker.prototype.pause = function () {
  this.paused = true;

  if (this._timerId !== null) {
    window.clearInterval(this._timerId);
    this._timerId = null;
  }
};

// Expose globally so js/index.js can call `new Ticker(...)`, just like the original script.
window.Ticker = Ticker;
