// 默认设置
const defaultSettings = {
  triggerMode: 'click', // 'click' or 'hover'
  triggerKey: 'Control',
  hoverDelay: 600,
  winWidth: 800,
  winHeight: 600,
  closeMode: 'leave' // 'leave' or 'clickOutside'
};

// 加载设置
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(defaultSettings, (items) => {
    document.getElementById('triggerMode').value = items.triggerMode;
    document.getElementById('triggerKey').value = items.triggerKey;
    document.getElementById('hoverDelay').value = items.hoverDelay;
    document.getElementById('winWidth').value = items.winWidth;
    document.getElementById('winHeight').value = items.winHeight;
    document.getElementById('closeMode').value = items.closeMode;

    toggleInputs();
  });
});

// 切换显示逻辑
document.getElementById('triggerMode').addEventListener('change', toggleInputs);

function toggleInputs() {
  const mode = document.getElementById('triggerMode').value;
  document.getElementById('keySetting').style.display = mode === 'click' ? 'block' : 'none';
  document.getElementById('hoverSetting').style.display = mode === 'hover' ? 'block' : 'none';
}

// 保存设置
document.getElementById('save').addEventListener('click', () => {
  const settings = {
    triggerMode: document.getElementById('triggerMode').value,
    triggerKey: document.getElementById('triggerKey').value,
    hoverDelay: parseInt(document.getElementById('hoverDelay').value, 10),
    winWidth: parseInt(document.getElementById('winWidth').value, 10),
    winHeight: parseInt(document.getElementById('winHeight').value, 10),
    closeMode: document.getElementById('closeMode').value
  };

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('status');
    status.style.display = 'inline';
    setTimeout(() => { status.style.display = 'none'; }, 1500);
  });
});