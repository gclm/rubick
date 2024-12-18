import type { UToolsAPI } from '../utils/utools';

// 完整的类型定义
interface RubickAPI {
  hooks: Record<string, Function>;
  __event__: Record<string, any>;
  
  // 事件相关
  onPluginEnter(cb: Function): void;
  onPluginReady(cb: Function): void;
  onPluginOut(cb: Function): void;
  openPlugin(plugin: any): void;

  // 窗口交互
  hideMainWindow(): void;
  showMainWindow(): void;
  showOpenDialog(options: {
    filters?: Array<{ name: string; extensions: string[] }>;
    properties?: Array<string>;
  }): Promise<{ canceled: boolean; filePaths: string[] }>;
  showSaveDialog(options: any): Promise<any>;
  setExpendHeight(height: number): void;
  setSubInput(onChange: Function, placeholder?: string, isFocus?: boolean): void;
  removeSubInput(): void;
  setSubInputValue(text: string): void;
  subInputBlur(): void;

  // 系统功能
  getPath(name: string): string;
  showNotification(body: string, clickFeatureCode?: string): void;
  copyImage(img: string | Buffer): boolean;
  copyText(text: string): boolean;
  copyFile(file: string): boolean;

  // 数据库
  db: {
    put(data: any): Promise<any>;
    get(id: string): Promise<any>;
    remove(doc: any): Promise<any>;
    bulkDocs(docs: any[]): Promise<any>;
    allDocs(key?: string): Promise<any>;
    postAttachment(docId: string, attachment: Buffer | Uint8Array, type: string): Promise<any>;
    getAttachment(docId: string): Promise<any>;
    getAttachmentType(docId: string): Promise<any>;
  };

  dbStorage: {
    setItem(key: string, value: any): void;
    getItem(key: string): any;
    removeItem(key: string): void;
  };

  // 主题相关
  isDarkColors(): boolean;
  changeTheme(): void;
  theme: 'dark' | 'light';

  // 特性相关
  getFeatures(): any[];
  setFeature(feature: any): void;
  removeFeature(code: string): void;

  // 系统判断
  isMacOs(): boolean;
  isWindows(): boolean;
  isLinux(): boolean;

  // 文件系统
  shellOpenPath(path: string): void;
  shellShowItemInFolder(path: string): void;
  shellOpenExternal(url: string): void;
  shellBeep(): void;
  getFileIcon(path: string): string;
  getCopyedFiles(): string[];

  // 其他功能
  getLocalId(): string;
  removePlugin(): void;
  outPlugin(): void;
  redirect(label: string, payload: any): void;
  simulateKeyboardTap(key: string, ...modifier: string[]): void;
  getCursorScreenPoint(): { x: number; y: number };
  getDisplayNearestPoint(point: { x: number; y: number }): any;
  createBrowserWindow(url: string, options: any, callback?: () => void): any;
}

interface UToolsPluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  enabled: boolean;
}

interface UToolsAPI {
  // 插件管理
  installPlugin(pluginPath: string): Promise<boolean>;
  uninstallPlugin(pluginId: string): Promise<boolean>;
  togglePlugin(pluginId: string, enabled: boolean): Promise<boolean>;
  getInstalledPlugins(): Promise<UToolsPluginInfo[]>;

  // 数据库操作
  db: {
    put(doc: any): Promise<any>;
    get(id: string): Promise<any>;
    remove(doc: any): Promise<any>;
    bulkDocs(docs: any[]): Promise<any>;
    allDocs(options?: any): Promise<any>;
    postAttachment(docId: string, attachment: Buffer | Uint8Array, type: string): Promise<any>;
    getAttachment(docId: string): Promise<any>;
    getAttachmentType(docId: string): Promise<any>;
    promises: {
      put(doc: any): Promise<any>;
      get(id: string): Promise<any>;
      remove(doc: any): Promise<any>;
      bulkDocs(docs: any[]): Promise<any>;
      allDocs(options?: any): Promise<any>;
      postAttachment(docId: string, attachment: Buffer | Uint8Array, type: string): Promise<any>;
      getAttachment(docId: string): Promise<any>;
      getAttachmentType(docId: string): Promise<any>;
    };
  };

  dbStorage: {
    setItem(key: string, value: any): void;
    getItem(key: string): any;
    removeItem(key: string): void;
  };

  // 系统功能
  copyText(text: string): boolean;
  copyImage(img: string | Buffer): boolean;
  copyFile(file: string): boolean;
  shellBeep(): void;
  shellOpenPath(path: string): void;
  shellShowItemInFolder(path: string): void;
  shellOpenExternal(url: string): void;

  // 系统判断
  isMacOS(): boolean;
  isWindows(): boolean;
  isLinux(): boolean;
  isDarkColors(): boolean;

  // 其他功能
  getPath(name: string): string;
  getFeatures(): any[];
  setFeature(feature: any): void;
  removeFeature(code: string): void;
  redirect(label: string, payload: any): void;
}

declare global {
  interface Window {
    rubick: RubickAPI;
    utools: UToolsAPI;
  }
}

export {}; 