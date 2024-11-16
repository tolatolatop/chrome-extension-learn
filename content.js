// 等待页面加载完成
document.addEventListener('DOMContentLoaded', function () {
    console.log('content script loaded');
    initializeButton();
});

// 由于网站使用了动态加载，我们也在页面变化时尝试初始化按钮
let observer = new MutationObserver(function (mutations) {
    initializeButton();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

function initializeButton() {
    const currentHost = window.location.hostname;

    if (currentHost === 'github.com') {
        initGithubButton();
    } else if (currentHost === 'bsky.app') {
        initBskyButton();
    }
}

function initGithubButton() {
    // 检查是否在GitHub仓库页面
    if (window.location.pathname.split('/').length >= 3) {
        const nav = document.querySelector('nav[aria-label="Repository"]');
        if (nav && !nav.querySelector('.analyze-btn')) {
            const button = document.createElement('button');
            button.textContent = '分析仓库';
            button.className = 'btn btn-sm analyze-btn';
            button.style.marginLeft = '10px';

            button.addEventListener('click', analyzeGithubRepo);
            nav.appendChild(button);
            console.log('GitHub分析按钮已添加');
        }
    }
}

function initBskyButton() {
    // 检查是否在用户个人页面
    if (window.location.pathname.startsWith('/profile/')) {
        const header = document.querySelector('header');
        if (header && !header.querySelector('.analyze-btn')) {
            const button = document.createElement('button');
            button.textContent = '分析账号';
            button.className = 'analyze-btn';
            button.style.cssText = `
                background-color: #0066FF;
                color: white;
                border: none;
                border-radius: 20px;
                padding: 8px 16px;
                margin: 10px;
                cursor: pointer;
            `;

            button.addEventListener('click', analyzeBskyProfile);
            header.appendChild(button);
            console.log('Bluesky分析按钮已添加');
        }
    }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('收到消息:', request);
    if (request.action === "performAction") {
        const currentHost = window.location.hostname;
        if (currentHost === 'github.com') {
            analyzeGithubRepo();
        } else if (currentHost === 'bsky.app') {
            analyzeBskyProfile();
        }
    }
});

async function analyzeGithubRepo() {
    console.log('开始分析GitHub仓库');
    try {
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length < 3) {
            throw new Error('不是有效的仓库页面');
        }

        const repoInfo = {
            type: 'github',
            owner: pathParts[1],
            repo: pathParts[2],
            stars: document.querySelector('#repo-stars-counter-star')?.getAttribute('title') || '0',
            forks: document.querySelector('#repo-network-counter')?.getAttribute('title') || '0',
            description: document.querySelector('.f4.my-3')?.textContent?.trim() || '无描述',
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        await saveAndNotify(repoInfo);

    } catch (error) {
        console.error('分析GitHub仓库时出错:', error);
        alert(`分析GitHub仓库时出错: ${error.message}`);
    }
}

async function analyzeBskyProfile() {
    console.log('开始分析Bluesky账号');
    try {
        const handle = window.location.pathname.split('/profile/')[1];
        if (!handle) {
            throw new Error('不是有效的个人页面');
        }

        // 获取用户信息
        const profileInfo = {
            type: 'bluesky',
            handle: handle,
            displayName: document.querySelector('h1')?.textContent?.trim() || handle,
            description: document.querySelector('[data-testid="profileDescription"]')?.textContent?.trim() || '无描述',
            followers: document.querySelector('[data-testid="profileFollowersCount"]')?.textContent?.trim() || '0',
            following: document.querySelector('[data-testid="profileFollowingCount"]')?.textContent?.trim() || '0',
            timestamp: new Date().toISOString(),
            url: window.location.href
        };

        await saveAndNotify(profileInfo);

    } catch (error) {
        console.error('分析Bluesky账号时出错:', error);
        alert(`分析Bluesky账号时出错: ${error.message}`);
    }
}

async function saveAndNotify(data) {
    // 存储到 chrome.storage
    const key = data.type === 'github' ?
        `github_${data.owner}_${data.repo}` :
        `bluesky_${data.handle}`;

    await chrome.storage.local.set({ [key]: data });

    // 通知 background.js
    chrome.runtime.sendMessage({
        action: "dataAnalyzed",
        data: data
    }, response => {
        console.log('background响应:', response);
    });

    // 显示信息
    let message = data.type === 'github' ?
        `GitHub仓库信息已保存：\n\n所有者: ${data.owner}\n仓库名: ${data.repo}\n星标数: ${data.stars}\n分支数: ${data.forks}\n描述: ${data.description}` :
        `Bluesky账号信息已保存：\n\n用户名: ${data.handle}\n显示名称: ${data.displayName}\n关注者: ${data.followers}\n正在关注: ${data.following}\n描述: ${data.description}`;

    alert(message);
} 