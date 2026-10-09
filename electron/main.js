const { app, BrowserWindow, ipcMain, dialog, protocol, net } = require('electron');
const { pathToFileURL } = require('url');
protocol.registerSchemesAsPrivileged([{ scheme: 'sd-media', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: true } }]);
const fs = require('fs');
const path = require('path');
app.setName('ScreenDraft');
function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 860, title: 'ScreenDraft', icon: path.join(__dirname, '../build/icon.png'), autoHideMenuBar: true, backgroundColor: '#1b1330',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true }
  });
  if (process.env.NODE_ENV === 'development') win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, '../dist/index.html'));
}
ipcMain.handle('save', async (_e, { name, ext, label, data, isText }) => {
  const r = await dialog.showSaveDialog({ defaultPath: name, filters: [{ name: label, extensions: [ext] }] });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, isText ? data : Buffer.from(data));
  return r.filePath;
});
ipcMain.handle('open', async (_e, o) => {
  const r = await dialog.showOpenDialog({ filters: [{ name: (o && o.name) || 'ScreenDraft', extensions: (o && o.exts) || ['screendraft', 'json'] }], properties: ['openFile'] });
  if (r.canceled) return null;
  return fs.readFileSync(r.filePaths[0], 'utf8');
});
ipcMain.handle('pickVideo', async () => {
  const r = await dialog.showOpenDialog({ filters: [{ name: 'Live wallpaper (MP4, WebM, GIF)', extensions: ['mp4', 'webm', 'mov', 'm4v', 'ogv', 'gif'] }], properties: ['openFile'] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('print', (e) => new Promise(res => e.sender.print({ printBackground: false }, ok => res(ok))));
ipcMain.handle('pdf', async (e, name) => {
  const r = await dialog.showSaveDialog({ defaultPath: name, filters: [{ name: 'PDF', extensions: ['pdf'] }] });
  if (r.canceled || !r.filePath) return null;
  const buf = await e.sender.printToPDF({
    preferCSSPageSize: true, printBackground: false, displayHeaderFooter: true,
    headerTemplate: '<div style="width:100%;text-align:right;font:10px Courier New,monospace;padding-right:1in;box-sizing:border-box"><span class="pageNumber"></span>.</div>',
    footerTemplate: '<span></span>'
  });
  fs.writeFileSync(r.filePath, buf);
  return r.filePath;
});
app.whenReady().then(() => {
  protocol.handle('sd-media', (req) => {
    const p = decodeURIComponent(new URL(req.url).pathname.slice(1));
    if (!/\.(mp4|webm|mov|m4v|ogv|gif)$/i.test(p)) return new Response('Not allowed', { status: 403 });
    return net.fetch(pathToFileURL(p).toString(), { headers: req.headers });
  });
  createWindow(); app.on('activate', () => BrowserWindow.getAllWindows().length || createWindow()); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
