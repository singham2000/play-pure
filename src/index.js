const { app, BrowserWindow, Menu } = require('electron');
const { fetch } = require('cross-fetch');
const { readFileSync, writeFileSync } = require('fs');

const { ElectronBlocker, fullLists, Request } = require('@cliqz/adblocker-electron');


let mainWindow = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    icon: 'src/yy.ico',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      nodeIntegrationInSubFrames: true,
    },
    height: 600,
    width: 800,
  });

  const blocker = await ElectronBlocker.fromLists(
    fetch,
    fullLists,
    {
      enableCompression: true,
    },
    {
      path: 'engine.bin',
      read: async (...args) => readFileSync(...args),
      write: async (...args) => writeFileSync(...args),
    },
  );
  blocker.enableBlockingInSession(mainWindow.webContents.session);

  blocker.on('request-blocked', (request) => {
    console.log('blocked', request.tabId, request.url);
  });

  blocker.on('request-redirected', (request) => {
    console.log('redirected', request.tabId, request.url);
  });

  blocker.on('request-whitelisted', (request) => {
    console.log('whitelisted', request.tabId, request.url);
  });

  blocker.on('csp-injected', (request) => {
    console.log('csp', request.url);
  });

  blocker.on('script-injected', (script, url) => {
    console.log('script', script.length, url);
  });

  blocker.on('style-injected', (style, url) => {
    console.log('style', style.length, url);
  });

  mainWindow.loadURL('https://youtube.com');
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

var menu = Menu.buildFromTemplate([
  {
    label: 'Menu',
    submenu: [

      {
        label: 'Exit',
        click() {
          app.quit()
        }
      }
    ]
  }
])
Menu.setApplicationMenu(menu);

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});