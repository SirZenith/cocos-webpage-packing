const origin_fetch = window.fetch

function try_get_packed_resource(resource) {
    if (typeof resource !== "string") {
        return undefined
    }

    const prefix = `${window.location.protocol}//${window.location.host}/`;
    const path = resource.slice(prefix.length);

    return window.res[path]
}

// 优先加载打包资源，当没有对应资源时才进行请求
function hooked_fetch(resource, option) {
    const res = try_get_packed_resource(resource)

    if (res !== undefined) {
        console.log("load packed resource: " + resource)
        return new Promise(function(resolve, _reject) {
            resolve(new Response(window.res[resource]));
        });
    } else {
        console.log("remote resource")
        return origin_fetch(resource, option)
    }
}

window.fetch = hooked_fetch
