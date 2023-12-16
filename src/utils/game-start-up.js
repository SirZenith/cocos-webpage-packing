window.addEventListener("load", () => {
    const load_image = (format, url, callback) => {
        const content = try_get_packed_resource(url);

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

    const URL_REGEX = /^(?:\w+:\/\/|\.+\/).+/;
    const DOWNLOADER_MAP = {
        ".js": (_cc, url, _options, callback) => {
            const content = try_get_packed_resource(url);
            eval(content);
            callback(null);
        },
        ".json": (_cc, url, _options, callback) => {
            const content = try_get_packed_resource(url);
            callback(null, JSON.parse(content));
        },
        ".plist": (_cc, url, _options, callback) => {
            content = try_get_packed_resource(url);
            callback(null, url);
        },
        ".png": (_cc, url, _options, callback) => {
            load_image('png', url, callback);
        },
        ".jpg": (_cc, url, _options, callback) => {
            load_image('jpeg', url, callback);
        },
        ".webp": (_cc, url, _options, callback) => {
            load_image('webp', url, callback);
        },
        ".mp3": (cc, url, _options, callback) => {
            const content = try_get_packed_resource(url);

            // 只支持以webAudio形式播放的声音
            // 将base64编码的声音文件转化为ArrayBuffer
            cc.sys.__audioSupport.context.decodeAudioData(
                base64DecToArr(content).buffer,
                // success
                (buffer) => {
                    callback(null, buffer);
                },
                // fail
                (_buffer) => {
                    callback(new Error("mp3-res-fail"), null);
                }
            )
        },
        bundle: (cc, nameOrUrl, options, onComplete) => {
            const downloader = cc.assetManager.downloader;

            const bundleName = nameOrUrl.split("/").pop();
            let url = nameOrUrl;
            if (!URL_REGEX.test(url)) {
                if (downloader.remoteBundles.indexOf(bundleName) !== -1) {
                    url = `${downloader.remoteServerAddress}remote/${bundleName}`;
                } else {
                    url = `assets/${bundleName}`;
                }
            }
            const version = options.version || downloader.bundleVers[bundleName];

            const jspath = `${url}/index.${version ? `${version}.` : ''}js`;
            const jsContent = try_get_packed_resource(jspath);
            if (jsContent === undefined) {
                onComplete(new Error(`无法在打包的资源中找到 ${jspath}`));
                return;
            }

            eval(jsContent);

            const config = `${url}/config.${version ? `${version}.` : ''}json`;
            const configContent = try_get_packed_resource(config);
            if (configContent === undefined) {
                onComplete(new Error(`无法在打包的资源中找到 ${config}`));
                return;
            }

            const configOut = JSON.parse(configContent);
            configOut.base = `${url}/`;

            onComplete(null, configOut);
        },
    }

    const registering_downloaders = (cc) => {
        const downloaders = {};
        for (const [key, handler] of Object.entries(DOWNLOADER_MAP)) {
            downloaders[key] = handler.bind(null, cc);
        }

        cc.assetManager.downloader.register(downloaders);
    }

    const start_engine = (cc) => {
        registering_downloaders(cc);

        System.import('./index.js').catch((err) => console.error(err));
    }

    System.import("cc")
        .then(start_engine)
        .catch((err) => console.error(`引擎加载失败：${err}`));
})
