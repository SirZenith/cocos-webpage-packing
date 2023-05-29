/** 一些配置参数
 * - [注意] 路径问题.start脚本与web-mobile同层级,因此相对路径需要带上web-mobile;cocos在调用资源时没有web-mobile,需要在最后去掉
 */

const config = {
    // 资源使用 base64 编码后打包成的 JS 文件的输出路径。
    output_res_js: "build/res.js",
    // 需要使用 base64 进行编码的资源文件
    compress_target_extensions: new Set([
        ".png", ".jpg", ".webp", ".mp3",
    ]),
    // 本脚本需要向输出 HTML 中添加的 JS 内容
    pre_project_internal_js_files: [
    ],
    post_project_internal_js_files: [
        "third-party/ajaxhook.min.js",
        "src/hooks/utils.js",
        "src/hooks/systemjs.js",
        "src/hooks/ajax.js",
        "src/game-start-up.js",
    ],

    // 最终输出的 HTML 文件的路径。
    output_index_html: "dist/index.html",

    // Cocos Creator 构建生成的 index.html 相对于项目根的路径。
    project_index_html: "index.html",

    // 资源目录相对于项目根目录的路径。
    asset_path: "./",
    // 指定使用某一路径储存在导出的资源路径中的内容
    // 形式为 { path: string, sourcePath: string }
    special_asset: [],

    // 项目中所有需要整合到输出 HTML 中的 CSS 文件，路径为相对于项目根的路径。
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

export default config;
