'use client'

import { EditableText } from '@/components'
import { useDeleteMonitoredWebsite, useGetLatestWebsiteHistory, useGetMonitorSettings, useUpdateMonitoredWebsite } from '@/hooks/monitoring'
import { useAppSettingsStore } from '@/store/zustand'
import type { MonitorSettings, MonitoredWebsite } from '@/types'
import { ActionIcon, Group, LoadingOverlay, Card as MantineCard, Overlay, Progress, Stack, Switch, Text, Tooltip } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconCalendar, IconInfoCircle, IconPlayerPlayFilled, IconPlayerStopFilled, IconTrash, IconUpload } from '@tabler/icons-react'
import { useCallback, useEffect } from 'react'
import TrafficLightIcon from './TrafficLightIcon'

interface CardProps {
  miw?: string
  mih?: string
  website: MonitoredWebsite
  className?: string
  colors?: {
    red: string
    orange: string
    green: string
  }
}

export default function Card({
  miw,
  mih,
  className,
  website: {
    isActive,
    friendlyName,
    id: websiteId,
    url,
  },
  colors = {
    red: '#c60000',
    orange: '#df8c36',
    green: '#1cc95a',
  },
}: CardProps) {
  const { rollingAverageEnabled, rollingAverageWindow } = useAppSettingsStore()
  const { mutate: mutateUpdate } = useUpdateMonitoredWebsite()
  const { mutate: mutateDelete } = useDeleteMonitoredWebsite()
  const { data: settings } = useGetMonitorSettings() as { data: MonitorSettings }

  const { data: { latencyMs, createdAt } = {}, isLoading, refetch } = useGetLatestWebsiteHistory(
    websiteId,
    {
      enabled: isActive,
      refetchInterval: settings.pingIntervalSec * 1000, // ms
      rollingAverageOptions: {
        enabled: rollingAverageEnabled,
        window: rollingAverageWindow,
      },
    }
  )

  const openDeleteModal = () =>
    modals.openConfirmModal({
      title: 'Delete website?',
      centered: true,
      children: (
        <Text size='sm'>
          Are you sure you want to delete this website and all its history?
        </Text>
      ),
      labels: { confirm: 'Yeet', cancel: 'Nop' },
      confirmProps: { color: 'red' },
      onConfirm: () => mutateDelete(websiteId),
    })

  const handleSwitchChange = useCallback(() => {
    mutateUpdate({ id: websiteId, isActive: !isActive })
  }, [mutateUpdate, websiteId, isActive])

  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <MantineCard
        withBorder
        miw={miw}
        mih={mih}
        padding='lg'
        radius='md'
        className={className}
      >
        <Stack gap={5}>
          <Group justify='space-between'>
            <Group gap='xs'>
              <Group gap={3}>
                <Tooltip withArrow label={url}>
                  <IconInfoCircle
                    cursor='help'
                    size={15}
                    color='gray'
                  />
                </Tooltip>
                <EditableText
                  initialValue={friendlyName}
                  onSave={(newName) => mutateUpdate({ id: websiteId, friendlyName: newName })}
                />
              </Group>
              <TrafficLightIcon
                colors={colors}
                value={latencyMs ?? -1}
                thresholds={{
                  high: settings.highThresholdMs,
                  low: settings.lowThresholdMs,
                }}
              />
            </Group>

            <Group gap={2.5} style={{ zIndex: 201 }}>
              <Switch
                checked={isActive}
                size='md'
                onChange={handleSwitchChange}
                disabled={isActive && (isLoading || !latencyMs || !createdAt)}
                onLabel={<IconPlayerPlayFilled size={15} />}
                offLabel={<IconPlayerStopFilled size={15} />}
              />
              <ActionIcon
                color='gray'
                variant='transparent'
                onClick={openDeleteModal}
              >
                <IconTrash
                  size={20}
                  stroke={2.5}
                />
              </ActionIcon>
            </Group>
          </Group>

          <Progress.Root mt={4}>
            <Tooltip withArrow label={latencyMs ? `${rollingAverageEnabled ? 'Average ' : ''}Latency: ${latencyMs} ms` : ''}>
              <Progress.Section
                value={(100 * (latencyMs ?? 0) + settings.lowThresholdMs) / settings.highThresholdMs}
                color={
                  latencyMs
                    ? latencyMs > settings.highThresholdMs
                      ? colors.red
                      : latencyMs > settings.lowThresholdMs
                        ? colors.orange
                        : colors.green
                    : 'gray'
                }
              />
            </Tooltip>
          </Progress.Root>

          <Group>
            <Tooltip withArrow label={`${rollingAverageEnabled ? 'Average ' : ''}Latency`}>
              <IconUpload
                color='gray'
                size={16}
                stroke={2.5}
              />
            </Tooltip>
            <Text>
              {latencyMs ? `${latencyMs} ms` : ''}
            </Text>
          </Group>

          <Group>
            <Tooltip withArrow label='Last checked'>
              <IconCalendar
                color='gray'
                size={16}
                stroke={2.5}
              />
            </Tooltip>
            <Text>
              {(createdAt as Date)?.toLocaleString()}
            </Text>
          </Group>
        </Stack>

        <LoadingOverlay visible={isActive && (isLoading || !latencyMs || !createdAt)} zIndex={99} />
        {!isActive && <Overlay />}
      </MantineCard>
    </>
  )
}
