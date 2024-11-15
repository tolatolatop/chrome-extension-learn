// 等待页面加载完成
document.addEventListener('DOMContentLoaded', function () {
    console.log('content script loaded');
    initializeButton();
});

// 由于GitHub使用了动态加载，我们也在页面变化时尝试初始化按钮
let observer = new MutationObserver(function (mutations) {
    initializeButton();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

function initializeButton() {
    // 检查是否在GitHub仓库页面
    if (window.location.pathname.split('/').length >= 3) {
        // 添加自定义按钮到仓库导航栏
        const nav = document.querySelector('nav[aria-label="Repository"]');
        if (nav && !nav.querySelector('.analyze-repo-btn')) {
            const button = document.createElement('button');
            button.textContent = '分析仓库';
            button.className = 'btn btn-sm analyze-repo-btn';
            button.style.marginLeft = '10px';

            button.addEventListener('click', analyzeRepository);
            nav.appendChild(button);
            console.log('分析按钮已添加');
        }
    }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('收到消息:', request);
    if (request.action === "performAction") {
        analyzeRepository();
    }
});

// 分析仓库函数
async function analyzeRepository() {
    console.log('开始分析仓库');
    try {
        // 确保我们在仓库页面
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length < 3) {
            throw new Error('不是有效的仓库页面');
        }

        // 获取仓库信息
        const repoInfo = {
            owner: pathParts[1],
            repo: pathParts[2],
            stars: document.querySelector('#repo-stars-counter-star')?.getAttribute('title') || '0',
            forks: document.querySelector('#repo-network-counter')?.getAttribute('title') || '0',
            description: document.querySelector('.f4.my-3')?.textContent?.trim() || '无描述',
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        console.log('获取到的仓库信息:', repoInfo);

        // 验证数据
        if (!repoInfo.owner || !repoInfo.repo) {
            throw new Error('无法获取仓库基本信息');
        }

        // 存储到 chrome.storage
        await chrome.storage.local.set({
            ['repo_' + repoInfo.owner + '_' + repoInfo.repo]: repoInfo
        });

        // 通知 background.js
        chrome.runtime.sendMessage({
            action: "repoAnalyzed",
            data: repoInfo
        }, response => {
            console.log('background响应:', response);
        });

        // 显示信息
        alert(`仓库信息已保存：\n
所有者: ${repoInfo.owner}\n
仓库名: ${repoInfo.repo}\n
星标数: ${repoInfo.stars}\n
分支数: ${repoInfo.forks}\n
描述: ${repoInfo.description}`);

    } catch (error) {
        console.error('分析仓库时出错:', error);
        alert(`分析仓库时出错: ${error.message}`);
    }
} 