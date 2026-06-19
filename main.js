// frontend/main.js
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// ✅ ESM Helper: Define __dirname since it's not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Ferrari Foods",
    // ✅ Use the logo from your local assets folder as the app icon
    icon: path.join(__dirname, 'assets', 'icon.png'), 
    webPreferences: {
      // Security best practices for loading external production URLs
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the production URL of your management system
  win.loadURL('https://ferrarimanagement2.vercel.app/login');

  // ✅ Remove the default top menu bar for a clean software look
  win.setMenuBarVisibility(false);
}

// Initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});