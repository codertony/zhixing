import type { ThemeConfig } from 'antd'

/**
 * 知行平台 Ant Design 主题配置
 */
export const theme: ThemeConfig = {
  token: {
    // 主色调 - 科技蓝
    colorPrimary: '#1677ff',
    colorPrimaryHover: '#4096ff',
    colorPrimaryActive: '#0958d9',

    // 圆角
    borderRadius: 6,

    // 字体
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

    // 间距
    paddingXS: 8,
    paddingSM: 12,
    padding: 16,
    paddingMD: 20,
    paddingLG: 24,

    // 阴影
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 4px 16px rgba(0, 0, 0, 0.12)',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 64,
      headerPadding: '0 24px',
    },
    Menu: {
      itemBorderRadius: 4,
      itemMarginInline: 4,
    },
    Card: {
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
    Button: {
      borderRadius: 6,
    },
    Table: {
      borderRadius: 8,
      headerBg: '#f5f5f5',
    },
    Modal: {
      borderRadius: 8,
    },
    Tag: {
      borderRadius: 4,
    },
  },
}
