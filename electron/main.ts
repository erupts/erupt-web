const electron = require('electron');
const {app, BrowserWindow, Menu, shell} = electron;

let template = [
    {
        label: 'Edit ( 操作 )',
        submenu: [{
            label: 'Copy ( 复制 )',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
        }, {
            label: 'Paste ( 粘贴 )',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
        }, {
            label: 'Reload ( 重新加载 )',
            accelerator: 'CmdOrCtrl+R',
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    // on reload, start fresh and close any old
                    // open secondary windows
                    if (focusedWindow.id === 1) {
                        BrowserWindow.getAllWindows().forEach(function (win) {
                            if (win.id > 1) {
                                win.close();
                            }
                        });
                    }
                    focusedWindow.reload();
                }
            }
        }]
    },
    {
        label: 'Window ( 窗口 )',
        role: 'window',
        submenu: [{
            label: 'Minimize ( 最小化 )',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        }, {
            label: 'Close ( 关闭 )',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
        }, {
            label: '切换开发者工具',
            accelerator: (function () {
                if (process.platform === 'darwin') {
                    return 'Alt+Command+I';
                } else {
                    return 'Ctrl+Shift+I';
                }
            })(),
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            }
        }, {
            type: 'separator'
        }]
    },
    {
        label: 'Help ( 帮助 ) ',
        role: 'help',
        submenu: [{
            label: 'FeedBack ( 意见反馈 )',
            click: function () {
                shell.openExternal('https://www.erupt.xyz');
            }
        }]
    }
];

function createWindow() {
    // 创建浏览器窗口
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 375,
        minHeight: 500,
        webPreferences: {
            nodeIntegration: true
        }
    });
    // @ts-ignore
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));


    // 并且为你的应用加载index.html
    win.setTitle("Erupt");
    win.loadFile('/Users/liyuepeng/git/erupt/erupt-web/src/erupt/resources/public/index.html');

    // 打开开发者工具
    // win.webContents.openDevTools()
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// 部分 API 在 ready 事件触发后才能使用。
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
