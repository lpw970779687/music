/* ============================================
   🎵 Music Player - 播放器核心逻辑
   ============================================ */

// ============================================
// 1. 播放列表配置
// ============================================
// 🎯 使用说明：将 MP3 文件放入 music/ 文件夹，
//    然后按以下格式添加歌曲信息即可。
//    支持自定义封面图片（放入 img/ 文件夹）或使用默认封面。
// ============================================

const PLAYLIST = [
  {
    title: '泡沫',
    artist: '鸟森',
    file: 'http://120.48.138.203/music/%E9%B8%9F%E6%A3%AE_-_%E6%B3%A1%E6%B2%AB.MP3',
    cover: 'img/default-cover.svg'
  }
];

// ============================================
// 2. DOM 引用
// ============================================
const audio = document.getElementById('audioPlayer');
const coverImg = document.getElementById('coverImage');
const songTitle = document.getElementById('songTitle');
const songArtist = document.getElementById('songArtist');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const muteBtn = document.getElementById('muteBtn');
const progressBar = document.getElementById('progressBar');
const progressCurrent = document.getElementById('progressCurrent');
const progressThumb = document.getElementById('progressThumb');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeBar = document.getElementById('volumeBar');
const volumeCurrent = document.getElementById('volumeCurrent');
const volumeThumb = document.getElementById('volumeThumb');
const playlistList = document.getElementById('playlistList');
const songCount = document.getElementById('songCount');
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');

// ============================================
// 3. 状态管理
// ============================================
const state = {
  currentIndex: 0,
  isPlaying: false,
  isShuffled: false,
  repeatMode: 'none', // 'none' | 'one' | 'all'
  isMuted: false,
  volume: 0.7,
  shuffleHistory: [],
  shuffleIndex: -1
};

// ============================================
// 4. 音频上下文 & 可视化
// ============================================
let audioCtx = null;
let analyser = null;
let source = null;
let animationId = null;

function initAudioContext() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 128;

  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
  canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
}

