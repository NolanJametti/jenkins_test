const { app, BrowserWindow, screen, Tray, Menu } = require('electron');
const path = require('path');

let win;
let tray;
let isInteractiveMode = false;
let isAutoModeEnabled = true; // Mode automatique activé par défaut
let autoInteractiveTimer = null; // Timer pour déclencher "Viens ici" automatiquement
let autoDismissTimer = null; // Timer pour "Oust !" automatique

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

function createDebugWindow() {
  if (win && !win.isDestroyed()) {
    // Ouvre les DevTools en mode détaché (fenêtre séparée)
    win.webContents.openDevTools({ mode: 'detach' });
    console.log('DevTools ouverts en mode détaché');
  }
}

function scheduleAutoInteractive() {
  if (!isAutoModeEnabled) return;
  
  // Annule le timer précédent s'il existe
  if (autoInteractiveTimer) {
    clearTimeout(autoInteractiveTimer);
  }
  
  // Timer aléatoire entre 10 minutes et 3 heures (en millisecondes)
  const minDelay = 10 * 60 * 1000; // 10 minutes
  const maxDelay = 3 * 60 * 60 * 1000; // 3 heures
  const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
  
  console.log(`Mode auto: Prochain "Viens ici" automatique dans ${Math.round(randomDelay / 60000)} minutes`);
  
  autoInteractiveTimer = setTimeout(() => {
    if (!isInteractiveMode && isAutoModeEnabled) {
      console.log('Déclenchement automatique de "Viens ici"');
      triggerInteractiveMode();
    } else {
      // Si déjà en mode interactif, reprogrammer
      scheduleAutoInteractive();
    }
  }, randomDelay);
}

function triggerInteractiveMode() {
  if (win && !win.isDestroyed()) {
    win.webContents.send('come-here');
    isInteractiveMode = true;
    updateTrayMenu();
    
    // Programmer l'arrêt automatique après 5-15 minutes
    const minDuration = 5 * 60 * 1000; // 5 minutes
    const maxDuration = 15 * 60 * 1000; // 15 minutes
    const randomDuration = Math.random() * (maxDuration - minDuration) + minDuration;
    
    console.log(`Mode auto: "Oust !" automatique dans ${Math.round(randomDuration / 60000)} minutes`);
    
    autoDismissTimer = setTimeout(() => {
      if (isInteractiveMode) {
        console.log('Arrêt automatique de "Viens ici"');
        dismissInteractiveMode();
      }
    }, randomDuration);
  }
}

function dismissInteractiveMode() {
  if (win && !win.isDestroyed()) {
    win.webContents.send('dismiss-spike');
    isInteractiveMode = false;
    updateTrayMenu();
    
    // Reprogrammer le prochain cycle automatique
    scheduleAutoInteractive();
  }
}

function toggleAutoMode() {
  isAutoModeEnabled = !isAutoModeEnabled;
  
  if (isAutoModeEnabled) {
    console.log('Mode automatique activé');
    scheduleAutoInteractive();
  } else {
    console.log('Mode automatique désactivé');
    // Annuler tous les timers automatiques
    if (autoInteractiveTimer) {
      clearTimeout(autoInteractiveTimer);
      autoInteractiveTimer = null;
    }
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
    }
  }
  
  updateTrayMenu();
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Afficher/masquer l'animation",
      click: () => {
        if (win.isVisible()) win.hide(); else win.show();
      }
    },
    {
      label: 'Spike !',
      click: () => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('call-spike');
        }
      }
    },
    {
      label: isInteractiveMode ? 'Oust !' : 'Viens ici',
      click: () => {
        if (win && !win.isDestroyed()) {
          if (isInteractiveMode) {
            // Annule le timer automatique de dismiss si on fait "Oust !" manuellement
            if (autoDismissTimer) {
              clearTimeout(autoDismissTimer);
              autoDismissTimer = null;
            }
            dismissInteractiveMode();
          } else {
            // Annule le timer automatique de déclenchement si on fait "Viens ici" manuellement
            if (autoInteractiveTimer) {
              clearTimeout(autoInteractiveTimer);
              autoInteractiveTimer = null;
            }
            triggerInteractiveMode();
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: '🐛 Ouvrir Console Debug',
      click: () => {
        createDebugWindow();
      }
    },
    { type: 'separator' },
    {
      label: isAutoModeEnabled ? 'Au panier !' : 'C\'est bon !',
      click: () => {
        toggleAutoMode();
      }
    },
    {
      label: 'Quitter',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray() {
  const iconPath = path.join(__dirname, 'icons', 'tray-icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Spike');
  updateTrayMenu();
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  
  // Démarre le mode automatique par défaut
  console.log('Démarrage du mode automatique');
  scheduleAutoInteractive();
});

app.on('window-all-closed', () => {
  // Ne ferme pas l'app à la fermeture de la seule fenêtre (tray reste actif)
});

app.on('before-quit', () => {
  // Nettoie les timers avant fermeture
  if (autoInteractiveTimer) {
    clearTimeout(autoInteractiveTimer);
  }
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer);
  }
});

app.on('activate', () => {
  if (!win) createWindow();
});