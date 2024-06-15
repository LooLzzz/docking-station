import {
  Paper,
  Tooltip,
  type MantineColorsTuple,
  type MantineThemeOverride,
} from '@mantine/core'

const bluegray: MantineColorsTuple = [
  "#f3f3fe",
  "#e4e6ed",
  "#c8cad3",
  "#a9adb9",
  "#9093a4",
  "#808496",
  "#767c91",
  "#656a7e",
  "#585e72",
  "#4a5167"
]
const brightblue: MantineColorsTuple = [
  "#e5f4ff",
  "#cde2ff",
  "#9bc2ff",
  "#64a0ff",
  "#3984fe",
  "#1d72fe",
  "#0969ff",
  "#0058e4",
  "#004ecc",
  "#0043b5"
]
const paleblue: MantineColorsTuple = [
  "#eef3ff",
  "#dce4f5",
  "#b9c7e2",
  "#94a8d0",
  "#748dc1",
  "#5f7cb8",
  "#5474b4",
  "#44639f",
  "#39588f",
  "#2d4b81"
]
const paleviolet: MantineColorsTuple = [
  '#f6eeff',
  '#e7daf7',
  '#cab1ea',
  '#ad86dd',
  '#9562d2',
  '#854bcb',
  '#7d3ec9',
  '#6b31b2',
  '#5f2aa0',
  '#52228d'
]

export const themeOverride: MantineThemeOverride = {
  primaryColor: 'blue',
  // white: '#f0f0f0',
  colors: {
    bluegray,
    brightblue,
    paleblue,
    paleviolet,
  },

  breakpoints: {
    xxs: '15em',
    md: '66em',
    xxl: '120em',
    xxxl: '150em',
  },

  components: {
    Paper: Paper.extend({
      defaultProps: {
        bg: ''
      },
    }),

    Tooltip: Tooltip.extend({
      defaultProps: {
        events: {
          hover: true,
          focus: false,
          touch: true,
        }
      }
    }),
  },
}
