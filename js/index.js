/**
 * material-player — Phase 1 (single-track) audio player.
 *
 * Dependency-free, modern JavaScript built on the HTML5 <audio> API.
 * Replace the `track` metadata below to point at your own audio file.
 */
(function () {
  'use strict';

  // --- Track (Phase 1: one local track; playlist support comes later) ---
  var track = {
    title: 'Sample Melody',
    artist: 'material-player demo',
    src: 'audio/sample.wav'
  };

  var VOLUME_STEP = 0.1;
  var DEFAULT_VOLUME = 0.75; // matches the initial .level width in the CSS

  var audio = new Audio();
  audio.preload = 'metadata';
  audio.src = track.src;

  // --- Elements ---
  var playBtn = document.querySelector('.pause');
  var playIcon = playBtn.querySelector('.fa');
  var songEl = document.querySelector('.song');
  var artistEl = document.querySelector('.artist');
  var timeEl = document.querySelector('.time');
  var trackBar = document.querySelector('.track');
  var complete = document.querySelector('.complete');
  var volBar = document.querySelector('.vol-bar');
  var level = document.querySelector('.level');
  var volDown = document.querySelector('.vol-down');
  var volUp = document.querySelector('.vol-up');

  // --- Rendering helpers ---
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' + secs : secs);
  }

  function renderMeta() {
    songEl.textContent = track.title;
    artistEl.textContent = track.artist;
  }

  function renderTime() {
    timeEl.textContent = formatTime(audio.currentTime) + ' / ' + formatTime(audio.duration);
  }

  function renderProgress() {
    var pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    complete.style.width = pct + '%';
  }

  function renderVolume() {
    level.style.width = audio.volume * 100 + '%';
  }

  function setPlayingIcon(isPlaying) {
    playIcon.classList.toggle('fa-pause', isPlaying);
    playIcon.classList.toggle('fa-play', !isPlaying);
  }

  // --- Playback ---
  function togglePlay() {
    if (audio.paused) {
      audio.play().catch(function () { /* ignore autoplay/user-gesture rejections */ });
    } else {
      audio.pause();
    }
  }

  function ratioFromClick(event, element) {
    var rect = element.getBoundingClientRect();
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  }

  function setVolume(value) {
    audio.volume = Math.max(0, Math.min(1, value));
    renderVolume();
  }

  // --- Events ---
  playBtn.addEventListener('click', togglePlay);

  audio.addEventListener('play', function () { setPlayingIcon(true); });
  audio.addEventListener('pause', function () { setPlayingIcon(false); });
  audio.addEventListener('ended', function () {
    audio.currentTime = 0;
    renderProgress();
    renderTime();
  });
  audio.addEventListener('loadedmetadata', function () {
    renderProgress();
    renderTime();
  });
  audio.addEventListener('timeupdate', function () {
    renderProgress();
    renderTime();
  });

  trackBar.addEventListener('click', function (event) {
    if (audio.duration) {
      audio.currentTime = ratioFromClick(event, trackBar) * audio.duration;
    }
  });

  volBar.addEventListener('click', function (event) {
    setVolume(ratioFromClick(event, volBar));
  });
  volDown.addEventListener('click', function () { setVolume(audio.volume - VOLUME_STEP); });
  volUp.addEventListener('click', function () { setVolume(audio.volume + VOLUME_STEP); });

  document.addEventListener('keydown', function (event) {
    if (event.code === 'Space' && event.target === document.body) {
      event.preventDefault();
      togglePlay();
    }
  });

  // --- Init ---
  renderMeta();
  setPlayingIcon(false);
  setVolume(DEFAULT_VOLUME);
  renderTime();
})();