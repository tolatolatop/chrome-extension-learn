// 处理拦截到的请求
const ajaxHooks = {
    rules: [],
    responseHandlers: new Map(), // 存储响应处理器

    addRule(pattern, callback) {
        console.log('[Content Script] 添加规则:', pattern);
        this.rules.push({ pattern, callback });
    },

    // 添加响应处理器
    addResponseHandler(pattern, handler) {
        console.log('[Content Script] 添加响应处理器:', pattern);
        this.responseHandlers.set(pattern, handler);
    },

    // 处理请求
    processRequest(data) {
        console.log('[Content Script] 处理请求:', data.url);
        for (const rule of this.rules) {
            if (data.url.includes(rule.pattern)) {
                console.log('[Content Script] 匹配规则:', rule.pattern);
                return rule.callback(data);
            }
        }
        return data;
    },

    // 处理响应
    processResponse(data) {
        console.log('[Content Script] 处理响应:', data.url);
        for (const [pattern, handler] of this.responseHandlers) {
            if (data.url.includes(pattern)) {
                console.log('[Content Script] 匹配响应处理器:', pattern);
                try {
                    handler(data);
                } catch (error) {
                    console.error('[Content Script] 响应处理器执行错误:', error);
                }
            }
        }
    }
};

// 监听来自页面上下文的XHR请求
document.addEventListener('xhr-intercepted', function (e) {
    console.log('[Content Script] 接收到XHR请求:', e.detail.url);
    const processed = ajaxHooks.processRequest(e.detail);
    // 处理响应
    ajaxHooks.processResponse(processed);

    chrome.runtime.sendMessage({
        action: 'ajaxIntercepted',
        data: processed,
        type: 'xhr'
    }).catch(err => console.error('[Content Script] 发送XHR消息失败:', err));
});

// 监听来自页面上下文的Fetch请求
document.addEventListener('fetch-intercepted', function (e) {
    console.log('[Content Script] 接收到Fetch请求:', e.detail.url);
    const processed = ajaxHooks.processRequest(e.detail);
    // 处理响应
    ajaxHooks.processResponse(processed);

    chrome.runtime.sendMessage({
        action: 'ajaxIntercepted',
        data: processed,
        type: 'fetch'
    }).catch(err => console.error('[Content Script] 发送Fetch消息失败:', err));
});

// 添加示例规则和响应处理器
ajaxHooks.addRule('github.com/', data => {
    console.log('[Content Script] 处理GitHub请求:', data.url);
    return data;
});

// 示例：添加GitHub API响应处理器
ajaxHooks.addResponseHandler('github.com/', data => {
    console.log('[Content Script] 处理GitHub仓库响应:', data);
    // 这里可以修改页面DOM或者处理数据
    if (data.response && data.status === 200) {
        // 例如：修改页面上的仓库信息
        const repoInfo = document.querySelector('.repository-content');
        if (repoInfo) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'ajax-intercepted-info';
            infoDiv.textContent = `Last API Call: ${new Date().toLocaleString()}`;
            repoInfo.prepend(infoDiv);
        }
    }
});

// 示例：添加Bluesky API响应处理器
ajaxHooks.addResponseHandler('bsky.app/', data => {
    console.log('[Content Script] 处理Bluesky响应:', data);
    // 在这里处理Bluesky的响应数据
    if (data.response && data.status === 200) {
        // 处理响应数据，修改页面等
    }
});

console.log('[Content Script] Ajax钩子初始化完成');

// 导出钩子供其他模块使用
window.ajaxHooks = ajaxHooks;