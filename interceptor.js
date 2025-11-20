// interceptor.js - 运行在 MAIN World
(function() {
  let settings = {
    triggerMode: 'click',
    triggerKey: 'Control'
  };
  let isKeyPressed = false;

  // 1. 监听配置更新 (来自 content.js)
  window.addEventListener('LP_CONFIG_UPDATE', (e) => {
    if (e.detail) {
      settings = { ...settings, ...e.detail };
    }
  });

  // 2. 监听按键 (动态识别)
  window.addEventListener('keydown', (e) => {
    if (e.key === settings.triggerKey) isKeyPressed = true;
  }, true);
  
  window.addEventListener('keyup', (e) => {
    if (e.key === settings.triggerKey) isKeyPressed = false;
  }, true);

  window.addEventListener('blur', () => { isKeyPressed = false; });

  // 3. 劫持 window.open
  const originalOpen = window.open;

  window.open = function(url, target, features) {
    // 如果模式是 'hover'，我们通常不拦截 JS 点击跳转，因为没有“悬浮并执行JS”这种操作
    // JS 拦截主要用于 'click' 模式
    if (settings.triggerMode === 'click' && isKeyPressed && url) {
      const event = new CustomEvent('LP_INTERCEPT_URL', { detail: { url: url } });
      window.dispatchEvent(event);
      return null;
    }
    return originalOpen.apply(window, arguments);
  };

})();