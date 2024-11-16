chrome.runtime.onInstalled.addListener(function () {
    console.log('扩展已安装');
    chrome.storage.local.set({
        'analyzedRepos': [],
        'interceptedRequests': []
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('background收到消息:', request);

    if (request.action === "ajaxIntercepted") {
        handleInterceptedRequest(request.data);
    }

    return true;
});

async function handleInterceptedRequest(data) {
    try {
        const result = await chrome.storage.local.get('interceptedRequests');
        let requests = result.interceptedRequests || [];
        requests.push({
            ...data,
            timestamp: new Date().toISOString()
        });

        // 保留最新的1000条记录
        if (requests.length > 1000) {
            requests = requests.slice(-1000);
        }

        await chrome.storage.local.set({ 'interceptedRequests': requests });
        console.log('已保存拦截的请求:', data.url);
    } catch (error) {
        console.error('保存拦截的请求时出错:', error);
    }
} 