ah.proxy({
    onRequest: (config, handler) => {
        const res = window.res[config.url];
        if (res !== undefined) {
            const respType = config.xhr.responseType;
            const content_type = MIME_TYPE_MAP[respType] || "text/text";
            handler.resolve({
                config: config,
                status: 200,
                headers: { "content-type": content_type },
                response: respType === "json" ? JSON.parse(res) : res,
            })
        } else {
            handler.next(config);
        }
    },
})
