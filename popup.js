document.addEventListener('DOMContentLoaded', function () {
    // 加载已拦截的请求数量
    loadInterceptedRequestsCount();

    // 添加查看面板按钮事件
    document.getElementById('openDashboard').addEventListener('click', function (e) {
        e.preventDefault();
        chrome.tabs.create({
            url: chrome.runtime.getURL('dashboard.html')
        });
    });
});

async function loadInterceptedRequestsCount() {
    try {
        const result = await chrome.storage.local.get('interceptedRequests');
        const count = result.interceptedRequests?.length || 0;
        document.getElementById('requestCount').textContent = count;
    } catch (error) {
        console.error('加载请求数量失败:', error);
    }
} 