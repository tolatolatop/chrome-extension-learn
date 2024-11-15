// 格式化时间
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}

// 加载并显示仓库数据
async function loadRepos() {
    const repoList = document.getElementById('repoList');
    repoList.innerHTML = ''; // 清空现有内容

    try {
        const result = await chrome.storage.local.get('analyzedRepos');
        const repos = result.analyzedRepos || [];

        if (repos.length === 0) {
            repoList.innerHTML = `
                <div class="empty-state">
                    <h3>暂无数据</h3>
                    <p>还没有分析过任何仓库</p>
                </div>
            `;
            return;
        }

        // 按时间倒序排序
        repos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        repos.forEach(repo => {
            const card = document.createElement('div');
            card.className = 'repo-card';
            card.innerHTML = `
                <h3><a href="https://github.com/${repo.owner}/${repo.repo}" target="_blank">
                    ${repo.owner}/${repo.repo}
                </a></h3>
                <div class="description">${repo.description || '暂无描述'}</div>
                <div class="stats">
                    <span>⭐ ${repo.stars || '0'}</span>
                    <span>🍴 ${repo.forks || '0'}</span>
                </div>
                <div class="timestamp">分析时间: ${formatDate(repo.timestamp)}</div>
            `;
            repoList.appendChild(card);
        });
    } catch (error) {
        console.error('加载数据失败:', error);
        repoList.innerHTML = `
            <div class="empty-state">
                <h3>加载失败</h3>
                <p>获取数据时出错</p>
            </div>
        `;
    }
}

// 清除所有数据
async function clearData() {
    if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
        try {
            await chrome.storage.local.clear();
            await chrome.storage.local.set({ 'analyzedRepos': [] });
            loadRepos(); // 重新加载（显示空状态）
            alert('数据已清除');
        } catch (error) {
            console.error('清除数据失败:', error);
            alert('清除数据时出错');
        }
    }
}

// 添加事件监听器
document.addEventListener('DOMContentLoaded', () => {
    loadRepos();

    document.getElementById('refreshButton').addEventListener('click', loadRepos);
    document.getElementById('clearButton').addEventListener('click', clearData);
}); 