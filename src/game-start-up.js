function start_engine(cc) {
    const REGEX = /^(?:\w+:\/\/|\.+\/).+/;

    const load_image = (format, url, callback) => {
        const content = window.res[url];

        if (!content) {
            callback(new Error("no resource found"), null);
            return;
        }

        var img = new Image()
        img.onload = () => {
            callback(null, img);
        }
        img.src = `data:image/${format};base64,${content}`;
    };

    const downloader = cc.assetManager.downloader;
    downloader.register({
        ".js": (url, _options, callback) => {
            eval(window.res[url]);
            callback(null);
        },
        ".json": (url, _options, callback) => {
            callback(null, JSON.parse(window.res[url]));
        },
        ".plist": (url, _options, callback) => {
            callback(null, window.res[url]);
        },
        ".png": (url, _options, callback) => {
            load_image('png', url, callback);
        },
        ".jpg": (url, _options, callback) => {
            load_image('jpeg', url, callback);
        },
        ".webp": (url, _options, callback) => {
            load_image('webp', url, callback);
        },
        ".mp3": (url, _options, callback) => {
            // 只支持以webAudio形式播放的声音
            // 将base64编码的声音文件转化为ArrayBuffer
            cc.sys.__audioSupport.context.decodeAudioData(
                base64DecToArr(window.res[url]).buffer,
                // success
                function(buffer) {
                    callback(null, buffer);
                },
                // fail
                function(_buffer) {
                    callback(new Error("mp3-res-fail"), null);
                }
            )
        },
        bundle: (nameOrUrl, options, onComplete) => {
            const bundleName = nameOrUrl.split("/").pop();
            let url = nameOrUrl;
            if (!REGEX.test(url)) {
                if (downloader.remoteBundles.indexOf(bundleName) !== -1) {
                    url = `${downloader.remoteServerAddress}remote/${bundleName}`;
                } else {
                    url = `assets/${bundleName}`;
                }
            }
            const version = options.version || downloader.bundleVers[bundleName];

            const jspath = `${url}/index.${version ? `${version}.` : ''}js`;
            const jsContent = window.res[jspath];
            if (jsContent === undefined) {
                onComplete(new Error(`无法在打包的资源中找到 ${jspath}`));
                return;
            }
            eval(jsContent);

            const config = `${url}/config.${version ? `${version}.` : ''}json`;
            const configContent = window.res[config];
            if (configContent === undefined) {
                onComplete(new Error(`无法在打包的资源中找到 ${config}`));
                return;
            }

            const configOut = JSON.parse(configContent);
            configOut.base = `${url}/`;

            onComplete(null, configOut);
        },
    });

    System.import('./index.js').catch((err) => console.error(err));
}

System.import("cc")
    .then(start_engine)
    .catch((err) => console.error(`引擎加载失败：${err}`));
