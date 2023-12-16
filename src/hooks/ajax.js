ah.proxy({
    onRequest: (config, handler) => {
        const url = config.url || "";
        const res = try_get_packed_resource(url);

        if (typeof res === "undefined") {
            console.log("ajax - loading remote asset", url);

            handler.next(config);
            return;
        }

        console.log("ajax - loading packed asset", url);

        const respType = config.xhr.responseType;
        const content_type = MIME_TYPE_MAP[respType] || "text/text";

        handler.resolve({
            config: config,
            status: 200,
            headers: { "content-type": content_type },
            response: resource_post_progress(res, respType),
        })
    },
})
