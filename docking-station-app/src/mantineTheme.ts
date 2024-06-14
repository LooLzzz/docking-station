import {
  Tooltip,
  type MantineThemeOverride,
} from '@mantine/core'


export const themeOverride: MantineThemeOverride = {
  breakpoints: {
    xxs: '15em',
    md: '66em',
    xxl: '120em',
    xxxl: '150em',
  },

  components: {
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
