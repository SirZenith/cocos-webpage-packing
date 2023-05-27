import * as fs from "fs"
import * as path from "path"
import * as uglify from "uglify-js"
import CleanCSS = require("clean-css")

import config from "./config"

function get_file_content(filepath: string, key?: string): string {
    key = key || path.basename(filepath)
    const prompt = '    - ' + key;
    console.time(prompt);
    let file = fs.readFileSync(filepath);
    console.timeEnd(prompt);

    const ext = path.extname(filepath);
    const need_compress = config.compress_target_extensions.has(ext);
    return need_compress ? file.toString("base64") : file.toString();
}

function ensure_output_dir() {
    const dirnames = [
        path.dirname(config.output_res_js),
        path.dirname(config.output_index_html),
    ]

    for (const name of dirnames) {
        if (!fs.existsSync(name)) {
            fs.mkdirSync(name, { recursive: true });
        }
    }
}

function get_all_child_file(filepath: string): string[] {
    let children = [filepath]
    for (; ;) {
        // 如果都是file类型的,则跳出循环
        if (children.every(v => fs.statSync(v).isFile())) { break }
        // 如果至少有1个directroy类型,则删除这一项,并加入其子项
        children.forEach((child, i) => {
            if (fs.statSync(child).isDirectory()) {
                delete children[i]
                let child_children = fs.readdirSync(child).map(v => path.join(child, v))
                children.push(...child_children)
            }
        })
    }
    return children
}

function write_resjs(root_path: string, asset_path: string) {
    // 读取并写入到一个对象中
    root_path = path.normalize(root_path);
    asset_path = path.join(root_path, asset_path);
    asset_path = path.normalize(asset_path);

    const prefix = path.normalize(`${root_path}/`)
    let res_object: Record<string, string> = {}
    get_all_child_file(asset_path).forEach(path => {
        // 注意,存储时删除BASE_PATH前置
        let store_path = path.slice(prefix.length).replace(/\\/g, "/")
        res_object[store_path] = get_file_content(path, store_path)
    })

    for (const asset of config.special_asset) {
        res_object[asset] = get_file_content(path.join(root_path, asset))
    }

    const json = JSON.stringify(res_object, null, 4)
    fs.writeFileSync(config.output_res_js, `window.res=${json}`)
}

function get_html_code_by_js_file(js_filepath: string, script_type?: string): string {
    let js = get_file_content(js_filepath)
    let min_js = uglify.minify(js).code
    script_type = script_type || "text/javascript"
    const comment = `<!-- ${path.basename(js_filepath)} -->`
    const script_tag = `<script type="${script_type}">${min_js || js}</script>`
    return `${comment}\n${script_tag}`
}

function get_html_code_by_css_file(css_filepath: string): string {
    let css = get_file_content(css_filepath)
    let min_css = new CleanCSS().minify(css).styles
    return `<style>${min_css}</style>`
}

function timed_task(msg: string, func: () => void) {
    console.time(msg)
    func();
    console.timeEnd(msg)
}

export function do_task(root_path: string) {
    ensure_output_dir();

    let html = ""

    // 前置：将res资源写成res.js
    console.log("压缩资源文件")
    timed_task("写入res.js", () => {
        write_resjs(root_path, config.asset_path)
    })

    // 清理html
    timed_task("清理html", () => {
        const html_path = path.join(root_path, config.project_index_html)
        html = get_file_content(html_path)
        html = html.replace(/<link rel="stylesheet".*\/>/gs, "")
        html = html.replace(/<script.*<\/script>/gs, "")
    })

    // 写入css
    timed_task("写入所有css文件", () => {
        config.project_css_files
            .map(v => path.join(root_path, v))
            .forEach(v => {
                const content = get_html_code_by_css_file(v)
                html = html.replace("</head>", `${content}\n</head>`)
            })
    })


    // 写入js
    console.log("写入所有js到html")

    const pre_project_files = [config.output_res_js, ...config.pre_project_internal_js_files]
        .map(v => get_html_code_by_js_file(v))

    const proj_js_files = config.project_js_files.map(v => {
        if (typeof v === "string") {
            const file_path = path.join(root_path, v)
            return get_html_code_by_js_file(file_path)
        } else {
            const script_type = v.type || "text/javascript"
            return `<script src=${v.src} type="${script_type}"></script>`
        }
    })

    const post_project_files = config.post_project_internal_js_files
        .map(v => get_html_code_by_js_file(v))

    const js_tags = pre_project_files
        .concat(proj_js_files)
        .concat(post_project_files)

    html = html.replace("</body>", () => `${js_tags.join('\n')}\n</body>`)

    // 写入文件并提示成功
    timed_task("输出html文件", () => {
        fs.writeFileSync(config.output_index_html, html)
    })
}

const args = process.argv.slice(2)
if (args.length > 0) {
    do_task(args[0])
} else {
    console.error("请传入目标项目的根目录路径");
    process.exit(1);
}
