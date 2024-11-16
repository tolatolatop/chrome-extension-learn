// 等待页面加载完成
document.addEventListener('DOMContentLoaded', function () {
    console.log('[Content Script] 加载完成');
    initializeMutationObserver();
});

// 初始化 MutationObserver
function initializeMutationObserver() {
    if (document.body) {
        let observer = new MutationObserver(function (mutations) {
            // 可以在这里添加DOM变化的处理逻辑
            console.log('[Content Script] DOM变化');
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log('[Content Script] MutationObserver 已初始化');
    } else {
        const observer = new MutationObserver(function (mutations, obs) {
            if (document.body) {
                obs.disconnect();
                initializeMutationObserver();
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        console.log('[Content Script] 等待 body 元素出现...');
    }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('[Content Script] 收到消息:', request);
    // 在这里处理来自popup的消息
}); 