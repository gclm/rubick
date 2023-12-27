import {
  AdapterHandlerOptions,
  AdapterInfo,
} from '@/core/plugin-handler/types';
import fs from 'fs-extra';
import path from 'path';
import got from 'got';
import fixPath from 'fix-path';

import { ipcRenderer } from 'electron';
import axios from 'axios';

import npm from 'npm';

fixPath();

/**
 * 系统插件管理器
 * @class AdapterHandler
 */
class AdapterHandler {
  // 插件安装地址
  public baseDir: string;
  // 插件源地址
  readonly registry: string;

  pluginCaches = {};

  /**
   * Creates an instance of AdapterHandler.
   * @param {AdapterHandlerOptions} options
   * @memberof AdapterHandler
   */
  constructor(options: AdapterHandlerOptions) {
    // 初始化插件存放
    if (!fs.existsSync(options.baseDir)) {
      fs.mkdirsSync(options.baseDir);
      fs.writeFileSync(
        `${options.baseDir}/package.json`,
        '{"dependencies":{}}'
      );
    }
    this.baseDir = options.baseDir;

    let register = options.registry || 'https://registry.npmmirror.com/';

    try {
      const dbdata = ipcRenderer.sendSync('msg-trigger', {
        type: 'dbGet',
        data: { id: 'rubick-localhost-config' },
      });
      register = dbdata.data.register;
    } catch (e) {
      // ignore
    }
    this.registry = register || 'https://registry.npmmirror.com/';
  }

  async upgrade(name: string): Promise<void> {
    // 创建一个npm-registry-client实例
    const packageJSON = JSON.parse(
      fs.readFileSync(`${this.baseDir}/package.json`, 'utf-8')
    );
    const registryUrl = `https://registry.npm.taobao.org/${name}`;

    // 从npm源中获取依赖包的最新版本
    try {
      const installedVersion = packageJSON.dependencies[name].replace('^', '');
      let latestVersion = this.pluginCaches[name];
      if (!latestVersion) {
        const { data } = await axios.get(registryUrl, { timeout: 2000 });
        latestVersion = data['dist-tags'].latest;
        this.pluginCaches[name] = latestVersion;
      }
      if (latestVersion > installedVersion) {
        await this.install([name], { isDev: false });
      }
    } catch (e) {
      // ...
    }
  }
  /**
   * 获取插件信息
   * @param {string} adapter 插件名称
   * @param {string} adapterPath 插件指定路径
   * @memberof PluginHandler
   */
  async getAdapterInfo(
    adapter: string,
    adapterPath: string
  ): Promise<AdapterInfo> {
    let adapterInfo: AdapterInfo;
    const infoPath =
      adapterPath ||
      path.resolve(this.baseDir, 'node_modules', adapter, 'plugin.json');
    // 从本地获取
    if (await fs.pathExists(infoPath)) {
      adapterInfo = JSON.parse(
        fs.readFileSync(infoPath, 'utf-8')
      ) as AdapterInfo;
    } else {
      // 本地没有从远程获取
      const resp = await got.get(
        `https://cdn.jsdelivr.net/npm/${adapter}/plugin.json`
      );
      // Todo 校验合法性
      adapterInfo = JSON.parse(resp.body) as AdapterInfo;
    }
    return adapterInfo;
  }

  // 安装并启动插件
  async install(adapters: Array<string>, options: { isDev: boolean }) {
    const installCmd = options.isDev ? 'link' : 'install';
    // 安装
    await this.execCommand(installCmd, adapters);
  }

  async devInstall(adapters: Array<string>, options: { isDev: boolean }) {
    const pluginPath = adapters[0];
    const pluginName = adapters[1];
    await this.copyFolderAsync(
      pluginPath,
      path.resolve(this.baseDir, 'node_modules', pluginName)
    );
  }

  async copyFolderAsync(source: string, target: string) {
    try {
      await fs.mkdir(target, { recursive: true });
      const files = await fs.readdir(source);
      for (const file of files) {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);
        const stat = await fs.stat(sourcePath);
        if (stat.isDirectory()) {
          // 如果是文件夹，递归复制
          await this.copyFolderAsync(sourcePath, targetPath);
        } else {
          // 如果是文件，直接复制
          await fs.copyFile(sourcePath, targetPath);
        }
      }
      console.log('copy success！');
    } catch (error) {
      console.error('copy error:', error);
    }
  }

  /**
   * 更新指定插件
   * @param {...string[]} adapters 插件名称
   * @memberof AdapterHandler
   */
  async update(...adapters: string[]) {
    await this.execCommand('update', adapters);
  }

  /**
   * 卸载指定插件
   * @param {...string[]} adapters 插件名称
   * @param options
   * @memberof AdapterHandler
   */
  async uninstall(adapters: string[], options: { isDev: boolean }) {
    // const installCmd = options.isDev ? 'unlink' : 'uninstall';
    // 卸载插件
    // await this.execCommand(installCmd, adapters);
    if (options.isDev) {
      // 递归删除
      for (const adapter of adapters) {
        await this.deleteFolderRecursive(
          path.resolve(this.baseDir, 'node_modules', adapter)
        );
      }
    } else {
      await this.execCommand('uninstall', adapters);
    }
  }

  async deleteFolderRecursive(folderPath: string) {
    if (fs.existsSync(folderPath)) {
      fs.readdirSync(folderPath).forEach((file) => {
        const curPath = path.join(folderPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          // 递归删除子文件夹
          this.deleteFolderRecursive(curPath);
        } else {
          // 删除文件
          fs.unlinkSync(curPath);
        }
      });
      // 删除空文件夹
      fs.rmdirSync(folderPath);
      console.log(`Folder deleted: ${folderPath}`);
    } else {
      console.log(`Folder not found: ${folderPath}`);
    }
  }

  /**
   * 列出所有已安装插件
   * @memberof AdapterHandler
   */
  async list() {
    const installInfo = JSON.parse(
      await fs.readFile(`${this.baseDir}/package.json`, 'utf-8')
    );
    const adapters: string[] = [];
    for (const adapter in installInfo.dependencies) {
      adapters.push(adapter);
    }
    return adapters;
  }

  /**
   * 运行包管理器
   * @memberof AdapterHandler
   */
  private async execCommand(cmd: string, modules: string[]): Promise<string> {
    return new Promise((resolve: any, reject: any) => {
      const module =
        cmd !== 'uninstall' && cmd !== 'link'
          ? modules.map((m) => `${m}@latest`)
          : modules;
      const config: any = {
        prefix: this.baseDir,
        save: true,
        cache: path.join(this.baseDir, 'cache'),
      };
      if (cmd !== 'link') {
        config.registry = this.registry;
      }
      npm.load(config, function (err) {
        npm.commands[cmd](module, function (er, data) {
          if (!err) {
            console.log(data);
            resolve({ code: -1, data });
          } else {
            reject({ code: -1, data: err });
          }
        });

        npm.on('log', function (message) {
          // log installation progress
          console.log(message);
        });
      });
    });
  }
}

export default AdapterHandler;
