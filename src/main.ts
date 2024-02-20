import * as fs from "fs";
import * as path from "path";
import * as uglify from "uglify-js";
import CleanCSS from "clean-css";

import { config } from "./config";

/**
 * @param filepath - 资源文件路径
 * @param key - 文件在计时器输出文件中使用的名称，缺省时使用文件名
 * @returns 以字符串的形式返回文件内容。
 *     对于在压缩列表中指定的二进制文件扩展名，返回的字符串为文件内容的 base64
 *     编码。
 */
const get_file_content = (filepath: string, key?: string): string => {
    key = key || path.basename(filepath);
    const prompt = "    - " + key;

    console.time(prompt);
    const file = fs.readFileSync(filepath);
    console.timeEnd(prompt);

    const ext = path.extname(filepath);
    const need_compress = config.compress_target_extensions.includes(ext);
    const content = need_compress ? file.toString("base64") : file.toString();

    return content;
};

/**
 * 检查配置文件中指定的输出目录是否存在，若不存在则会创建需要的目录
 */
const ensure_output_dir = (): void => {
    const dirnames = [
        path.dirname(config.output_res_js),
        path.dirname(config.output_index_html),
    ];

    for (const name of dirnames) {
        if (!fs.existsSync(name)) {
            fs.mkdirSync(name, { recursive: true });
        }
    }
};

/**
 * @param root_path - 扫描的起始路径
 * @returns 指定的路径下所有文件的路径组成的列表（包含各个子目录中的文件）
 */
const get_all_child_file = (root_path: string): string[] => {
    const files: string[] = [];
    const targets: string[] = [root_path];

    while (targets.length > 0) {
        const target = targets.pop()!;

        const is_file = fs.statSync(target).isFile();
        if (is_file) {
            files.push(target);
            continue;
        }

        const items = fs.readdirSync(target);
        for (const item of items) {
            const item_path = path.join(target, item);
            targets.push(item_path);
        }
    }

    return files;
};

/**
 * 将指定目录下的资源文件打包为单一的 JS 文件输出
 * @param root - Cocos 构建输出结果的根目录
 * @param asset_path_full - 资源目录构建输出目录下的相对路径
 */
const write_resjs = (root: string, asset_path: string): void => {
    const root_path = path.normalize(root);

    let asset_path_full = path.join(root_path, asset_path);
    asset_path_full = path.normalize(asset_path_full);

    const prefix = path.normalize(`${root_path}/`);
    const asset_files = get_all_child_file(asset_path_full);

    const res_object: Record<string, string> = {};
    for (const filepath of asset_files) {
        // 注意,存储时只保留相对路径部分
        const store_path = filepath.slice(prefix.length).replace(/\\/g, "/");
        res_object[store_path] = get_file_content(filepath, store_path);
    }

    // 处理配置中给出的非标准目录下的资源
    for (const asset of config.special_assets) {
        const filepath = path.join(root_path, asset.sourcePath);
        res_object[asset.path] = get_file_content(filepath);
    }

    const json = JSON.stringify(res_object, null, 4);
    fs.writeFileSync(config.output_res_js, "window.res=" + json);
};

/**
 * @param filepath - JS 脚本文件的路径
 * @param type - 脚本文件对应的特殊类型
 * @returns 脚本内容使用 script 标签包裹成的 HTML 文本
 */
const get_html_tag_by_js_file = (filepath: string, type?: string): string => {
    const js = get_file_content(filepath);

    const min_js = uglify.minify(js).code;
    const script_type = type || "text/javascript";

    const comment = `<!-- ${path.basename(filepath)} -->`;
    const script_tag = `<script type="${script_type}" charset="utf-8">${min_js || js}</script>`;

    return comment + "\n" + script_tag;
};

/**
 * @param filepath - CSS 文件的路径
 * @returns CSS 文件使用 style 标签包裹成的 HTML 文本
 */
const get_html_tag_by_css_file = (filepath: string): string => {
    const css = get_file_content(filepath);
    const min_css = new CleanCSS().minify(css).styles;
    return `<style>${min_css}</style>`;
};

/**
 * 用于进行任务计时的辅助函数
 * @param msg - 计时使用的提示文本内容
 * @param func - 需要计时的任务函数
 */
const timed_task = (msg: string, func: () => void): void => {
    console.time(msg);
    func();
    console.timeEnd(msg);
};

/**
 * 将 Cocos 构建输出结果打包成单个 HTML 文件
 * @param root_path - Cocos 构建输出结果的根目录
 */
const pack_project = (root_path: string): void => {
    ensure_output_dir();

    let html = "";
    const js_block_buffer: string[] = [];

    timed_task("打包所有资源到单个文件", () => {
        write_resjs(root_path, config.asset_path);
    });

    timed_task("读取项目 HTML 内容", () => {
        const html_path = path.join(root_path, config.project_index_html);
        html = get_file_content(html_path);
        html = html.replace(/<link rel="stylesheet".*\/>/gs, "");
        html = html.replace(/<script.*<\/script>/gs, "");
    });

    timed_task("写入所有css文件", () => {
        const css_content = config.project_css_files
            .map((css_file) => {
                const filepath = path.join(root_path, css_file);
                return get_html_tag_by_css_file(filepath);
            })
            .join("\n");

        html = html.replace("</head>", () => {
            return "\n" + css_content + "\n</head>";
        });
    });

    timed_task("读取前置 JS", (): void => {
        const pre_project_js_files = [
            config.output_res_js,
            ...config.pre_project_internal_js_files,
        ];

        for (const filepath of pre_project_js_files) {
            const content = get_html_tag_by_js_file(filepath);
            js_block_buffer.push(content);
        }
    });

    timed_task("读取项目 JS", (): void => {
        const project_js_files = config.project_js_files;

        for (const file_info of project_js_files) {
            if (typeof file_info === "string") {
                const filepath = path.join(root_path, file_info);
                const content = get_html_tag_by_js_file(filepath);
                js_block_buffer.push(content);
            } else {
                const script_type = file_info.type || "text/javascript";
                const content = `<script src="${file_info.src}" type="${script_type}" charset="utf-8"></script>`;
                js_block_buffer.push(content);
            }
        }
    });

    timed_task("读取后置 JS", (): void => {
        const post_project_js_files = config.post_project_internal_js_files;

        for (const filepath of post_project_js_files) {
            const content = get_html_tag_by_js_file(filepath);
            js_block_buffer.push(content);
        }
    });

    timed_task("输出最终文件", (): void => {
        // 纯字符形式的 replace 调用会引起 cc.js 内容导出错误
        html = html.replace("</body>", () => {
            return "\n" + js_block_buffer.join("\n") + "\n</body>";
        });

        timed_task("输出html文件", () => {
            fs.writeFileSync(config.output_index_html, html);
        });
    });
};

// ----------------------------------------------------------------------------

const args = process.argv.slice(2);
if (args.length > 0) {
    pack_project(args[0]);
} else {
    console.error("请传入目标项目的根目录路径");
    process.exit(1);
}
