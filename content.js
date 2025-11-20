// content.js - 运行在 ISOLATED World

// --- 默认配置 ---
let settings = {
  triggerMode: 'click',
  triggerKey: 'Control',
  hoverDelay: 600,
  winWidth: 800,
  winHeight: 600,
  closeMode: 'leave'
};

// --- 状态 ---
let container = null;
let iframe = null;
let closeTimer = null;
let hoverTimer = null; // 用于悬浮触发
let isKeyPressed = false;
let lastMouseX = 0;
let lastMouseY = 0;

// --- 1. 初始化与配置同步 ---
function loadSettings() {
  chrome.storage.sync.get(settings, (items) => {
    settings = items;
    // 通知 interceptor.js 更新配置
    window.dispatchEvent(new CustomEvent('LP_CONFIG_UPDATE', { detail: settings }));
  });
}

// 监听配置变更（用户在选项页修改后即时生效）
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    loadSettings();
  }
});

// 初始加载
loadSettings();


// --- 2. 基础监听 ---

// 鼠标位置追踪
document.addEventListener('mousemove', (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}, true);

// 按键状态追踪
window.addEventListener('keydown', (e) => {
  if (e.key === settings.triggerKey) isKeyPressed = true;
}, true);

window.addEventListener('keyup', (e) => {
  if (e.key === settings.triggerKey) isKeyPressed = false;
}, true);


// --- 3. 触发逻辑 A: 点击触发 (Click Mode) ---
document.addEventListener('click', (e) => {
  // 如果是 click outside 关闭模式，且点击了窗口外部
  if (settings.closeMode === 'clickOutside' && container && container.style.display === 'block') {
    if (!container.contains(e.target)) {
      hidePreview(); // 点击外部关闭
    }
  }

  if (settings.triggerMode !== 'click') return;
  if (!isKeyPressed) return;

  const link = e.target.closest('a');
  if (link && link.href && link.href.startsWith('http')) {
    e.preventDefault();
    e.stopPropagation();
    showPreview(link.href, e.clientX, e.clientY);
  }
}, true);

// 接收来自 interceptor.js 的 window.open 拦截 (仅 click 模式有效)
window.addEventListener('LP_INTERCEPT_URL', (e) => {
  if (settings.triggerMode === 'click') {
    showPreview(e.detail.url, lastMouseX, lastMouseY);
  }
});


// --- 4. 触发逻辑 B: 悬浮触发 (Hover Mode) ---
document.addEventListener('mouseover', (e) => {
  if (settings.triggerMode !== 'hover') return;

  const link = e.target.closest('a');
  if (link && link.href && link.href.startsWith('http')) {
    // 清除之前的定时器
    if (hoverTimer) clearTimeout(hoverTimer);
    
    // 设置新定时器
    hoverTimer = setTimeout(() => {
      showPreview(link.href, e.clientX, e.clientY);
    }, settings.hoverDelay);
  }
});

document.addEventListener('mouseout', (e) => {
  if (settings.triggerMode !== 'hover') return;
  
  // 如果移出了链接，取消即将发生的预览
  // 注意：如果已经显示了预览，是否关闭取决于 closeMode
  if (hoverTimer) clearTimeout(hoverTimer);
});


// --- 5. UI 逻辑 ---

function initUI() {
  if (container) return;

  container = document.createElement('div');
  container.id = 'lp-preview-container';

  const loadingBar = document.createElement('div');
  loadingBar.id = 'lp-loading-bar';
  loadingBar.innerHTML = '<span>Loading...</span><span id="lp-close-btn">✕</span>';

  iframe = document.createElement('iframe');
  iframe.id = 'lp-preview-frame';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups'); 
  iframe.setAttribute('allowfullscreen', 'false'); 

  container.appendChild(loadingBar);
  container.appendChild(iframe);
  document.body.appendChild(container);

  // 关闭按钮
  document.getElementById('lp-close-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    hidePreview();
  });

  // 智能关闭逻辑：移出关闭 (Leave Mode)
  container.addEventListener('mouseleave', () => {
    if (settings.closeMode === 'leave') {
      closeTimer = setTimeout(hidePreview, 300);
    }
  });
  
  container.addEventListener('mouseenter', () => {
    if (settings.closeMode === 'leave' && closeTimer) {
      clearTimeout(closeTimer);
    }
  });
}

function showPreview(url, x, y) {
  initUI();
  if (closeTimer) clearTimeout(closeTimer);

  // 更新尺寸
  container.style.width = settings.winWidth + 'px';
  container.style.height = settings.winHeight + 'px';

  // 处理相对 URL (针对 JS 拦截的场景)
  if (!url.startsWith('http')) {
    const a = document.createElement('a');
    a.href = url;
    url = a.href;
  }

  container.querySelector('span').innerText = `Preview: ${url}`;
  iframe.src = url;

  // 定位
  let left = x + 20;
  let top = y + 20;
  const winW = window.innerWidth;
  const winH = window.innerHeight;

  if (left + settings.winWidth > winW) left = x - settings.winWidth - 20;
  if (left < 0) left = 10;
  if (top + settings.winHeight > winH) top = winH - settings.winHeight - 10;
  if (top < 0) top = 10;

  container.style.left = `${left}px`;
  container.style.top = `${top}px`;
  container.style.display = 'block';
}

function hidePreview() {
  if (container) {
    container.style.display = 'none';
    iframe.src = '';
  }
}