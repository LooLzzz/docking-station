import { ColorSwatch } from '@mantine/core'

interface TrafficLightIconProps {
  value: number
  thresholds: {
    high: number
    low: number
  }
  colors?: {
    red: string
    orange: string
    green: string
  }
}

export default function TrafficLightIcon({
  value,
  thresholds,
  colors = {
    red: '#c60000',
    orange: '#df8c36',
    green: '#1cc95a',
  },
}: TrafficLightIconProps) {
  const activeThresholdColor = (
    value < 0
      ? 'gray'
      : value > thresholds.high
        ? colors.red
        : value > thresholds.low
          ? colors.orange
          : colors.green
  )

  return (
    <ColorSwatch
      color={activeThresholdColor}
      size={20}
      radius='xl'
    />
  )
}
