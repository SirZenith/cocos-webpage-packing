/** 一些配置参数
 * - [注意] 路径问题.start脚本与web-mobile同层级,因此相对路径需要带上web-mobile;cocos在调用资源时没有web-mobile,需要在最后去掉
 */

const config = {
    compress_target_extensions: new Set([       // 需要使用base64编码的资源后缀(根据项目自行扩充)
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

    // 资源使用 base64 编码后打包成的 JS 文件的输出路径。
    output_res_js: "build/res.js",
    // 最终输出的 HTML 文件的路径。
    output_index_html: "dist/index.html",

    // cocos creator 工程的 web-mobile 发布结果的根路径，
    // 此参数亦可通过命令行传入。命令行参数具有更高的优先级。
    project_root_path: "src/web-mobile",

    // 构建结果的 index.html 的路径，路径为相对于项目根的相对路径。
    project_index_html: "index.html",

    // 资源目录相对于项目根目录的相对路径。
    asset_path: "./",
    // 指定使用某一路径储存在导出的资源路径中的内容
    // 形式为 { path: string, sourcePath: string }
    special_asset: [
        /*
        "cocos-js/cc.js",
        "index.js",
        "application.js",
        "src/import-map.json",
        "src/chunks/bundle.js",
        "src/polyfills.bundle.js",
        "src/system.bundle.js",
        "src/settings.json",
        */
    ],

    // 项目中所有需要整合到输出 HTML 中的 CSS 文件，路径为相对于项目根的相对路径。
    project_css_files: [
        "style.css"
    ],

    // 项目中所有需要整合到输出的 HTML 中的 JS 文件，路径为相对于项目根的相对路径。
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
