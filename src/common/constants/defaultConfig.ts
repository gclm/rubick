export default {
  version: 7,
  perf: {
    custom: {
      theme: 'SPRING',
      primaryColor: '#ff4ea4',
      errorColor: '#ed6d46',
      warningColor: '#e5a84b',
      successColor: '#c0d695',
      infoColor: '#aa8eeB',
      logo: `file://${__static}/logo.png`,
      placeholder: '你好，孤城落寞！请输入插件关键词',
      username: '孤城落寞',
    },
    shortCut: {
      showAndHidden: process.platform === 'darwin' ? 'Command+Space' : 'Alt+R',
      separate: 'Ctrl+D',
      quit: 'Shift+Escape',
      capture: 'Ctrl+Shift+A',
    },
    common: {
      start: true,
      space: true,
      hideOnBlur: true,
      autoPast: false,
      darkMode: false,
      guide: false,
      history: true,
      lang: 'zh-CN',
    },
    local: {
      search: true,
    },
  },
  global: [],
};
