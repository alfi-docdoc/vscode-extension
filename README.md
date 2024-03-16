# Docdoc Visual Studio Code

This plugin to speedup running Puro &amp; Pylos microservice in VS Code terminal.

## How to install extension

1. Download extension (\*.vsix)
2. Open vscode extension panel (`CMD` + `Shift` + `X`)
3. Open extension menu (3 dots on top right extension panel)
4. Choose "Install from VSIX..."
5. Select downloaded file on step 1
6. After installation completed, to set Pylos path, open vscode settings (`CMD` + `,`) then search "Docdoc".

## How to run microservice

Simply press `CMD` + `Shift` + `P` then type "Docdoc".

Note: Before you run Pylos microservice, make sure Docker daemon already started.

## How to modify

1. Instal development dependency

```
npm i -g yo generator-code @vscode/vsce
```

2. To build vsix package file, run `pnpm run vsce:package`
3. Reference [vscode extension get started](https://code.visualstudio.com/api/get-started/your-first-extension)

**Happy coding!**
