const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 840,
        minWidth: 960,
        minHeight: 640,
        // The game is entirely client-side and uses no Node APIs from the
        // renderer, so there is no reason to weaken the default sandbox.
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        },
        backgroundColor: '#0c0e0a',
        autoHideMenuBar: true, // Game-like feel
        title: "Post-Colonial Republic"
    });

    // In dev, load vite server
    // In prod, load the built index.html
    if (!app.isPackaged) {
        win.loadURL('http://localhost:5173');
        // win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
