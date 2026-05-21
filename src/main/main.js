const { app, BrowserWindow, session, Menu, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');


let mainWindow;

// High-efficiency block list for common trackers, ads, and telemetry
const trackingBlockList = [
  '*://*.google-analytics.com/*',
  '*://*.doubleclick.net/*',
  '*://*.connect.facebook.net/*',
  '*://*.googlesyndication.com/*',
  '*://*.analytics.tiktok.com/*',
  '*://*.scorecardresearch.com/*',
  '*://*.telemetry/*'
];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Crucial for embedding fluid tab frames
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Layer 1: Network-level Tracker Blocker
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: trackingBlockList },
    (details, callback) => {
      console.log(`[Blocked Network Request]: ${details.url}`);
      callback({ cancel: true });
    }
  );

  // Aggressive Caching Engine Rule Setup
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    let responseHeaders = { ...details.responseHeaders };
    
    // Wipe out server instructions that slow down loading by forcing re-fetches
    delete responseHeaders['cache-control'];
    delete responseHeaders['pragma'];
    delete responseHeaders['expires'];

    // Inject aggressive, long-term local caching rules for static performance assets
    const url = details.url.toLowerCase();
    if (url.includes('.js') || url.includes('.css') || url.includes('.png') || url.includes('.jpg') || url.includes('.woff2')) {
      responseHeaders['Cache-Control'] = ['public, max-age=31536000, immutable'];
    } else {
      responseHeaders['Cache-Control'] = ['public, max-age=86400']; // 1 Day for standard files
    }

    callback({ cancel: false, responseHeaders });
  });

  // Custom Help/Application Menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Visit AuroraX Website',
          click: async () => {
            await shell.openExternal('https://aurorax-browser-aurorax-done-team-a.vercel.app/');
          }
        }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // Custom Context Menu Item
  mainWindow.webContents.on('context-menu', (e, params) => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Visit AuroraX Website',
        click: async () => {
          await shell.openExternal('https://aurorax-browser-aurorax-done-team-a.vercel.app/');
        }
      }
    ]);
    contextMenu.popup(mainWindow);
  });

  // Auto-Updater Checking and Execution Layer
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    console.log('[Auto-Updater]: Update detected on remote channel. Fetching assets...');
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('[Auto-Updater]: Package fetched successfully. Restarting browser...');
    autoUpdater.quitAndInstall();
  });

  autoUpdater.on('error', (err) => {
    console.error('[Auto-Updater]: Integration channel exception:', err);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
