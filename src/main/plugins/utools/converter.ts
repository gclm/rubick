import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import compressing from 'compressing';
import asar from '@electron/asar';
import { tmpdir } from 'os';

interface PluginConfig {
  name: string;
  version: string;
  description: string;
  author: string;
  logo: string;
  preload: string;
  features: Array<{
    code: string;
    explain: string;
    cmds: string[];
  }>;
  type: string;
  convertTime: string;
}

class UtoolsConverter {
  private pluginsDir: string;
  private tempDir: string;

  constructor(userDataPath: string) {
    this.pluginsDir = path.join(userDataPath, 'plugins');
    this.tempDir = path.join(tmpdir(), 'rubick-temp');
    fs.ensureDirSync(this.tempDir);
  }

  private async extractUpx(buffer: Buffer): Promise<string> {
    const tempFile = path.join(this.tempDir, `temp-${Date.now()}.upx`);
    const extractDir = tempFile.replace('.upx', '');
    
    try {
      await fs.writeFile(tempFile, buffer);
      await compressing.gzip.uncompress(tempFile, extractDir + '.asar');
      await asar.extractAll(extractDir + '.asar', extractDir);
      
      await fs.remove(tempFile);
      await fs.remove(extractDir + '.asar');
      
      return extractDir;
    } catch (error) {
      await fs.remove(tempFile).catch(() => {});
      await fs.remove(extractDir + '.asar').catch(() => {});
      await fs.remove(extractDir).catch(() => {});
      throw error;
    }
  }

  private async readPluginFiles(extractDir: string): Promise<Record<string, Buffer>> {
    const files: Record<string, Buffer> = {};
    const entries = await fs.readdir(extractDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(extractDir, entry.name);
      if (entry.isFile()) {
        files[entry.name] = await fs.readFile(fullPath);
      }
    }
    
    return files;
  }

  private async convertConfig(upxConfig: any): Promise<PluginConfig> {
    return {
      name: upxConfig.name,
      version: upxConfig.version,
      description: upxConfig.description,
      author: upxConfig.author || 'Unknown',
      logo: upxConfig.logo,
      preload: 'preload.js',
      features: upxConfig.features.map(feature => ({
        code: feature.code,
        explain: feature.explain,
        cmds: feature.cmds || []
      })),
      type: 'utools',
      convertTime: new Date().toISOString()
    };
  }

  private async savePlugin(pluginName: string, config: PluginConfig, files: Record<string, Buffer>): Promise<void> {
    const pluginDir = path.join(this.pluginsDir, 'node_modules', pluginName);
    
    await fs.ensureDir(pluginDir);
    await fs.writeJSON(path.join(pluginDir, 'package.json'), config, { spaces: 2 });

    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(path.join(pluginDir, filename), content);
    }
  }

  public registerIPC(): void {
    ipcMain.on('utools:convert', async (event, buffer: Buffer) => {
      let extractDir = '';
      try {
        extractDir = await this.extractUpx(buffer);
        const files = await this.readPluginFiles(extractDir);
        const config = JSON.parse(files['plugin.json'].toString());
        const rubickConfig = await this.convertConfig(config);
        await this.savePlugin(rubickConfig.name, rubickConfig, files);
        event.returnValue = { success: true, data: rubickConfig };
      } catch (error) {
        event.returnValue = { success: false, error: error.message };
      } finally {
        if (extractDir) {
          await fs.remove(extractDir).catch(() => {});
        }
      }
    });

    ipcMain.on('utools:loadPlugins', async (event) => {
      try {
        const pluginsPath = path.join(this.pluginsDir, 'node_modules');
        const entries = await fs.readdir(pluginsPath, { withFileTypes: true });
        const plugins = [];
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const configPath = path.join(pluginsPath, entry.name, 'package.json');
            if (await fs.pathExists(configPath)) {
              const config = await fs.readJSON(configPath);
              if (config.type === 'utools') {
                plugins.push(config);
              }
            }
          }
        }
        
        event.returnValue = { success: true, data: plugins };
      } catch (error) {
        event.returnValue = { success: false, error: error.message };
      }
    });

    ipcMain.on('utools:removePlugin', async (event, pluginName: string) => {
      try {
        const pluginDir = path.join(this.pluginsDir, 'node_modules', pluginName);
        await fs.remove(pluginDir);
        event.returnValue = { success: true };
      } catch (error) {
        event.returnValue = { success: false, error: error.message };
      }
    });
  }
}

export default UtoolsConverter; 