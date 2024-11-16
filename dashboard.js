// 格式化时间
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('zh-CN');
}

// 加载并显示请求数据
async function loadRequests() {
    const requestList = document.getElementById('requestList');
    requestList.innerHTML = '';

    try {
        const result = await chrome.storage.local.get('interceptedRequests');
        const requests = result.interceptedRequests || [];

        if (requests.length === 0) {
            requestList.innerHTML = `
                <div class="empty-state">
                    <h3>暂无数据</h3>
                    <p>还没有拦截到任何请求</p>
                </div>
            `;
            return;
        }

        // 按时间倒序排序
        requests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        requests.forEach(request => {
            const card = document.createElement('div');
            card.className = 'request-card';
            card.innerHTML = `
                <div class="request-header">
                    <span class="method ${request.method.toLowerCase()}">${request.method}</span>
                    <span class="url">${request.url}</span>
                </div>
                <div class="status">状态: ${request.status}</div>
                <div class="timestamp">时间: ${formatDate(request.timestamp)}</div>
                <div class="response-data">
                    <pre>${JSON.stringify(request.response, null, 2)}</pre>
                </div>
            `;
            requestList.appendChild(card);
        });
    } catch (error) {
        console.error('加载数据失败:', error);
        requestList.innerHTML = `
            <div class="empty-state">
                <h3>加载失败</h3>
                <p>获取数据时出错</p>
            </div>
        `;
    }
}

// 添加事件监听器
document.addEventListener('DOMContentLoaded', () => {
    loadRequests();

    document.getElementById('refreshButton').addEventListener('click', loadRequests);
    document.getElementById('clearButton').addEventListener('click', async () => {
        if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
            await chrome.storage.local.set({ 'interceptedRequests': [] });
            loadRequests();
        }
    });
}); 