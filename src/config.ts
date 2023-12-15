export interface PackingConfig {
    /** 资源使用 base64 编码后打包成的 JS 文件的输出路径。*/
    output_res_js: string;
    /** 需要使用 base64 进行编码的资源文件扩展名 */
    compress_target_extensions: string[],

    /** 需要在导出 HTML 中，引擎代码之前加入的 JS 文件的路径 */
    pre_project_internal_js_files: string[],
    /** 需要在导出 HTML 中，引擎代码之后加入的 JS 文件的路径 */
    post_project_internal_js_files: string[],

    /** 最终输出的 HTML 文件的路径? */
    output_index_html: string,

    /** Cocos Creator 构建生成的 index.html 相对于构建输出根目录的路径。*/
    project_index_html: string,

    /** 资源目录相对于构建输出根目录的路径 */
    asset_path: string,
    /** 指定使用某一路径储存在导出的资源路径中的内容。
     * sourcePath 为源文件相对于构建输出根目录的路径；
     * path 为在资源在资源打包输出中记录使用的路径。
     */
    special_assets: Array<{ path: string, sourcePath: string }>,

    /** 构建输出中所有需要整合到输出 HTML 中的 CSS 文件的路径。
     * 路径为相对于构建输出根目录的路径。
     */
    project_css_files: string[];

    /** 项目中所有需要整合到输出的 HTML 中的 JS 文件。
     * 路径为相对于构建输出根目录的路径。
     */
    project_js_files: Array<string | { src: string, type: string }>,
}

export const config: PackingConfig = {
    output_res_js: "build/res.js",
    compress_target_extensions: [
        ".png",
        ".jpg",
        ".webp",
        ".mp3",
        ".cconb",
        ".ttf",
    ],
    pre_project_internal_js_files: [],
    post_project_internal_js_files: [
        "third-party/ajaxhook.min.js",
        "src/hooks/utils.js",
        "src/hooks/systemjs.js",
        "src/hooks/ajax.js",
        "src/hooks/fontloader.js",
        "src/game-start-up.js",
    ],

    output_index_html: "dist/index.html",

    project_index_html: "index.html",

    asset_path: "./",
    special_assets: [],

    project_css_files: [
        "style.css"
    ],

    // 项目中所有需要整合到输出的 HTML 中的 JS 文件，路径为相对于项目根的路径。
    project_js_files: [
        "src/polyfills.bundle.js",
        "src/system.bundle.js",
        {
            src: "src/import-map.json",
            type: "systemjs-importmap",
        },
    ],
}
