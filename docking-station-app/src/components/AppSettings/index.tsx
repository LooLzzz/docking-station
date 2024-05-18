'use client'

import { useGetMonitorSettings, useUpdateMonitorSettings } from '@/hooks/monitoring'
import { useAppSettingsStore } from '@/store/zustand'
import { Center, Group, Card as MantineCard, NumberInput, RangeSlider, Slider, Stack, Switch, Text, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useEffect, useState } from 'react'

export default function AppSettings() {
  const {
    rollingAverageEnabled,
    rollingAverageWindow,
    toggleRollingAverage,
    setRollingAverageWindow,
  } = useAppSettingsStore()
  const [preDebouncedValue, setPreDebouncedValue] = useState(rollingAverageWindow)
  const [debouncedValue] = useDebouncedValue(preDebouncedValue, 200)
  const { data: settings, isLoading } = useGetMonitorSettings()
  const { mutate } = useUpdateMonitorSettings()

  const [sliderValue, setSliderValue] = useState(0)
  const [[lowValue, highValue], setRangeSliderValue] = useState([0, 0])

  useEffect(() => {
    setRollingAverageWindow(debouncedValue)
  }, [debouncedValue, setRollingAverageWindow])

  useEffect(() => {
    if (settings) {
      setSliderValue(settings.pingIntervalSec)
      setRangeSliderValue([settings.lowThresholdMs, settings.highThresholdMs])
    }
  }, [isLoading, settings])

  return (
    <Center w='100%'>
      <MantineCard withBorder padding='lg' radius='md' miw={500} style={{ justifyContent: 'center' }}>
        <Group>
          <Title size={30}>App Settings</Title>
        </Group>

        <Stack gap={'xl'} py='md'>
          <Group wrap='nowrap' gap='xs'>
            <Group align='baseline' gap={5}>
              <Text size='sm' style={{ whiteSpace: 'nowrap' }}>
                Rolling average
              </Text>
              <Text c='dimmed' size='xs'>
                [seconds]
              </Text>
            </Group>
            <Switch
              checked={rollingAverageEnabled}
              onChange={() => toggleRollingAverage()}
              disabled={isLoading}
            />
            <NumberInput
              size='xs'
              disabled={!rollingAverageEnabled || isLoading}
              w={75}
              min={1}
              max={180}
              value={preDebouncedValue}
              onChange={(value) => setPreDebouncedValue(Number.parseInt(value.toString()))}
            />
          </Group>

          <Group wrap='nowrap' gap='xs'>
            <Text size='sm' style={{ whiteSpace: 'nowrap' }}>
              Ping Interval
            </Text>
            <Slider
              w='100%'
              disabled={isLoading}
              value={isLoading ? 0 : sliderValue}
              min={1}
              max={3600}
              step={0.1}
              label={v => (
                v < 60
                  ? `${v} sec`
                  : v < 3600
                    ? `${(v / 60).toFixed(2)} min`
                    : `${(v / 3600).toFixed(2)} hr`
              )}
              onChange={setSliderValue}
              onChangeEnd={value => {
                mutate({ pingIntervalSec: value })
              }}
            />
          </Group>

          <Group wrap='nowrap' gap='xs'>
            <Text size='sm' style={{ whiteSpace: 'nowrap' }}>
              Latency Threshold
            </Text>
            <RangeSlider
              inverted
              w='100%'
              disabled={isLoading}
              onChange={setRangeSliderValue}
              onChangeEnd={([low, high]) => {
                mutate({
                  lowThresholdMs: low,
                  highThresholdMs: high,
                })
              }}
              min={1}
              max={200}
              label={value => `${value} ms`}
              value={isLoading ? [0, 200] : [lowValue, highValue] as [number, number]}
            />
          </Group>
        </Stack>
      </MantineCard>
    </Center>
  )
}
