<template>
  <div class="developer">
    <!-- 保留原有的开发者页面内容 -->
    
    <!-- 添加 uTools 插件安装部分 -->
    <a-divider>uTools 插件安装</a-divider>
    <div class="upx-installer">
      <a-alert
        message="rubick 插件系统依托于 npm 管理，本地调试需要先在本地插件当前目录执行 npm link"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />
      <a-upload
        accept=".upx"
        :before-upload="handleUploadUpx"
        :show-upload-list="false"
      >
        <a-button type="primary">
          <upload-outlined />
          导入 upx 插件包
        </a-button>
      </a-upload>
      
      <!-- 已安装的 uTools 插件列表 -->
      <a-list
        class="plugin-list"
        :data-source="installedPlugins"
        :loading="loading"
        style="margin-top: 16px"
      >
        <template #header>
          <div>已安装的 uTools 插件</div>
        </template>
        <template #renderItem="{ item }">
          <a-list-item>
            <a-card :title="item.name" style="width: 100%">
              <template #extra>
                <a-space>
                  <a-switch
                    :checked="item.enabled"
                    @change="(checked) => togglePlugin(item.id, checked)"
                  />
                  <a-button
                    type="text"
                    danger
                    @click="uninstallPlugin(item.id)"
                  >
                    卸载
                  </a-button>
                </a-space>
              </template>
              <p>{{ item.description }}</p>
              <p>
                <small>
                  版本: {{ item.version }} | 作者: {{ item.author }}
                  <a
                    v-if="item.homepage"
                    :href="item.homepage"
                    target="_blank"
                  >主页</a>
                </small>
              </p>
            </a-card>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { UploadOutlined } from '@ant-design/icons-vue';

export default defineComponent({
  name: 'Developer',
  components: {
    UploadOutlined
  },
  setup() {
    const loading = ref(false);
    const installedPlugins = ref<any[]>([]);

    // 加载已安装插件列表
    const loadPlugins = async () => {
      loading.value = true;
      try {
        installedPlugins.value = await (window as any).utools.getInstalledPlugins();
      } catch (e) {
        message.error('加载插件列表失败');
      } finally {
        loading.value = false;
      }
    };

    // 处理 upx 插件上传
    const handleUploadUpx = async (file: File) => {
      try {
        const result = await (window as any).rubick.showOpenDialog({
          filters: [{ name: 'uTools Plugin', extensions: ['upx'] }],
          properties: ['openFile']
        });

        if (result.canceled || !result.filePaths.length) return;

        const pluginPath = result.filePaths[0];
        const success = await (window as any).utools.installPlugin(pluginPath);

        if (success) {
          message.success('插件安装成功');
          await loadPlugins();
        } else {
          message.error('插件安装失败');
        }
      } catch (e) {
        message.error('插件安装失败');
      }
      return false;
    };

    // 卸载插件
    const uninstallPlugin = async (pluginId: string) => {
      try {
        const success = await (window as any).utools.uninstallPlugin(pluginId);
        if (success) {
          message.success('插件卸载成功');
          await loadPlugins();
        } else {
          message.error('插件卸载失败');
        }
      } catch (e) {
        message.error('插件卸载失败');
      }
    };

    // 启用/禁用插件
    const togglePlugin = async (pluginId: string, enabled: boolean) => {
      try {
        const success = await (window as any).utools.togglePlugin(pluginId, enabled);
        if (success) {
          message.success(`插件${enabled ? '启用' : '禁用'}成功`);
          await loadPlugins();
        } else {
          message.error(`插件${enabled ? '启用' : '禁用'}失败`);
        }
      } catch (e) {
        message.error(`插件${enabled ? '启用' : '禁用'}失败`);
      }
    };

    onMounted(() => {
      loadPlugins();
    });

    return {
      loading,
      installedPlugins,
      handleUploadUpx,
      uninstallPlugin,
      togglePlugin
    };
  }
});
</script>

<style scoped>
.upx-installer {
  margin-top: 16px;
}

.plugin-list {
  margin-top: 16px;
}
</style> 