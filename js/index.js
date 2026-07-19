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
    { title: 'Sample Melody', artist: 'material-player demo', src: 'audio/sample.wav', cover: 'images/cover1.svg', glow: 'rgba(255, 95, 109, 0.55)' },
    { title: 'Second Sketch', artist: 'material-player demo', src: 'audio/sample2.wav', cover: 'images/cover2.svg', glow: 'rgba(120, 80, 220, 0.55)' },
    { title: 'Third Loop', artist: 'material-player demo', src: 'audio/sample3.wav', cover: 'images/cover3.svg', glow: 'rgba(56, 210, 130, 0.55)' }
  ];

  var currentIndex = 0;

  var DEFAULT_VOLUME = 0.75; // matches the initial .level width in the CSS
  var PREV_RESTART_THRESHOLD = 3; // seconds: below this, "previous" jumps to the prior track
  var COVER_FADE_MS = 200; // half of the CSS opacity transition, for the crossfade swap
  var STORAGE_FAVORITES = 'material-player:favorites';
  var STORAGE_VOLUME = 'material-player:volume';
  var STORAGE_AMBIENT = 'material-player:ambient';

  var shuffle = false;
  var repeatMode = 'off'; // 'off' | 'all' | 'one'
  var mutedVolume = null;
  var favorites = loadFavorites();
  var ambientOn = loadAmbient();

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
    var v = audio.volume;
    level.style.width = v * 100 + '%';
    volIcon.classList.toggle('fa-volume-off', v === 0);
    volIcon.classList.toggle('fa-volume-down', v > 0 && v <= 0.5);
    volIcon.classList.toggle('fa-volume-up', v > 0.5);
    volToggle.title = v === 0 ? 'Unmute' : 'Mute';
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
    var liked = isFavorite(currentTrack().src);
    heartBtn.classList.toggle('liked', liked);
    heartBtn.title = liked ? 'Remove favorite' : 'Add to favorite';
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

  function loadAmbient() {
    var stored = localStorage.getItem(STORAGE_AMBIENT);
    return stored === null ? true : stored === 'true';
  }

  function saveAmbient() {
    try {
      localStorage.setItem(STORAGE_AMBIENT, String(ambientOn));
    } catch (e) { /* storage unavailable */ }
  }

  function applyGlow() {
    playerEl.style.setProperty('--glow', ambientOn ? currentTrack().glow : 'transparent');
  }

  function toggleAmbient() {
    ambientOn = !ambientOn;
    ambientBtn.classList.toggle('active', ambientOn);
    ambientBtn.title = 'Ambient light: ' + (ambientOn ? 'on' : 'off');
    applyGlow();
    saveAmbient();
  }

  // --- Playlist UI ---
  function buildPlaylist() {
    plList.innerHTML = '';
    playlist.forEach(function (track, index) {
      var item = document.createElement('li');
      var title = document.createElement('span');
      var artist = document.createElement('span');
      var fav = document.createElement('i');
      title.className = 'pl-title';
      artist.className = 'pl-artist';
      fav.className = 'fa fa-heart pl-fav';
      fav.setAttribute('aria-hidden', 'true');
      title.textContent = track.title;
      artist.textContent = track.artist;
      item.appendChild(title);
      item.appendChild(artist);
      item.appendChild(fav);
      item.addEventListener('click', function () {
        loadTrack(index, true, true);
        closePlaylist();
      });
      plList.appendChild(item);
    });
    renderPlaylistFavorites();
  }

  function renderPlaylistFavorites() {
    var items = plList.children;
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-fav', isFavorite(playlist[i].src));
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

  // --- Playback ---
  function loadTrack(index, autoplay, animateCover) {
    currentIndex = ((index % playlist.length) + playlist.length) % playlist.length;
    var track = currentTrack();
    audio.src = track.src;
    renderMeta();
    setCover(track.cover, animateCover);
    applyGlow();
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
    shuffleBtn.title = 'Shuffle: ' + (shuffle ? 'on' : 'off');
  }

  function renderRepeat() {
    optionsBtn.classList.toggle('repeat-on', repeatMode !== 'off');
    optionsBtn.setAttribute('aria-label', 'Repeat: ' + repeatMode);
    optionsBtn.title = 'Repeat: ' + repeatMode;
    var items = optionsMenu.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', items[i].getAttribute('data-repeat') === repeatMode);
    }
  }

  function setRepeat(mode) {
    repeatMode = mode;
    renderRepeat();
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
    if (repeatMode === 'off' && !shuffle && currentIndex === playlist.length - 1) {
      audio.currentTime = 0;
      renderProgress();
      renderTime();
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
    if (!event.target.closest('.pl-list li') && !event.target.closest('.pl-close')) {
      closePlaylist();
    }
  });
  Array.prototype.forEach.call(optionsMenu.querySelectorAll('li'), function (item) {
    item.addEventListener('click', function () {
      setRepeat(item.getAttribute('data-repeat'));
    });
  });

  audio.addEventListener('play', function () { setPlayingIcon(true); });
  audio.addEventListener('pause', function () { setPlayingIcon(false); });
  audio.addEventListener('ended', handleEnded);
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
  renderRepeat();
  ambientBtn.classList.toggle('active', ambientOn);
  menuBtn.title = 'Playlist';
  playBtn.title = 'Play / pause';
  previousBtn.title = 'Previous';
  nextBtn.title = 'Next';
  volBar.title = 'Volume';
  shuffleBtn.title = 'Shuffle: ' + (shuffle ? 'on' : 'off');
  ambientBtn.title = 'Ambient light: ' + (ambientOn ? 'on' : 'off');
  loadTrack(0, false, false);
})();