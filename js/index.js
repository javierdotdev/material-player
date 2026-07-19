/**
 * material-player — Phase 4/5 audio player.
 *
 * Dependency-free, modern JavaScript built on the HTML5 <audio> API.
 * Edit the `playlist` array below to point at your own audio files and covers,
 * or simply drag & drop audio files onto the player.
 */
(function () {
  'use strict';

  // --- Playlist (local, license-free samples) ---
  // `id` is the stable key used for favorites; keep it unique per track.
  var playlist = [
    { id: 'sample-melody', title: 'Sample Melody', artist: 'material-player demo', src: 'audio/sample.mp3', cover: 'images/cover1.svg', glow: 'rgba(255, 95, 109, 0.55)' },
    { id: 'second-sketch', title: 'Second Sketch', artist: 'material-player demo', src: 'audio/sample2.mp3', cover: 'images/cover2.svg', glow: 'rgba(120, 80, 220, 0.55)' },
    { id: 'third-loop', title: 'Third Loop', artist: 'material-player demo', src: 'audio/sample3.mp3', cover: 'images/cover3.svg', glow: 'rgba(56, 210, 130, 0.55)' }
  ];

  var currentIndex = 0;

  var DEFAULT_VOLUME = 0.75; // matches the initial .level width in the CSS
  var PREV_RESTART_THRESHOLD = 3; // seconds: below this, "previous" jumps to the prior track
  var COVER_FADE_MS = 200; // half of the CSS opacity transition, for the crossfade swap
  var SEEK_STEP = 5; // seconds moved by ArrowLeft / ArrowRight
  var VOLUME_STEP = 0.05; // volume moved by ArrowUp / ArrowDown
  var DEFAULT_COVER = 'images/cover-default.svg';
  var STORAGE_FAVORITES = 'material-player:favorites';
  var STORAGE_VOLUME = 'material-player:volume';
  var STORAGE_AMBIENT = 'material-player:ambient';
  var STORAGE_SHUFFLE = 'material-player:shuffle';
  var STORAGE_REPEAT = 'material-player:repeat';

  var shuffle = loadBool(STORAGE_SHUFFLE, false);
  var repeatMode = loadRepeat(); // 'off' | 'all' | 'one'
  var shuffleQueue = []; // Fisher-Yates order of upcoming indices (excludes current)
  var mutedVolume = null;
  var favorites = loadFavorites();
  var ambientOn = loadBool(STORAGE_AMBIENT, true);
  var glowCache = {}; // track.id -> extracted rgba glow

  var audio = new Audio();
  audio.preload = 'metadata';

  // --- Elements ---
  var playBtn = document.querySelector('.pause');
  var playIcon = playBtn.querySelector('.fa');
  var previousBtn = document.querySelector('.previous');
  var nextBtn = document.querySelector('.next');
  var songEl = document.querySelector('.song');
  var artistEl = document.querySelector('.artist');
  var timeEl = document.querySelector('.time');
  var trackBar = document.querySelector('.track');
  var complete = document.querySelector('.complete');
  var volBar = document.querySelector('.vol-bar');
  var level = document.querySelector('.level');
  var volToggle = document.querySelector('.vol-toggle');
  var coverEl = document.querySelector('.cover');
  var playlistPanel = document.querySelector('.playlist-panel');
  var plList = document.querySelector('.pl-list');
  var plClose = document.querySelector('.pl-close');
  var optionsMenu = document.querySelector('.options-menu');
  var heartBtn = document.querySelector('.heart');
  var shuffleBtn = document.querySelector('.shuffle');
  var menuBtn = document.querySelector('.menu');
  var optionsBtn = document.querySelector('.options');
  var volIcon = volToggle.querySelector('.fa');
  var playerEl = document.querySelector('.player');
  var ambientBtn = document.querySelector('.ambient');
  var errorEl = document.querySelector('.player-error');
  var dropOverlay = document.querySelector('.drop-overlay');

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
    trackBar.setAttribute('aria-valuenow', String(Math.round(pct)));
    trackBar.setAttribute('aria-valuetext',
      formatTime(audio.currentTime) + ' of ' + formatTime(audio.duration));
  }

  function renderVolume() {
    var v = audio.volume;
    level.style.width = v * 100 + '%';
    volBar.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    volIcon.classList.toggle('fa-volume-off', v === 0);
    volIcon.classList.toggle('fa-volume-down', v > 0 && v <= 0.5);
    volIcon.classList.toggle('fa-volume-up', v > 0.5);
    setLabel(volToggle, v === 0 ? 'Unmute' : 'Mute');
  }

  function setPlayingIcon(isPlaying) {
    playIcon.classList.toggle('fa-pause', isPlaying);
    playIcon.classList.toggle('fa-play', !isPlaying);
  }

  // --- Accessibility & feedback helpers ---
  function setLabel(el, text) {
    el.title = text;
    el.setAttribute('aria-label', text);
  }

  var errorTimer = null;
  function showError(message) {
    if (!errorEl) {
      return;
    }
    errorEl.textContent = message;
    errorEl.classList.add('show');
    window.clearTimeout(errorTimer);
    errorTimer = window.setTimeout(function () {
      errorEl.classList.remove('show');
    }, 3500);
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

  // --- Persistence (favorites, volume, toggles) ---
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

  function loadBool(key, fallback) {
    var stored = localStorage.getItem(key);
    return stored === null ? fallback : stored === 'true';
  }

  function saveBool(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (e) { /* storage unavailable */ }
  }

  function loadRepeat() {
    var stored = localStorage.getItem(STORAGE_REPEAT);
    return stored === 'all' || stored === 'one' ? stored : 'off';
  }

  function isFavorite(id) {
    return favorites.indexOf(id) !== -1;
  }

  function renderFavorite() {
    var liked = isFavorite(currentTrack().id);
    heartBtn.classList.toggle('liked', liked);
    heartBtn.setAttribute('aria-pressed', String(liked));
    setLabel(heartBtn, liked ? 'Remove favorite' : 'Add to favorite');
  }

  function toggleFavorite() {
    var id = currentTrack().id;
    var index = favorites.indexOf(id);
    if (index === -1) {
      favorites.push(id);
    } else {
      favorites.splice(index, 1);
    }
    saveFavorites();
    renderFavorite();
    renderPlaylistFavorites();
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

  // --- Ambient glow ---
  function applyGlow() {
    var track = currentTrack();
    var glow = glowCache[track.id] || track.glow || 'transparent';
    playerEl.style.setProperty('--glow', ambientOn ? glow : 'transparent');
  }

  /**
   * Extract a dominant color from the cover image (average of a downscaled
   * canvas) so new tracks get a matching glow without hardcoding one.
   * Falls back silently to the track's `glow` property on any failure.
   */
  function extractGlow(track) {
    if (!track.cover || glowCache[track.id]) {
      return;
    }
    var img = new Image();
    img.onload = function () {
      try {
        var size = 10;
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        var data = ctx.getImageData(0, 0, size, size).data;
        var r = 0, g = 0, b = 0, n = data.length / 4;
        for (var i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        glowCache[track.id] = 'rgba(' + Math.round(r / n) + ', ' +
          Math.round(g / n) + ', ' + Math.round(b / n) + ', 0.55)';
        if (track === currentTrack()) {
          applyGlow();
        }
      } catch (e) { /* tainted canvas or unsupported — keep the fallback glow */ }
    };
    img.src = track.cover;
  }

  function toggleAmbient() {
    ambientOn = !ambientOn;
    ambientBtn.classList.toggle('active', ambientOn);
    ambientBtn.setAttribute('aria-pressed', String(ambientOn));
    setLabel(ambientBtn, 'Ambient light: ' + (ambientOn ? 'on' : 'off'));
    applyGlow();
    saveBool(STORAGE_AMBIENT, ambientOn);
  }

  // --- Playlist UI ---
  function buildPlaylist() {
    plList.innerHTML = '';
    playlist.forEach(function (track, index) {
      var item = document.createElement('li');
      var button = document.createElement('button');
      var title = document.createElement('span');
      var artist = document.createElement('span');
      var fav = document.createElement('i');
      button.type = 'button';
      button.className = 'pl-item';
      title.className = 'pl-title';
      artist.className = 'pl-artist';
      fav.className = 'fa fa-heart pl-fav';
      fav.setAttribute('aria-hidden', 'true');
      title.textContent = track.title;
      artist.textContent = track.artist;
      button.appendChild(title);
      button.appendChild(artist);
      button.appendChild(fav);
      button.addEventListener('click', function () {
        loadTrack(index, true, true);
        closePlaylist();
      });
      item.appendChild(button);
      plList.appendChild(item);
    });
    renderPlaylistFavorites();
    highlightActiveItem();
  }

  function renderPlaylistFavorites() {
    var items = plList.children;
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-fav', isFavorite(playlist[i].id));
    }
  }

  function highlightActiveItem() {
    var items = plList.children;
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', i === currentIndex);
    }
  }

  function togglePlaylist(event) {
    if (event) {
      event.stopPropagation();
    }
    closeOptionsMenu();
    playlistPanel.classList.toggle('open');
  }

  function closePlaylist() {
    playlistPanel.classList.remove('open');
  }

  // --- Media Session (lock screen / hardware media keys) ---
  function updateMediaSession() {
    if (!('mediaSession' in navigator)) {
      return;
    }
    var track = currentTrack();
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      artwork: track.cover ? [{ src: track.cover, sizes: '500x320' }] : []
    });
  }

  function setupMediaSession() {
    if (!('mediaSession' in navigator)) {
      return;
    }
    var ms = navigator.mediaSession;
    ms.setActionHandler('play', togglePlay);
    ms.setActionHandler('pause', togglePlay);
    ms.setActionHandler('previoustrack', previous);
    ms.setActionHandler('nexttrack', next);
    try {
      ms.setActionHandler('seekto', function (details) {
        if (audio.duration && typeof details.seekTime === 'number') {
          audio.currentTime = details.seekTime;
        }
      });
    } catch (e) { /* seekto unsupported */ }
  }

  // --- Playback ---
  function loadTrack(index, autoplay, animateCover) {
    currentIndex = ((index % playlist.length) + playlist.length) % playlist.length;
    var track = currentTrack();
    audio.src = track.src;
    renderMeta();
    setCover(track.cover || DEFAULT_COVER, animateCover);
    extractGlow(track);
    applyGlow();
    highlightActiveItem();
    renderFavorite();
    renderProgress();
    renderTime();
    updateMediaSession();
    if (autoplay) {
      audio.play().catch(function () { /* ignore autoplay/user-gesture rejections */ });
    }
  }

  /**
   * Fisher-Yates shuffle of all indices except the current one.
   * The queue is consumed by `next()`; when it runs out, one full "pass"
   * of the playlist has played — which lets shuffle respect repeat=off.
   */
  function rebuildShuffleQueue() {
    shuffleQueue = [];
    for (var i = 0; i < playlist.length; i++) {
      if (i !== currentIndex) {
        shuffleQueue.push(i);
      }
    }
    for (var j = shuffleQueue.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = shuffleQueue[j];
      shuffleQueue[j] = shuffleQueue[k];
      shuffleQueue[k] = tmp;
    }
  }

  function nextShuffleIndex() {
    if (shuffleQueue.length === 0) {
      rebuildShuffleQueue();
    }
    return shuffleQueue.shift();
  }

  function next() {
    if (shuffle) {
      if (playlist.length <= 1) {
        audio.currentTime = 0;
        return;
      }
      loadTrack(nextShuffleIndex(), true, true);
    } else {
      loadTrack(currentIndex + 1, true, true);
    }
  }

  function toggleShuffle() {
    shuffle = !shuffle;
    if (shuffle) {
      rebuildShuffleQueue();
    }
    shuffleBtn.classList.toggle('active', shuffle);
    shuffleBtn.setAttribute('aria-pressed', String(shuffle));
    setLabel(shuffleBtn, 'Shuffle: ' + (shuffle ? 'on' : 'off'));
    saveBool(STORAGE_SHUFFLE, shuffle);
  }

  function renderRepeat() {
    optionsBtn.classList.toggle('repeat-on', repeatMode !== 'off');
    setLabel(optionsBtn, 'Repeat: ' + repeatMode);
    var items = optionsMenu.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) {
      var active = items[i].getAttribute('data-repeat') === repeatMode;
      items[i].classList.toggle('active', active);
      items[i].setAttribute('aria-checked', String(active));
    }
  }

  function setRepeat(mode) {
    repeatMode = mode;
    renderRepeat();
    saveBool(STORAGE_REPEAT, repeatMode);
    closeOptionsMenu();
  }

  function toggleOptionsMenu(event) {
    if (event) {
      event.stopPropagation();
    }
    closePlaylist();
    optionsMenu.classList.toggle('open');
  }

  function closeOptionsMenu() {
    optionsMenu.classList.remove('open');
  }

  function handleEnded() {
    if (repeatMode === 'one') {
      audio.currentTime = 0;
      audio.play().catch(function () { /* ignore autoplay/user-gesture rejections */ });
      return;
    }
    // With repeat off, stop after a full pass — both in linear order
    // (last track) and in shuffle (queue exhausted).
    var endOfPass = shuffle ? shuffleQueue.length === 0
                            : currentIndex === playlist.length - 1;
    if (repeatMode === 'off' && endOfPass) {
      audio.currentTime = 0;
      renderProgress();
      renderTime();
      if (shuffle) {
        rebuildShuffleQueue();
      }
      return;
    }
    next();
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

  function setVolume(value) {
    audio.volume = Math.max(0, Math.min(1, value));
    renderVolume();
    saveVolume();
  }

  function seekBy(seconds) {
    if (audio.duration) {
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    }
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

  // --- Sliders (click + drag via Pointer Events, arrows via keyboard) ---
  function ratioFromPointer(event, element) {
    var rect = element.getBoundingClientRect();
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  }

  function makeSlider(element, onRatio) {
    var dragging = false;
    element.addEventListener('pointerdown', function (event) {
      dragging = true;
      element.classList.add('dragging');
      element.setPointerCapture(event.pointerId);
      onRatio(ratioFromPointer(event, element));
    });
    element.addEventListener('pointermove', function (event) {
      if (dragging) {
        onRatio(ratioFromPointer(event, element));
      }
    });
    function stop(event) {
      if (dragging) {
        dragging = false;
        element.classList.remove('dragging');
        element.releasePointerCapture(event.pointerId);
      }
    }
    element.addEventListener('pointerup', stop);
    element.addEventListener('pointercancel', stop);
  }

  makeSlider(trackBar, function (ratio) {
    if (audio.duration) {
      audio.currentTime = ratio * audio.duration;
    }
  });

  makeSlider(volBar, function (ratio) {
    setVolume(ratio);
  });

  trackBar.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      seekBy(-SEEK_STEP);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      seekBy(SEEK_STEP);
    }
  });

  volBar.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      setVolume(audio.volume - VOLUME_STEP);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      setVolume(audio.volume + VOLUME_STEP);
    }
  });

  // --- Drag & drop local audio files ---
  var dragDepth = 0;

  function hasFiles(event) {
    var types = event.dataTransfer && event.dataTransfer.types;
    return types && Array.prototype.indexOf.call(types, 'Files') !== -1;
  }

  function addDroppedFiles(files) {
    var added = 0;
    var firstNewIndex = playlist.length;
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (!file.type || file.type.indexOf('audio/') !== 0) {
        continue;
      }
      var name = file.name.replace(/\.[^.]+$/, '');
      playlist.push({
        id: 'local:' + file.name + ':' + file.size,
        title: name,
        artist: 'Local file',
        src: URL.createObjectURL(file),
        cover: DEFAULT_COVER,
        glow: 'rgba(75, 108, 183, 0.55)'
      });
      added++;
    }
    if (added === 0) {
      showError('No audio files found in the drop.');
      return;
    }
    buildPlaylist();
    if (shuffle) {
      rebuildShuffleQueue();
    }
    loadTrack(firstNewIndex, true, true);
  }

  document.addEventListener('dragenter', function (event) {
    if (!hasFiles(event)) {
      return;
    }
    dragDepth++;
    playerEl.classList.add('drop-target');
  });
  document.addEventListener('dragleave', function () {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      playerEl.classList.remove('drop-target');
    }
  });
  document.addEventListener('dragover', function (event) {
    if (hasFiles(event)) {
      event.preventDefault();
    }
  });
  document.addEventListener('drop', function (event) {
    if (!hasFiles(event)) {
      return;
    }
    event.preventDefault();
    dragDepth = 0;
    playerEl.classList.remove('drop-target');
    addDroppedFiles(event.dataTransfer.files);
  });

  // --- Events ---
  playBtn.addEventListener('click', togglePlay);
  previousBtn.addEventListener('click', previous);
  nextBtn.addEventListener('click', next);
  heartBtn.addEventListener('click', toggleFavorite);
  shuffleBtn.addEventListener('click', toggleShuffle);
  menuBtn.addEventListener('click', togglePlaylist);
  optionsBtn.addEventListener('click', toggleOptionsMenu);
  ambientBtn.addEventListener('click', toggleAmbient);
  plClose.addEventListener('click', function (event) {
    event.stopPropagation();
    closePlaylist();
  });
  playlistPanel.addEventListener('click', function (event) {
    if (!event.target.closest('.pl-item') && !event.target.closest('.pl-close')) {
      closePlaylist();
    }
  });
  Array.prototype.forEach.call(optionsMenu.querySelectorAll('li'), function (item) {
    item.addEventListener('click', function () {
      setRepeat(item.getAttribute('data-repeat'));
    });
    item.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setRepeat(item.getAttribute('data-repeat'));
      }
    });
  });

  audio.addEventListener('play', function () { setPlayingIcon(true); });
  audio.addEventListener('pause', function () { setPlayingIcon(false); });
  audio.addEventListener('ended', handleEnded);
  audio.addEventListener('error', function () {
    console.error('material-player: failed to load audio', currentTrack().src);
    showError('Unable to load this track.');
  });
  audio.addEventListener('loadedmetadata', function () {
    renderProgress();
    renderTime();
  });
  audio.addEventListener('timeupdate', function () {
    renderProgress();
    renderTime();
  });

  volToggle.addEventListener('click', toggleMute);

  document.addEventListener('click', function (event) {
    if (optionsMenu.classList.contains('open') &&
        !optionsMenu.contains(event.target) &&
        !optionsBtn.contains(event.target)) {
      closeOptionsMenu();
    }
    if (playlistPanel.classList.contains('open') &&
        !playlistPanel.contains(event.target) &&
        !menuBtn.contains(event.target)) {
      closePlaylist();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closePlaylist();
      closeOptionsMenu();
      return;
    }
    if (event.target !== document.body) {
      return; // don't steal keys from focused controls
    }
    if (event.code === 'Space') {
      event.preventDefault();
      togglePlay();
    } else if (event.key === 'm' || event.key === 'M') {
      toggleMute();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      seekBy(-SEEK_STEP);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      seekBy(SEEK_STEP);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setVolume(audio.volume + VOLUME_STEP);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setVolume(audio.volume - VOLUME_STEP);
    }
  });

  // --- Init ---
  buildPlaylist();
  setPlayingIcon(false);
  setVolume(loadVolume());
  renderRepeat();
  setupMediaSession();
  ambientBtn.classList.toggle('active', ambientOn);
  shuffleBtn.classList.toggle('active', shuffle);
  if (shuffle) {
    rebuildShuffleQueue();
  }

  setLabel(menuBtn, 'Playlist');
  setLabel(playBtn, 'Play / pause');
  setLabel(previousBtn, 'Previous');
  setLabel(nextBtn, 'Next');
  setLabel(volBar, 'Volume');
  setLabel(trackBar, 'Seek');
  setLabel(shuffleBtn, 'Shuffle: ' + (shuffle ? 'on' : 'off'));
  setLabel(ambientBtn, 'Ambient light: ' + (ambientOn ? 'on' : 'off'));
  shuffleBtn.setAttribute('aria-pressed', String(shuffle));
  ambientBtn.setAttribute('aria-pressed', String(ambientOn));

  loadTrack(0, false, false);
})();
