import { ipcRenderer } from 'electron';
import { DbWrapper } from './db';
import platform from './system';
import path from 'path';
import fs from 'fs';

export class UToolsAPI {
  private readonly dbWrapper: DbWrapper;
  private readonly dbStorage: {
    setItem: (key: string, value: any) => void;
    getItem: (key: string) => any;
    removeItem: (key: string) => void;
  };
  public readonly db: DbWrapper;

  constructor(private readonly rubick: any, dbWrapper: DbWrapper) {
    if (!rubick || !dbWrapper) {
      throw new Error('Invalid initialization parameters');
    }

    this.dbWrapper = dbWrapper;
    this.db = this.dbWrapper;
    
    this.dbStorage = {
      setItem: (key: string, value: any) => this.rubick.dbStorage.setItem(key, value),
      getItem: (key: string) => this.rubick.dbStorage.getItem(key),
      removeItem: (key: string) => this.rubick.dbStorage.removeItem(key)
    };
  }

  // uTools 特有 API
  // 复制相关
  copyText(text: string) {
    return this.rubick.copyText(text);
  }

  copyImage(img: string | Buffer) {
    return this.rubick.copyImage(img);
  }

  copyFile(file: string) {
    return this.rubick.copyFile(file);
  }

  // 系统通知
  showNotification(body: string, clickFeatureCode?: string) {
    return this.rubick.showNotification(body, clickFeatureCode);
  }

  // 系统提示音
  beep() {
    return this.rubick.shellBeep();
  }

  // 插件间跳转
  redirect(label: string, payload: any) {
    return this.rubick.redirect(label, payload);
  }

  // 获取本地ID
  getLocalId() {
    return this.rubick.getLocalId();
  }

  // 创建新窗口
  createBrowserWindow(url: string, options: any, callback?: () => void) {
    return this.rubick.createBrowserWindow(url, options, callback);
  }

  // 已有的 API 保持不变
  onPluginEnter(callback: Function) {
    this.rubick.onPluginEnter(callback);
  }

  onPluginReady(callback: Function) {
    this.rubick.onPluginReady(callback);
  }

  onPluginOut(callback: Function) {
    this.rubick.onPluginOut(callback);
  }

  hideMainWindow() {
    return this.rubick.hideMainWindow();
  }

  showMainWindow() {
    return this.rubick.showMainWindow();
  }

  setExpendHeight(height: number) {
    return this.rubick.setExpendHeight(height);
  }

  setSubInput(callback: Function, placeholder?: string, isFocus = true) {
    return this.rubick.setSubInput(callback, placeholder, isFocus);
  }

  removeSubInput() {
    return this.rubick.removeSubInput();
  }

  shellOpenPath(path: string) {
    return this.rubick.shellOpenPath(path);
  }

  shellShowItemInFolder(path: string) {
    return this.rubick.shellShowItemInFolder(path);
  }

  shellOpenExternal(url: string) {
    return this.rubick.shellOpenExternal(url);
  }

  isMacOS() {
    return platform.macOS();
  }

  isWindows() {
    return platform.windows();
  }

  isLinux() {
    return platform.linux();
  }

  isDarkColors() {
    return this.rubick.isDarkColors();
  }

  getPath(name: string) {
    return this.rubick.getPath(name);
  }

  getFeatures() {
    return this.rubick.getFeatures();
  }

  setFeature(feature: any) {
    return this.rubick.setFeature(feature);
  }

  removeFeature(code: string) {
    return this.rubick.removeFeature(code);
  }

  // 插件加载相关方法
  async installPlugin(pluginPath: string): Promise<boolean> {
    try {
      // 验证插件包是否存在
      if (!fs.existsSync(pluginPath)) {
        throw new Error('Plugin file not found');
      }

      // 读取插件配置
      const pluginConfig = await this.readPluginConfig(pluginPath);
      if (!pluginConfig) {
        throw new Error('Invalid plugin package');
      }

      // 安装插件
      return await this.rubick.installPlugin({
        path: pluginPath,
        config: pluginConfig
      });
    } catch (e) {
      console.error('Failed to install plugin:', e);
      return false;
    }
  }

  private async readPluginConfig(pluginPath: string): Promise<any> {
    try {
      // 解析插件包
      const pluginDir = path.dirname(pluginPath);
      const pluginName = path.basename(pluginPath, '.upx');
      
      // 读取 plugin.json
      const configPath = path.join(pluginDir, pluginName, 'plugin.json');
      if (!fs.existsSync(configPath)) {
        throw new Error('plugin.json not found');
      }

      const configContent = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (e) {
      console.error('Failed to read plugin config:', e);
      return null;
    }
  }

  // 获取已安装的插件列表
  getInstalledPlugins(): Promise<any[]> {
    return this.rubick.getInstalledPlugins();
  }

  // 卸载插件
  async uninstallPlugin(pluginId: string): Promise<boolean> {
    try {
      return await this.rubick.uninstallPlugin(pluginId);
    } catch (e) {
      console.error('Failed to uninstall plugin:', e);
      return false;
    }
  }

  // 启用/禁用插件
  async togglePlugin(pluginId: string, enabled: boolean): Promise<boolean> {
    try {
      return await this.rubick.togglePlugin(pluginId, enabled);
    } catch (e) {
      console.error('Failed to toggle plugin:', e);
      return false;
    }
  }
} 