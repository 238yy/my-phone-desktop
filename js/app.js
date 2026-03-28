// 主题管理、时间更新、全局状态等（与之前大HTML中的逻辑类似）
const desktopDiv = document.getElementById('desktopApp');
const liveTimeSpan = document.getElementById('liveTime');
const liveDateSpan = document.getElementById('liveDate');
const weatherSpan = document.getElementById('weatherTemp');

// 更新时间
function updateDateTime() {
    const now = new Date();
    liveTimeSpan.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    liveDateSpan.innerText = now.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
setInterval(updateDateTime, 1000);
updateDateTime();

// 模拟天气
const weatherList = ['22°', '19°', '24°', '18°'];
setInterval(() => {
    weatherSpan.innerText = weatherList[Math.floor(Math.random() * weatherList.length)] + '°';
}, 3600000);
weatherSpan.innerText = '22°';

// 主题应用
let currentTheme = localStorage.getItem('app_theme') || 'light';
function applyTheme(theme) {
    desktopDiv.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('app_theme', theme);
    // 通知其他模块更新样式（通过自定义事件）
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}
applyTheme(currentTheme);

// 全局设置开关（通知、AI友好模式、图标光泽）存储
let notifyEnabled = localStorage.getItem('notify') === 'true';
let aiFriendly = localStorage.getItem('aiFriendly') !== 'false';
let iconGlow = localStorage.getItem('iconGlow') === 'true';

function setIconGlow(enable) {
    const icons = document.querySelectorAll('.icon-bg, .dock-icon');
    icons.forEach(icon => {
        if(enable) icon.style.boxShadow = "0 0 14px rgba(0,122,255,0.5), 0 8px 16px rgba(0,0,0,0.1)";
        else icon.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.05)";
    });
    localStorage.setItem('iconGlow', enable);
}
setIconGlow(iconGlow);

// 将全局设置暴露给子模块
window.globalSettings = {
    get notifyEnabled() { return notifyEnabled; },
    get aiFriendly() { return aiFriendly; },
    get iconGlow() { return iconGlow; },
    setNotify: (val) => { notifyEnabled = val; localStorage.setItem('notify', val); },
    setAiFriendly: (val) => { aiFriendly = val; localStorage.setItem('aiFriendly', val); },
    setIconGlow: (val) => { iconGlow = val; setIconGlow(val); },
    applyTheme
};

// 点击桌面图标和 Dock 项时加载对应模块
document.querySelectorAll('.app-icon, .dock-item').forEach(el => {
    el.addEventListener('click', () => {
        const moduleName = el.getAttribute('data-module');
        if (moduleName) loadModule(moduleName);
    });
});

// 返回按钮事件（需要模块内提供关闭按钮，调用 closeModule）
window.closeModule = closeModule;