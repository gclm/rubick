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
    postAttachment: (docId, attachment, type) => ipcSendSync('dbPostAttachment', { docId, attachment, type }),
    getAttachment: (docId) => ipcSendSync('dbGetAttachment', { docId }),
    getAttachmentType: (docId) => ipcSendSync('dbGetAttachmentType', { docId }),
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
    return false;
  },
  getFeatures() {
    return ipcSendSync('getFeatures');
  },
  setFeature(feature) {
    return ipcSendSync('setFeature', { feature });
  },
  screenCapture(cb) {
    typeof cb === 'function' &&
      (window.rubick.hooks.onScreenCapture = ({ data }) => {
        cb(data);
      });
    ipcSendSync('screenCapture');
  },
  removeFeature(code) {
    return ipcSendSync('removeFeature', { code });
  },

  // 系统
  shellOpenExternal(url) {
    shell.openExternal(url);
  },

  isMacOs() {
    return os.type() === 'Darwin';
  },

  isWindows() {
    return os.type() === 'Windows_NT';
  },

  isLinux() {
    return os.type() === 'Linux';
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
      title: '拉比克',
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

  // 添加 utools 相关方法
  utools: {
    // 转换插件
    convertPlugin: async (buffer) => {
      return ipcSendSync('utools:convert', buffer);
    },
    
    // 加载插件列表
    loadPlugins: () => {
      return ipcSendSync('utools:loadPlugins');
    },
    
    // 移除插件
    removePlugin: (pluginName) => {
      return ipcSendSync('utools:removePlugin', pluginName);
    }
  }
};

// uTools API 兼容层
window.utools = {
  hooks: {},
  __event__: {},
  // 数据库 API - 直接使用 rubick 的 dbStorage
  db: {
    put: (doc) => window.rubick.dbStorage.setItem(doc._id, doc),
    get: (id) => window.rubick.dbStorage.getItem(id),
    remove: (doc) => window.rubick.dbStorage.removeItem(typeof doc === 'string' ? doc : doc._id),
    bulkDocs: (docs) => docs.map(doc => window.rubick.dbStorage.setItem(doc._id, doc)),
    allDocs: (key) => window.rubick.db.allDocs(key),
    postAttachment: (docId, attachment, type) => ipcSendSync('dbPostAttachment', { docId, attachment, type }),
    getAttachment: (docId) => ipcSendSync('dbGetAttachment', { docId }),
    getAttachmentType: (docId) => ipcSendSync('dbGetAttachmentType', { docId }),
  },

  // 剪贴板 - 直接使用 rubick 的剪贴板方法
  copyText: window.rubick.copyText,
  copyImage: window.rubick.copyImage,
  copyFile: window.rubick.copyFile,
  getCopyedFiles: window.rubick.getCopyedFiles,

  // 系统 - 直接使用 rubick 的系统方法
  showNotification: window.rubick.showNotification,
  shellBeep: window.rubick.shellBeep,
  shellOpenPath: window.rubick.shellOpenPath,
  shellShowItemInFolder: window.rubick.shellShowItemInFolder,
  shellOpenExternal: window.rubick.shellOpenExternal,

  // 口 - 直接使用 rubick 的窗口方法
  hideMainWindow: window.rubick.hideMainWindow,
  showMainWindow: window.rubick.showMainWindow,
  setExpendHeight: window.rubick.setExpendHeight,
  setSubInput: window.rubick.setSubInput,
  removeSubInput: window.rubick.removeSubInput,
  setSubInputValue: window.rubick.setSubInputValue,

  // 对话框 - 直接使用 rubick 的对话框方法
  showOpenDialog: window.rubick.showOpenDialog,
  showSaveDialog: window.rubick.showSaveDialog,

  // 屏幕 - 直接使用 rubick 的屏幕方法
  getCursorScreenPoint: window.rubick.getCursorScreenPoint,
  getDisplayNearestPoint: window.rubick.getDisplayNearestPoint,
  screenCapture: window.rubick.screenCapture,

  // 键盘 - 直接使用 rubick 的键盘方法
  simulateKeyboardTap: window.rubick.simulateKeyboardTap,

  // 系统信息 - 直接使用 rubick 的系统信息方法
  isDarkColors: window.rubick.isDarkColors,
  isMacOs: window.rubick.isMacOs,
  isWindows: window.rubick.isWindows,
  isLinux: window.rubick.isLinux,

  // 插件 - 直接使用 rubick 的插件方法
  getFeatures: window.rubick.getFeatures,
  setFeature: window.rubick.setFeature,
  removeFeature: window.rubick.removeFeature,
  
  // 事件 - 直接使用 rubick 的事件方法
  onPluginEnter: window.rubick.onPluginEnter,
  onPluginReady: window.rubick.onPluginReady,
  onPluginOut: window.rubick.onPluginOut,

  // 其他方法
  redirect: window.rubick.redirect,
  outPlugin: window.rubick.outPlugin,
  createBrowserWindow: window.rubick.createBrowserWindow,
  getPath: window.rubick.getPath,
  getFileIcon: window.rubick.getFileIcon,
  getLocalId: window.rubick.getLocalId
};

