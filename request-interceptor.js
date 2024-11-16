// 添加在文件最开始
console.log('[Interceptor] 脚本开始加载', window.location.href);
window.__requestInterceptorLoaded = true;

// 创建 XHR 拦截器
(function () {
    console.log('初始化 XHR 拦截器');
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    const setRequestHeader = XHR.setRequestHeader;

    // 拦截 open 方法
    XHR.open = function (method, url) {
        console.log(`[XHR] 打开请求: ${method} ${url}`);
        this._url = url;
        this._method = method;
        return open.apply(this, arguments);
    };

    // 拦截 setRequestHeader 方法
    XHR.setRequestHeader = function (header, value) {
        console.log(`[XHR] 设置请求头: ${header} = ${value}`);
        if (!this._headers) {
            this._headers = {};
        }
        this._headers[header] = value;
        return setRequestHeader.apply(this, arguments);
    };

    // 拦截 send 方法
    XHR.send = function (postData) {
        console.log(`[XHR] 发送请求: ${this._url}`, postData ? `数据: ${postData}` : '无数据');
        this._postData = postData;

        // 添加响应处理器
        this.addEventListener('load', function () {
            if (this.readyState === 4) {
                console.log(`[XHR] 收到响应: ${this._url}`, {
                    status: this.status,
                    responseType: this.responseType,
                    responseSize: this.response?.length || 0
                });

                const responseData = {
                    url: this._url,
                    method: this._method,
                    headers: this._headers,
                    postData: this._postData,
                    response: this.response,
                    status: this.status,
                    timestamp: new Date().toISOString()
                };

                try {
                    // 尝试解析 JSON 响应
                    if (typeof this.response === 'string') {
                        responseData.response = JSON.parse(this.response);
                        console.log('[XHR] 成功解析 JSON 响应');
                    }
                } catch (e) {
                    console.log('[XHR] 响应不是 JSON 格式');
                }

                // 发送消息到 background script
                console.log('[XHR] 发送响应数据到 background');
                chrome.runtime.sendMessage({
                    action: 'ajaxIntercepted',
                    data: responseData
                }, response => {
                    console.log('[XHR] Background 响应:', response);
                });

                // 处理匹配的规则
                if (window.ajaxHooks) {
                    console.log('[XHR] 开始处理匹配规则');
                    window.ajaxHooks.processRequest(this._url, responseData);
                } else {
                    console.log('[XHR] 未找到 ajaxHooks');
                }
            }
        });

        return send.apply(this, arguments);
    };
})();

// 创建 Fetch 拦截器
(function initFetchInterceptor() {
    // 确保 window.fetch 存在
    if (!window.fetch) {
        console.log('Fetch API 不可用，等待...');
        setTimeout(initFetchInterceptor, 100);
        return;
    }

    console.log('初始化 Fetch 拦截器');

    // 保存原始的 fetch 函数
    const originalFetch = window.fetch;

    // 替换全局的 fetch 函数
    window.fetch = async function interceptedFetch(...args) {
        const [resource, config] = args;
        const url = typeof resource === 'string' ? resource : resource.url;

        console.log(`[Fetch] 发起请求: ${url}`, {
            method: config?.method || 'GET',
            headers: config?.headers || {}
        });

        try {
            console.log(`[Fetch] 执行原始请求: ${url}`);
            const response = await originalFetch.apply(this, args);

            // 克隆响应以便多次读取
            const clonedResponse = response.clone();

            console.log(`[Fetch] 收到响应: ${url}`, {
                status: response.status,
                statusText: response.statusText,
                type: response.type
            });

            // 构建响应数据对象
            const responseData = {
                url: url,
                method: config?.method || 'GET',
                headers: config?.headers || {},
                status: response.status,
                timestamp: new Date().toISOString()
            };

            // 尝试读取响应内容
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    responseData.response = await clonedResponse.json();
                    console.log('[Fetch] 成功解析 JSON 响应');
                } else {
                    responseData.response = await clonedResponse.text();
                    console.log('[Fetch] 响应作为文本处理');
                }
            } catch (error) {
                console.error('[Fetch] 解析响应失败:', error);
                responseData.response = null;
            }

            // 发送消息到 background script
            console.log('[Fetch] 发送响应数据到 background');
            try {
                await chrome.runtime.sendMessage({
                    action: 'ajaxIntercepted',
                    data: responseData
                });
                console.log('[Fetch] 成功发送到 background');
            } catch (error) {
                console.error('[Fetch] 发送到 background 失败:', error);
            }

            // 处理匹配的规则
            if (window.ajaxHooks) {
                console.log('[Fetch] 开始处理匹配规则');
                window.ajaxHooks.processRequest(url, responseData);
            } else {
                console.warn('[Fetch] 未找到 ajaxHooks');
            }

            return response;
        } catch (error) {
            console.error('[Fetch] 请求失败:', error);
            throw error;
        }
    };

    console.log('Fetch 拦截器初始化完成');
})();

// 添加在文件最后
console.log('[Interceptor] 脚本加载完成'); 