function drawVisualizer() {
  if (!analyser) return;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const barCount = bufferLength / 2;
  const barWidth = w / barCount;
  const gap = 1;

  for (let i = 0; i < barCount; i++) {
    const value = dataArray[i] / 255;
    const barHeight = value * h;

    // 渐变颜色
    const hue = 240 + (value * 60);
    const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
    gradient.addColorStop(0, `hsla(${hue}, 80%, 70%, 0.8)`);
    gradient.addColorStop(1, `hsla(${hue + 20}, 80%, 60%, 0.4)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(
      i * (barWidth + gap),
      h - barHeight,
      barWidth,
      barHeight
    );
  }

  animationId = requestAnimationFrame(drawVisualizer);
}

function startVisualizer() {
  resizeCanvas();
  drawVisualizer();
}

function stopVisualizer() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

// ============================================
// 5. 核心播放功能
// ============================================
function loadSong(index) {
  const song = PLAYLIST[index];
  if (!song) return;

  state.currentIndex = index;
  audio.src = song.file;
  songTitle.textContent = song.title;
  songArtist.textContent = song.artist;
  coverImg.src = song.cover;

  // 更新播放列表高亮
  updatePlaylistActive();

  // 重置进度
  progressCurrent.style.width = '0%';
  progressThumb.style.left = '0%';
  currentTimeEl.textContent = '0:00';
  totalTimeEl.textContent = '0:00';
}

function play() {
  if (PLAYLIST.length === 0) return;

  if (audio.src === '' || audio.src === window.location.href) {
    loadSong(state.currentIndex);
  }

  audio.play().then(() => {
    state.isPlaying = true;
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    coverImg.classList.add('playing');
    updatePlaylistActive();

    // 初始化音频上下文（需用户交互后）
    if (!audioCtx) {
      try { initAudioContext(); } catch (e) { /* 静默降级 */ }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    startVisualizer();
  }).catch(err => {
    console.warn('播放失败:', err);
    state.isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    coverImg.classList.remove('playing');
  });
}

function pause() {
  audio.pause();
  state.isPlaying = false;
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
  coverImg.classList.remove('playing');
  updatePlaylistActive();
  stopVisualizer();
}

function togglePlay() {
  if (state.isPlaying) {
    pause();
  } else {
    play();
  }
}

function nextSong() {
  if (PLAYLIST.length === 0) return;

  if (state.isShuffled) {
    // 随机模式
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * PLAYLIST.length);
    } while (nextIndex === state.currentIndex && PLAYLIST.length > 1);
    state.shuffleIndex++;
    state.shuffleHistory[state.shuffleIndex] = nextIndex;
    loadSong(nextIndex);
  } else {
    const next = (state.currentIndex + 1) % PLAYLIST.length;
    loadSong(next);
  }

  if (state.isPlaying) {
    play();
  } else {
    // 加载后自动播放
    play();
  }
}

function prevSong() {
  if (PLAYLIST.length === 0) return;

  if (state.isShuffled && state.shuffleIndex > 0) {
    state.shuffleIndex--;
    const prev = state.shuffleHistory[state.shuffleIndex];
    loadSong(prev);
    if (state.isPlaying) play();
    return;
  }

  // 如果当前进度超过 3 秒，回到开头
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  const prev = (state.currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
  loadSong(prev);
  if (state.isPlaying) {
    play();
  } else {
    play();
  }
}

// ============================================
// 6. 进度条
// ============================================
function updateProgress() {
  if (!audio.duration) return;

  const percent = (audio.currentTime / audio.duration) * 100;
  progressCurrent.style.width = `${percent}%`;
  progressThumb.style.left = `${percent}%`;

  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration);
}

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function setProgress(e) {
  const rect = progressBar.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audio.currentTime = percent * audio.duration;
  updateProgress();
}

// ============================================
// 7. 音量控制
// ============================================
function setVolume(e) {
  const rect = volumeBar.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  state.volume = percent;
  audio.volume = percent;
  volumeCurrent.style.width = `${percent * 100}%`;
  volumeThumb.style.left = `${percent * 100}%`;
  updateMuteIcon();
}

function toggleMute() {
  state.isMuted = !state.isMuted;
  audio.muted = state.isMuted;
  updateMuteIcon();
}

function updateMuteIcon() {
  if (state.isMuted || state.volume === 0) {
    muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
  } else if (state.volume < 0.5) {
    muteBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
  } else {
    muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
}

// ============================================
// 8. 随机 & 循环模式
// ============================================
function toggleShuffle() {
  state.isShuffled = !state.isShuffled;
  shuffleBtn.classList.toggle('active', state.isShuffled);

  if (state.isShuffled) {
    state.shuffleHistory = [state.currentIndex];
    state.shuffleIndex = 0;
  }
}

function cycleRepeatMode() {
  const modes = ['none', 'one', 'all'];
  const currentIdx = modes.indexOf(state.repeatMode);
  state.repeatMode = modes[(currentIdx + 1) % modes.length];
  repeatBtn.classList.toggle('active', state.repeatMode !== 'none');
  repeatBtn.dataset.mode = state.repeatMode;
  repeatBtn.title = state.repeatMode === 'none' ? '循环模式：无'
    : state.repeatMode === 'one' ? '循环模式：单曲循环'
    : '循环模式：列表循环';
}

// ============================================
// 9. 播放列表渲染
// ============================================
function renderPlaylist() {
  playlistList.innerHTML = '';
  songCount.textContent = `${PLAYLIST.length} 首`;

  PLAYLIST.forEach((song, index) => {
    const li = document.createElement('li');
    li.className = 'playlist-item';
    li.dataset.index = index;
    li.innerHTML = `
      <span class="item-index">${index + 1}</span>
      <div class="item-info">
        <div class="item-title">${song.title}</div>
        <div class="item-artist">${song.artist}</div>
      </div>
      <span class="item-duration" id="duration-${index}">--:--</span>
      <span class="playing-indicator"></span>
    `;
    li.addEventListener('click', () => {
      if (index === state.currentIndex) {
        togglePlay();
      } else {
        loadSong(index);
        play();
      }
    });
    playlistList.appendChild(li);
  });

  updatePlaylistActive();
}

function updatePlaylistActive() {
  document.querySelectorAll('.playlist-item').forEach((item, index) => {
    item.classList.toggle('active', index === state.currentIndex && state.isPlaying);
  });
}

function updatePlaylistDuration(index, duration) {
  const el = document.getElementById(`duration-${index}`);
  if (el) el.textContent = formatTime(duration);
}

// ============================================
// 10. 键盘快捷键
// ============================================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // 忽略输入框内的快捷键
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        e.preventDefault();
        audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        audio.currentTime = Math.max(audio.currentTime - 5, 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        state.volume = Math.min(1, state.volume + 0.1);
        audio.volume = state.volume;
        volumeCurrent.style.width = `${state.volume * 100}%`;
        volumeThumb.style.left = `${state.volume * 100}%`;
        updateMuteIcon();
        break;
      case 'ArrowDown':
        e.preventDefault();
        state.volume = Math.max(0, state.volume - 0.1);
        audio.volume = state.volume;
        volumeCurrent.style.width = `${state.volume * 100}%`;
        volumeThumb.style.left = `${state.volume * 100}%`;
        updateMuteIcon();
        break;
      case 'KeyN':
        nextSong();
        break;
      case 'KeyP':
        prevSong();
        break;
      case 'KeyM':
        toggleMute();
        break;
      case 'KeyS':
        toggleShuffle();
        break;
      case 'KeyR':
        cycleRepeatMode();
        break;
    }
  });
}

// ============================================
// 11. 事件绑定
// ============================================
function setupEventListeners() {
  // 播放控制
  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', prevSong);
  nextBtn.addEventListener('click', nextSong);
  shuffleBtn.addEventListener('click', toggleShuffle);
  repeatBtn.addEventListener('click', cycleRepeatMode);
  muteBtn.addEventListener('click', toggleMute);

  // 音频事件
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
    updatePlaylistDuration(state.currentIndex, audio.duration);
  });
  audio.addEventListener('ended', () => {
    if (state.repeatMode === 'one') {
      audio.currentTime = 0;
      play();
    } else if (state.repeatMode === 'all' || state.currentIndex < PLAYLIST.length - 1) {
      nextSong();
    } else {
      state.isPlaying = false;
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
      coverImg.classList.remove('playing');
      updatePlaylistActive();
      stopVisualizer();
    }
  });
  audio.addEventListener('error', () => {
    console.warn('音频加载失败，请检查文件路径:', audio.src);
    // 自动跳到下一首
    if (state.isPlaying) nextSong();
  });

  // 进度条拖拽
  let isDragging = false;
  progressBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    setProgress(e);
  });
  document.addEventListener('mousemove', (e) => {
    if (isDragging) setProgress(e);
  });
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // 音量条拖拽
  let isVolumeDragging = false;
  volumeBar.addEventListener('mousedown', (e) => {
    isVolumeDragging = true;
    setVolume(e);
  });
  document.addEventListener('mousemove', (e) => {
    if (isVolumeDragging) setVolume(e);
  });
  document.addEventListener('mouseup', () => {
    isVolumeDragging = false;
  });

  // 窗口大小变化时重绘可视化
  window.addEventListener('resize', () => {
    if (state.isPlaying && audioCtx) resizeCanvas();
  });

  // 触摸支持
  progressBar.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setProgress(e.touches[0]);
  }, { passive: false });
  volumeBar.addEventListener('touchstart', (e) => {
    e.preventDefault();
    setVolume(e.touches[0]);
  }, { passive: false });
}

// ============================================
// 12. 初始化
// ============================================
function init() {
  // 设置初始音量
  audio.volume = state.volume;
  volumeCurrent.style.width = `${state.volume * 100}%`;
  volumeThumb.style.left = `${state.volume * 100}%`;

  // 渲染播放列表
  renderPlaylist();

  // 加载第一首歌
  if (PLAYLIST.length > 0) {
    loadSong(0);
  }

  // 绑定事件
  setupEventListeners();
  setupKeyboardShortcuts();

  // 初始化可视化 canvas
  resizeCanvas();

  console.log('🎵 Music Player 已启动！');
  console.log(`📀 共 ${PLAYLIST.length} 首歌曲`);
  console.log('⌨️  快捷键: Space=播放/暂停, ←/→=快退/快进, ↑/↓=音量, N=下一首, P=上一首, M=静音, S=随机, R=循环');
}

// 启动播放器
document.addEventListener('DOMContentLoaded', init);