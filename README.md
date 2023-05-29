## 说明

用于将 Cocos Creator 构建项目生成的 web 输出打包成包含所有资源的单个 index.html 文件。

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
