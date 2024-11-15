document.addEventListener('DOMContentLoaded', function () {
    const actionButton = document.getElementById('actionButton');
    const openDashboardLink = document.getElementById('openDashboard');

    actionButton.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "performAction"
                }).catch(error => {
                    console.error('发送消息失败:', error);
                    alert('请确保您正在浏览 GitHub 仓库页面');
                });
            }
        });
    });

    openDashboardLink.addEventListener('click', function (e) {
        e.preventDefault();
        chrome.tabs.create({
            url: chrome.runtime.getURL('dashboard.html')
        });
    });
}); 