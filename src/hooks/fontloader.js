window.addEventListener("load", () => {
    let font_face_hooked = false;

    const get_css_rule_font_family = (cssRule) => {
        if (!(cssRule instanceof CSSFontFaceRule)) {
            return;
        }

        const family = cssRule.style.getPropertyValue("font-family");
        if (!family) {
            return null;
        }

        return family.replace(/^['"]/, "").replace(/['"]$/, "");
    }

    const get_css_rule_font_url = (cssRule) => {
        const src = cssRule.style.getPropertyValue("src");
        if (!src) {
            return null;
        }

        const url = src.match(/url\(['"](.+?)['"]\)/)[1];
        if (!url) {
            return null;
        }

        return url;
    }

    const find_css_rule_by_font_family = (font_family) => {
        let result = null;

        for (const styleSheet of document.styleSheets) {
            for (const rule of styleSheet.cssRules) {
                const family = get_css_rule_font_family(rule);

                if (family === font_family) {
                    result = rule;
                    break;
                }
            }

            if (result) {
                break;
            }
        }

        return result;
    }

    const find_font_url_among_rules = (font_family) => {
        const rule = find_css_rule_by_font_family(font_family);
        if (!rule) {
            console.log("no rule found for font family:", font_family);
            return null;
        }

        const url = get_css_rule_font_url(rule);
        if (!url) {
            console.log("not url provided in @font-face rule:", rule.cssText);
            return null;
        }

        return url;
    }

    /**
     * Wrap `load` method of FontFace. Use base64 data in packed resource to
     * create new font instead of sending web request when possible.
     */
    const hook_font_face = () => {
        if (font_face_hooked) {
            return;
        }

        const { done, value: face } = document.fonts.values().next();
        if (done) {
            console.log("no font face object found");
            return;
        }

        const prototype = Object.getPrototypeOf(face);
        const old_load = prototype.load;

        prototype.load = function() {
            const font_family = this.family.replace(/^['"]/, "").replace(/['"]$/, "");
            const url = find_font_url_among_rules(font_family);
            const res = try_get_packed_resource(url);

            if (res) {
                console.log("FontFace - loading packed font:", url);

                const data = resource_post_progress(res, "arraybuffer");

                const font = new FontFace(font_family, data);
                return old_load.call(font).then(
                    () => {
                        document.fonts.delete(this);
                        document.fonts.add(font);
                    }
                );
            } else {
                console.log("FontFace - loading remote font:", url);

                return old_load.call(this,);
            }

        }

        font_face_hooked = true;
    }

    const get_font_face_by_family_name = (family) => {
        let result = null;

        const iter = document.fonts.values();
        let iter_var = iter.next();
        while (!iter_var.done) {
            const face_family = iter_var.value.family.replace(/^['"]/, "").replace(/['"]$/, "");
            if (face_family === family) {
                result = iter_var.value;
                break;
            }
        }

        return result;
    }

    /**
     * Wrap `load` method of FontFaceSet. Redirect loading job to FontFace object
     * when there is already a FontFace object for give font family, avoiding
     * making DOM web request.
     */
    const hook_font_face_set = () => {
        if (!document.fonts) {
            console.log("FontFaceSet API not supported");
            return;
        }

        const prototype = Object.getPrototypeOf(document.fonts);
        const old_load = prototype.load;

        prototype.load = function(fontspec) {
            hook_font_face();

            const font_family = fontspec.split(" ")[1];

            const face = get_font_face_by_family_name(font_family);

            if (face) {
                face.load().then(
                    () => {
                        console.log("FontFaceSet - font loaded:", font_family);
                    },
                    (err) => {
                        console.log("FontFaceSet - failed to load font", err);
                    },
                );
            } else {
                old_load.call(this, fontspec);
            }

        }
    }

    hook_font_face_set();
}, false);
