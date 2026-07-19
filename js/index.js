/**
 * material-player — Phase 2 (playlist) audio player.
 *
 * Dependency-free, modern JavaScript built on the HTML5 <audio> API.
 * Edit the `playlist` array below to point at your own audio files and covers.
 */
(function () {
  'use strict';

  // --- Playlist (local, license-free samples) ---
  var playlist = [
    { title: 'Sample Melody', artist: 'material-player demo', src: 'audio/sample.wav', cover: 'images/cover1.svg' },
    { title: 'Second Sketch', artist: 'material-player demo', src: 'audio/sample2.wav', cover: 'images/cover2.svg' },
    { title: 'Third Loop', artist: 'material-player demo', src: 'audio/sample3.wav', cover: 'images/cover3.svg' }
  ];

  var currentIndex = 0;

  var VOLUME_STEP = 0.1;
  var DEFAULT_VOLUME = 0.75; // matches the initial .level width in the CSS
  var PREV_RESTART_THRESHOLD = 3; // seconds: below this, "previous" jumps to the prior track
  var COVER_FADE_MS = 200; // half of the CSS opacity transition, for the crossfade swap
  var STORAGE_FAVORITES = 'material-player:favorites';
  var STORAGE_VOLUME = 'material-player:volume';

  var shuffle = false;
  var mutedVolume = null;
  var favorites = loadFavorites();

  var audio = new Audio();
  audio.preload = 'metadata';

  // --- Elements ---
  var playBtn = document.querySelector('.pause');
  var playIcon = playBtn.querySelector('.fa');
  var previousBtn = document.querySelector('.previous');
  var nextBtn = document.querySelector('.next');
  var playlistBtn = document.querySelector('.playlist');
  var songEl = document.querySelector('.song');
  var artistEl = document.querySelector('.artist');
  var timeEl = document.querySelector('.time');
  var trackBar = document.querySelector('.track');
  var complete = document.querySelector('.complete');
  var volBar = document.querySelector('.vol-bar');
  var level = document.querySelector('.level');
  var volDown = document.querySelector('.vol-down');
  var volUp = document.querySelector('.vol-up');
  var coverEl = document.querySelector('.cover');
  var playlistPanel = document.querySelector('.playlist-panel');
  var heartBtn = document.querySelector('.heart');
  var shuffleBtn = document.querySelector('.shuffle');
  var volDownIcon = volDown.querySelector('.fa');

  // --- Rendering helpers ---
  function currentTrack() {
    return playlist[currentIndex];
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + (secs < 10 ? '0' + secs : secs);
  }

  function renderMeta() {
    var track = currentTrack();
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
    volDownIcon.classList.toggle('fa-volume-off', audio.volume === 0);
    volDownIcon.classList.toggle('fa-volume-down', audio.volume > 0);
  }

  function setPlayingIcon(isPlaying) {
    playIcon.classList.toggle('fa-pause', isPlaying);
    playIcon.classList.toggle('fa-play', !isPlaying);
  }

  var coverFadeTimer = null;
  function setCover(url, animate) {
    if (!coverEl) {
      return;
    }
    if (!animate) {
      coverEl.style.backgroundImage = 'url("' + url + '")';
      coverEl.style.opacity = '1';
      return;
    }
    coverEl.style.opacity = '0';
    window.clearTimeout(coverFadeTimer);
    coverFadeTimer = window.setTimeout(function () {
      coverEl.style.backgroundImage = 'url("' + url + '")';
      coverEl.style.opacity = '1';
    }, COVER_FADE_MS);
  }

  // --- Persistence (favorites + volume) ---
  function loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_FAVORITES)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(favorites));
    } catch (e) { /* storage unavailable */ }
  }

  function isFavorite(src) {
    return favorites.indexOf(src) !== -1;
  }

  function renderFavorite() {
    heartBtn.classList.toggle('liked', isFavorite(currentTrack().src));
  }

  function toggleFavorite() {
    var src = currentTrack().src;
    var index = favorites.indexOf(src);
    if (index === -1) {
      favorites.push(src);
    } else {
      favorites.splice(index, 1);
    }
    saveFavorites();
    renderFavorite();
  }

  function loadVolume() {
    var stored = parseFloat(localStorage.getItem(STORAGE_VOLUME));
    return isNaN(stored) ? DEFAULT_VOLUME : Math.max(0, Math.min(1, stored));
  }

  function saveVolume() {
    try {
      localStorage.setItem(STORAGE_VOLUME, String(audio.volume));
    } catch (e) { /* storage unavailable */ }
  }

  // --- Playlist UI ---
  function buildPlaylist() {
    playlistPanel.innerHTML = '';
    playlist.forEach(function (track, index) {
      var item = document.createElement('li');
      var title = document.createElement('span');
      var artist = document.createElement('span');
      title.className = 'pl-title';
      artist.className = 'pl-artist';
      title.textContent = track.title;
      artist.textContent = track.artist;
      item.appendChild(title);
      item.appendChild(artist);
      item.addEventListener('click', function () {
        loadTrack(index, true, true);
        closePlaylist();
      });
      playlistPanel.appendChild(item);
    });
  }

  function highlightActiveItem() {
    var items = playlistPanel.children;
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', i === currentIndex);
    }
  }

  function togglePlaylist() {
    playlistPanel.classList.toggle('open');
  }

  function closePlaylist() {
    playlistPanel.classList.remove('open');
  }

  // --- Playback ---
  function loadTrack(index, autoplay, animateCover) {
    currentIndex = ((index % playlist.length) + playlist.length) % playlist.length;
    var track = currentTrack();
    audio.src = track.src;
    renderMeta();
    setCover(track.cover, animateCover);
    highlightActiveItem();
    renderFavorite();
    renderProgress();
    renderTime();
    if (autoplay) {
      audio.play().catch(function () { /* ignore autoplay/user-gesture rejections */ });
    }
  }

  function next() {
    if (shuffle) {
      loadTrack(randomIndex(), true, true);
    } else {
      loadTrack(currentIndex + 1, true, true);
    }
  }

  function randomIndex() {
    if (playlist.length <= 1) {
      return currentIndex;
    }
    var index;
    do {
      index = Math.floor(Math.random() * playlist.length);
    } while (index === currentIndex);
    return index;
  }

  function toggleShuffle() {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle('active', shuffle);
    shuffleBtn.setAttribute('aria-pressed', String(shuffle));
  }

  function previous() {
    if (audio.currentTime > PREV_RESTART_THRESHOLD) {
      audio.currentTime = 0;
    } else {
      loadTrack(currentIndex - 1, true, true);
    }
  }

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
    saveVolume();
  }

  function toggleMute() {
    if (audio.volume > 0) {
      mutedVolume = audio.volume;
      setVolume(0);
    } else {
      setVolume(mutedVolume || DEFAULT_VOLUME);
      mutedVolume = null;
    }
  }

  // --- Events ---
  playBtn.addEventListener('click', togglePlay);
  previousBtn.addEventListener('click', previous);
  nextBtn.addEventListener('click', next);
  playlistBtn.addEventListener('click', togglePlaylist);
  heartBtn.addEventListener('click', toggleFavorite);
  shuffleBtn.addEventListener('click', toggleShuffle);

  audio.addEventListener('play', function () { setPlayingIcon(true); });
  audio.addEventListener('pause', function () { setPlayingIcon(false); });
  audio.addEventListener('ended', next);
  audio.addEventListener('error', function () {
    console.error('material-player: failed to load audio', currentTrack().src);
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
    if (event.target !== document.body) {
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      togglePlay();
    } else if (event.key === 'm' || event.key === 'M') {
      toggleMute();
    }
  });

  // --- Init ---
  buildPlaylist();
  setPlayingIcon(false);
  setVolume(loadVolume());
  loadTrack(0, false, false);
})();