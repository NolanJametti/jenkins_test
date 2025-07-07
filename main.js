const { app, BrowserWindow, screen, Tray, Menu } = require('electron');
const path = require('path');

let win;
let tray;

// Gestion des erreurs globales
process.on('uncaughtException', (error) => console.error('Uncaught Exception:', error));

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const gifHeight = 200;

  win = new BrowserWindow({
    x: 0,
    y: height - gifHeight,
    width,
    height: gifHeight,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    focusable: false,
    webPreferences: { 
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Pass-through des clics
  win.setIgnoreMouseEvents(true);

  // Charge la page
  const indexPath = path.join(__dirname, 'index.html');
  win.loadFile(indexPath)
    .then(() => console.log('index.html chargé:', indexPath))
    .catch(err => console.error('Erreur loadFile:', err));
}

function createTray() {
  const iconPath = path.join(__dirname, 'icons', 'tray-icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Afficher/masquer l'animation",
      click: () => {
        if (win.isVisible()) win.hide(); else win.show();
      }
    },
    {
      label: 'Appeler Spike',
      click: () => {
        // Envoie un message au renderer pour déclencher l'animation
        if (win && !win.isDestroyed()) {
          win.webContents.send('call-spike');
        }
      }
    },
    {
      label: 'Quitter',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Skipe');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Ne ferme pas l'app à la fermeture de la seule fenêtre (tray reste actif)
});

app.on('activate', () => {
  if (!win) createWindow();
});