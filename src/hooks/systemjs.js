{
    const prototype = Object.getPrototypeOf(System);

    // 在打包资源中存在的路径不需要通过请求获取内容
    const originShouldFetch = prototype.shouldFetch;
    prototype.shouldFetch = function(url) {
        if (try_get_packed_resource(url) !== undefined) {
            return true;
        } else {
            return originShouldFetch(arg);
        }
    };

    // 优先加载打包资源，当没有对应资源时才进行请求
    function fetchHookFactory(origin) {
        return (url, options) => {
            const res = try_get_packed_resource(url);

            if (typeof res === "undefined") {
                console.log("systemjs - loading remote resource:", url);

                return origin(url, options)
            }

            console.log("systemjs - loading packed resource:", url);

            return new Promise((resolve, _reject) => {
                const ext = url.split(".").pop();
                const resp = new Response(res, {
                    headers: {
                        "Content-Type": MIME_TYPE_MAP[ext],
                    }
                });

                resolve(resp);
            });
        }
    }

    window.fetch = fetchHookFactory(window.fetch);
    prototype.fetch = fetchHookFactory(prototype.fetch);
}
