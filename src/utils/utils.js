// ----------------------------------------------------------------------------
// base64 编解码

// https://developer.mozilla.org/zh-CN/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_1_%E2%80%93_JavaScript's_UTF-16_%3E_base64
const b64ToUint6 = (nChr) => {
    return nChr > 64 && nChr < 91
        ? nChr - 65 : nChr > 96 && nChr < 123
            ? nChr - 71 : nChr > 47 && nChr < 58
                ? nChr + 4 : nChr === 43
                    ? 62 : nChr === 47
                        ? 63 : 0
}

const base64DecToArr = (sBase64, nBlockSize) => {
    var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length
    var nOutLen = nBlockSize ? Math.ceil((nInLen * 3 + 1 >>> 2) / nBlockSize) * nBlockSize : nInLen * 3 + 1 >>> 2
    var aBytes = new Uint8Array(nOutLen)
    for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
            for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
                aBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
            }
            nUint24 = 0
        }
    }
    return aBytes
}

// ----------------------------------------------------------------------------

const MIME_TYPE_MAP = {
    text: "text/text",
    js: "application/javascript",
    json: "application/json",
    css: "text/css",
    wasm: "application/wasm",
    arraybuffer: "application/octet-stream",
}

const RESOURCE_URL_PREFIX = `${window.location.protocol}//${window.location.host}/`;
const RESOURCE_PATH_PREFIX = (() => {
    const segments = window.location.pathname.split("/");
    segments.pop();
    return "file://" + segments.join("/") + "/";
})();
const RESOURCE_ROOT_RELATIVE_PREFIX = "/";

const try_get_packed_resource = (url) => {
    if (typeof url !== "string") {
        return undefined;
    }

    let prefix = "";
    if (url.startsWith("/")) {
        // 相对于网址根目录的文件
        prefix = RESOURCE_ROOT_RELATIVE_PREFIX;
    } else if (url.startsWith("file:///")) {
        // 远程主机名为空的 file:// 协议请求是访问本地文件
        prefix = RESOURCE_PATH_PREFIX;
    } else if (url.startsWith(RESOURCE_URL_PREFIX)) {
        prefix = RESOURCE_URL_PREFIX;
    }

    const path = url.slice(prefix.length);

    return window.res[path];
}

const resource_post_progress = (res, respType) => {
    let data = res;

    switch (respType) {
        case "json":
            data = JSON.parse(res);
            break;
        case "arraybuffer":
            data = base64DecToArr(res).buffer;
            break;
        default:
            break;
    }

    return data;
}
