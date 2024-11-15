chrome.runtime.onInstalled.addListener(function () {
    console.log('扩展已安装');
    chrome.storage.local.set({ 'analyzedRepos': [] });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('background收到消息:', request);

    if (request.action === "repoAnalyzed") {
        handleRepoData(request.data);
        // 发送响应
        sendResponse({ status: 'success' });
    }

    // 必须返回 true 以支持异步响应
    return true;
});

async function handleRepoData(repoData) {
    try {
        console.log('处理仓库数据:', repoData);

        const result = await chrome.storage.local.get('analyzedRepos');
        let analyzedRepos = result.analyzedRepos || [];

        // 检查是否已存在相同的仓库
        const existingIndex = analyzedRepos.findIndex(
            repo => repo.owner === repoData.owner && repo.repo === repoData.repo
        );

        if (existingIndex !== -1) {
            // 更新现有条目
            analyzedRepos[existingIndex] = {
                ...repoData,
                analyzedAt: new Date().toISOString()
            };
        } else {
            // 添加新条目
            analyzedRepos.push({
                ...repoData,
                analyzedAt: new Date().toISOString()
            });
        }

        // 保持最新的100条记录
        if (analyzedRepos.length > 100) {
            analyzedRepos = analyzedRepos.slice(-100);
        }

        await chrome.storage.local.set({ 'analyzedRepos': analyzedRepos });
        console.log('仓库数据已保存，当前总数:', analyzedRepos.length);
    } catch (error) {
        console.error('处理仓库数据时出错:', error);
    }
}

async function getAnalyzedRepos() {
    try {
        const result = await chrome.storage.local.get('analyzedRepos');
        return result.analyzedRepos || [];
    } catch (error) {
        console.error('获取仓库数据时出错:', error);
        return [];
    }
} 