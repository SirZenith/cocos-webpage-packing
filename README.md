## 说明

用于将 Cocos Creator 构建项目生成的 web 输出打包成包含所有资源的单个 index.html 文件。

此项目适用于 Cocos Creator 3.7 的启动流程。脚本进行的操作主要包含：

- 将项目所有文件打包为变量 `window.res` 封装至 `index.html` 的 `script` 标签中。
- 通过 hook AJAX 请求和 SystemJS 加载文件的过程，使得文件请求指向 `window.res` 中的数据。
- Hook 字体加载的 FontFaceSet API，尽可能用已打包的资源创建字体。
- 设定 `cc.assetManager.downloader` 使 `cc` 的资源请求指向 `window.res` 中的数据。

## 使用

```bash
git clone https://github.com/SirZenith/cocos-webpage-packing.git
cd cocos-webpage-packing

npm install
npm run build <path-to-your-build>
```

参数 `path-to-your-build` 指向需要打包的构建结果的目录。如：

```bash
npm run build 'D:\Developer\HelloWorld\build\web-mobile'
```
