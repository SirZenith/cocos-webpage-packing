const originShouldFetch = System.constructor.prototype.shouldFetch;
System.constructor.prototype.shouldFetch = function(url) {
    if (try_get_packed_resource(url) !== undefined) {
        return true;
    } else {
        return originShouldFetch(arg);
    }
};

// 优先加载打包资源，当没有对应资源时才进行请求
function fetchHookFactory(origin) {
    return function(url, options) {
        const res = try_get_packed_resource(url)

        if (res !== undefined) {
            console.log("load packed resource: " + url)
            const ext = url.split(".").pop();
            return new Promise(function(resolve, _reject) {
                const resp = new Response(res, {
                    headers: {
                        "Content-Type": MIME_TYPE_MAP[ext],
                    }
                });
                resolve(resp);
            });
        } else {
            console.log("remote resource")
            return origin(url, options)
        }
    }
}

window.fetch = fetchHookFactory(window.fetch);
System.constructor.prototype.fetch = fetchHookFactory(System.constructor.prototype.fetch);
