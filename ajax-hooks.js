// 处理拦截到的请求
const ajaxHooks = {
    rules: [],

    addRule(pattern, callback) {
        console.log('[Content Script] 添加规则:', pattern);
        this.rules.push({ pattern, callback });
    },

    processRequest(data) {
        console.log('[Content Script] 处理请求:', data.url);
        for (const rule of this.rules) {
            if (data.url.includes(rule.pattern)) {
                console.log('[Content Script] 匹配规则:', rule.pattern);
                return rule.callback(data);
            }
        }
        return data;
    }
};

// 监听来自页面上下文的XHR请求
document.addEventListener('xhr-intercepted', function (e) {
    console.log('[Content Script] 接收到XHR请求:', e.detail.url);
    const processed = ajaxHooks.processRequest(e.detail);
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
    chrome.runtime.sendMessage({
        action: 'ajaxIntercepted',
        data: processed,
        type: 'fetch'
    }).catch(err => console.error('[Content Script] 发送Fetch消息失败:', err));
});

// 添加默认规则
ajaxHooks.addRule('github.com/', data => {
    console.log('[Content Script] 处理GitHub请求:', data.url);
    return data;
});

ajaxHooks.addRule('bsky.app/', data => {
    console.log('[Content Script] 处理Bluesky请求:', data.url);
    return data;
});

console.log('[Content Script] Ajax钩子初始化完成');