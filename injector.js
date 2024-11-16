// 创建script元素
const script = document.createElement('script');
script.src = chrome.runtime.getURL('page-script.js');
script.type = 'text/javascript';

// 注入到页面
(document.head || document.documentElement).appendChild(script);

// 脚本加载完成后移除
script.onload = function () {
    script.remove();
}; 