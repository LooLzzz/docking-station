import {
  Tooltip,
  type MantineThemeOverride,
} from '@mantine/core'


export const themeOverride: MantineThemeOverride = {
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
