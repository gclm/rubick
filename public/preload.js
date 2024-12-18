const { ipcRenderer, shell } = require('electron');
const { BrowserWindow, nativeTheme, screen, app } = require('@electron/remote');
const os = require('os');
const path = require('path');

const appPath = app.getPath('userData');
const baseDir = path.join(appPath, './rubick-plugins-new');

const ipcSendSync = (type, data) => {
  const returnValue = ipcRenderer.sendSync('msg-trigger', {
    type,
    data,
  });
  if (returnValue instanceof Error) throw returnValue;
  return returnValue;
};

const ipcSend = (type, data) => {
  ipcRenderer.send('msg-trigger', {
    type,
    data,
  });
};

window.rubick = {
  hooks: {},
  __event__: {},
  // 事件
  onPluginEnter(cb) {
    typeof cb === 'function' && (window.rubick.hooks.onPluginEnter = cb);
  },
  onPluginReady(cb) {
    typeof cb === 'function' && (window.rubick.hooks.onPluginReady = cb);
  },
  onPluginOut(cb) {
    typeof cb === 'function' && (window.rubick.hooks.onPluginOut = cb);
  },
  openPlugin(plugin) {
    ipcSendSync('loadPlugin', plugin);
  },
  // 窗口交互
  hideMainWindow() {
    ipcSendSync('hideMainWindow');
  },
  showMainWindow() {
    ipcSendSync('showMainWindow');
  },
  showOpenDialog(options) {
    return ipcSendSync('showOpenDialog', options);
  },
  showSaveDialog(options) {
    return ipcSendSync('showSaveDialog', options);
  },
  setExpendHeight(height) {
    ipcSendSync('setExpendHeight', height);
  },
  setSubInput(onChange, placeholder = '', isFocus) {
    typeof onChange === 'function' &&
      (window.rubick.hooks.onSubInputChange = onChange);
    ipcSendSync('setSubInput', {
      placeholder,
      isFocus,
    });
  },
  removeSubInput() {
    delete window.rubick.hooks.onSubInputChange;
    ipcSendSync('removeSubInput');
  },
  setSubInputValue(text) {
    ipcSendSync('setSubInputValue', { text });
  },
  subInputBlur() {
    ipcSendSync('subInputBlur');
  },
  getPath(name) {
    return ipcSendSync('getPath', { name });
  },
  showNotification(body, clickFeatureCode) {
    ipcSend('showNotification', { body, clickFeatureCode });
  },
  copyImage(img) {
    return ipcSendSync('copyImage', { img });
  },
  copyText(text) {
    return ipcSendSync('copyText', { text });
  },
  copyFile: (file) => {
    return ipcSendSync('copyFile', { file });
  },
  db: {
    put: (data) => ipcSendSync('dbPut', { data }),
    get: (id) => ipcSendSync('dbGet', { id }),
    remove: (doc) => ipcSendSync('dbRemove', { doc }),
    bulkDocs: (docs) => ipcSendSync('dbBulkDocs', { docs }),
    allDocs: (key) => ipcSendSync('dbAllDocs', { key }),
    postAttachment: (docId, attachment, type) =>
      ipcSendSync('dbPostAttachment', { docId, attachment, type }),
    getAttachment: (docId) => ipcSendSync('dbGetAttachment', { docId }),
    getAttachmentType: (docId) => ipcSendSync('dbGetAttachmentType', { docId })
  },
  dbStorage: {
    setItem: (key, value) => {
      const target = { _id: String(key) };
      const result = ipcSendSync('dbGet', { id: target._id });
      result && (target._rev = result._rev);
      target.value = value;
      const res = ipcSendSync('dbPut', { data: target });
      if (res.error) throw new Error(res.message);
    },
    getItem: (key) => {
      const res = ipcSendSync('dbGet', { id: key });
      return res && 'value' in res ? res.value : null;
    },
    removeItem: (key) => {
      const res = ipcSendSync('dbGet', { id: key });
      res && ipcSendSync('dbRemove', { doc: res });
    },
  },
  isDarkColors() {
    return nativeTheme.shouldUseDarkColors;
  },
  getFeatures() {
    return ipcSendSync('getFeatures');
  },
  setFeature(feature) {
    return ipcSendSync('setFeature', { feature });
  },
  removeFeature(code) {
    return ipcSendSync('removeFeature', { code });
  },
  shellOpenExternal(url) {
    shell.openExternal(url);
  },
  isMacOs() {
    return process.platform === 'darwin';
  },
  isWindows() {
    return process.platform === 'win32';
  },
  isLinux() {
    return process.platform === 'linux';
  },
  shellOpenPath(path) {
    shell.openPath(path);
  },
  getLocalId: () => ipcSendSync('getLocalId'),
  removePlugin() {
    ipcSend('removePlugin');
  },
  shellShowItemInFolder: (path) => {
    ipcSend('shellShowItemInFolder', { path });
  },
  redirect: (label, payload) => {
    // todo
  },
  shellBeep: () => {
    ipcSend('shellBeep');
  },
  getFileIcon: (path) => {
    return ipcSendSync('getFileIcon', { path });
  },
  getCopyedFiles: () => {
    return ipcSendSync('getCopyFiles');
  },
  simulateKeyboardTap: (key, ...modifier) => {
    ipcSend('simulateKeyboardTap', { key, modifier });
  },
  getCursorScreenPoint: () => {
    return screen.getCursorScreenPoint();
  },
  getDisplayNearestPoint: (point) => {
    return screen.getDisplayNearestPoint(point);
  },
  outPlugin: () => {
    return ipcSend('removePlugin');
  },
  createBrowserWindow: (url, options, callback) => {
    const winUrl = path.resolve(baseDir, 'node_modules', options.name);
    const winIndex = `file://${path.join(winUrl, './', url || '')}`;
    const preloadPath = path.join(
      winUrl,
      './',
      options.webPreferences.preload || ''
    );
    let win = new BrowserWindow({
      useContentSize: true,
      resizable: true,
      title: 'Rubick',
      show: false,
      backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c28' : '#fff',
      ...options,
      webPreferences: {
        webSecurity: false,
        backgroundThrottling: false,
        contextIsolation: false,
        webviewTag: true,
        nodeIntegration: true,
        spellcheck: false,
        partition: null,
        ...(options.webPreferences || {}),
        preload: preloadPath,
      },
    });
    win.loadURL(winIndex);

    win.on('closed', () => {
      win = undefined;
    });
    win.once('ready-to-show', () => {
      win.show();
    });
    win.webContents.on('dom-ready', () => {
      callback && callback();
    });
    return win;
  },
  changeTheme: () => {
    const isDark = nativeTheme.shouldUseDarkColors;
    window.rubick.theme = isDark ? 'dark' : 'light';
  },
  theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
};

// 添加 uTools 兼容层
if (window.rubick && window.rubick.db) {
  const { UToolsAPI } = require('../src/utils/utools');
  const { DbWrapper } = require('../src/utils/db');
  
  try {
    const dbWrapper = new DbWrapper(window.rubick.db);
    window.utools = new UToolsAPI(window.rubick, dbWrapper);
  } catch (e) {
    console.error('Failed to initialize uTools API:', e);
  }
}

// 添加全局的未处理 Promise 异常处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});
