<template>
  <div class="utools-container">
    <div class="view-header">
      <h1 class="title">{{ $t('feature.utools.title') }}</h1>
    </div>

    <div class="content-wrapper">
      <!-- 上传区域 -->
      <div class="upload-section">
        <a-upload-dragger
          :beforeUpload="handleUpload"
          :showUploadList="false"
          accept=".upx"
          :multiple="false"
          @click="handleClick"
        >
          <div class="upload-content">
            <div class="upload-icon">
              <InboxOutlined />
            </div>
            <div class="upload-text">
              <p class="primary-text">{{ $t('feature.utools.plugin.dragTip') }}</p>
              <p class="secondary-text">支持 .upx 格式的插件文件</p>
            </div>
          </div>
        </a-upload-dragger>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { InboxOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 修改文件选择处理方法
const handleClick = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.upx';
  input.style.display = 'none';
  
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      await handleUpload(file);
    }
    document.body.removeChild(input);
  };
  
  document.body.appendChild(input);
  input.click();
};

// 修改上传处理方法
const handleUpload = async (file: File) => {
  try {
    if (!file.name.endsWith('.upx')) {
      message.error('只支持 .upx 格式的插件文件');
      return false;
    }

    // 使用 FileReader 读取文件内容
    const reader = new FileReader();
    const buffer = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });

    // 添加日志
    console.log('Sending file to main process...');
    
    // 使用 market.ipcSendSync 发送文件内容
    const response = window.market?.ipcSendSync('msg-trigger', {
      type: 'convertUpx',
      data: { buffer }
    });
    
    console.log('Response:', response);
    
    if (response?.success) {
      message.success(t('feature.utools.plugin.importSuccess'));
    } else {
      throw new Error(response?.error || '导入失败');
    }
  } catch (err) {
    console.error('Upload error:', err);
    message.error(err.message || t('feature.utools.plugin.importError'));
  }
  return false;
};
</script>

<style lang="less" scoped>
.utools-container {
  padding: 24px;
  height: 100%;
  background: var(--color-body-bg2);

  .view-header {
    margin-bottom: 24px;
    
    .title {
      font-size: 24px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0;
    }
  }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .upload-section {
    background: var(--color-body-bg);
    border-radius: 12px;
    padding: 24px;

    :deep(.ant-upload-drag) {
      background: var(--color-body-bg2);
      border: 2px dashed var(--color-border-light);
      border-radius: 8px;
      padding: 32px;
      cursor: pointer;
      
      &:hover {
        border-color: var(--ant-primary-color);
      }
    }

    .upload-content {
      text-align: center;

      .upload-icon {
        font-size: 48px;
        color: var(--ant-primary-color);
        margin-bottom: 16px;
      }

      .upload-text {
        .primary-text {
          font-size: 16px;
          color: var(--color-text-primary);
          margin-bottom: 8px;
        }

        .secondary-text {
          font-size: 14px;
          color: var(--color-text-desc);
        }
      }
    }
  }
}
</style> 