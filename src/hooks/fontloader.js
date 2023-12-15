window.addEventListener("load", () => {
    let font_face_hooked = false;

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

        prototype.load = function(...args) {
            const result = old_load.call(this, ...args);
            return result;
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
                        console.log("font loaded:", font_family);
                    },
                    (err) => {
                        console.log(err);
                    },
                );
            } else {
                old_load.call(this, fontspec);
            }

        }
    }

    hook_font_face_set();
}, false);
