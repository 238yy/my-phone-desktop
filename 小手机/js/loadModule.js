// 模块缓存，避免重复加载
const moduleCache = new Map();

// 加载指定模块的 HTML 并注入到容器中
async function loadModule(moduleName) {
    const container = document.getElementById('module-container');
    if (moduleCache.has(moduleName)) {
        // 使用缓存的内容
        container.innerHTML = moduleCache.get(moduleName);
        container.classList.add('active');
        // 执行模块内的初始化脚本（如果有自定义脚本）
        if (window[`init_${moduleName}`]) {
            window[`init_${moduleName}`]();
        }
        return;
    }

    try {
        const response = await fetch(`modules/${moduleName}.html`);
        const html = await response.text();
        moduleCache.set(moduleName, html);
        container.innerHTML = html;
        container.classList.add('active');
        // 执行模块内的初始化脚本
        if (window[`init_${moduleName}`]) {
            window[`init_${moduleName}`]();
        }
    } catch (error) {
        console.error(`加载模块 ${moduleName} 失败:`, error);
        container.innerHTML = `<div style="padding: 20px; text-align: center;">模块加载失败</div>`;
        container.classList.add('active');
    }
}

// 关闭模块（返回桌面）
function closeModule() {
    const container = document.getElementById('module-container');
    container.classList.remove('active');
    // 可选：清空内容，下次重新加载或保留缓存
    // container.innerHTML = '';
}