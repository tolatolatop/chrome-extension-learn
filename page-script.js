// 保存原始方法
const origXHROpen = XMLHttpRequest.prototype.open;
const origFetch = window.fetch;

// XHR拦截器
XMLHttpRequest.prototype.open = function () {
    this.addEventListener('load', function () {
        if (this.readyState === 4) {
            try {
                const responseData = {
                    url: this.responseURL,
                    method: arguments[0],
                    status: this.status,
                    response: this.responseText,
                    timestamp: new Date().toISOString()
                };

                // 使用自定义事件传递数据到content script
                document.dispatchEvent(new CustomEvent('xhr-intercepted', {
                    detail: responseData
                }));
            } catch (e) {
                console.error('[Page Context] XHR处理错误:', e);
            }
        }
    });
    return origXHROpen.apply(this, arguments);
};

// Fetch拦截器
window.fetch = async function (...args) {
    try {
        const response = await origFetch.apply(this, args);
        const clone = response.clone();
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;

        try {
            const responseData = {
                url: url,
                method: args[1]?.method || 'GET',
                status: response.status,
                timestamp: new Date().toISOString()
            };

            // 尝试读取响应内容
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                responseData.response = await clone.json();
            } else {
                responseData.response = await clone.text();
            }

            // 发送到content script
            document.dispatchEvent(new CustomEvent('fetch-intercepted', {
                detail: responseData
            }));
        } catch (e) {
            console.error('[Page Context] Fetch处理错误:', e);
        }

        return response;
    } catch (error) {
        console.error('[Page Context] Fetch执行错误:', error);
        throw error;
    }
};

console.log('[Page Context] 请求拦截器已注入'); 