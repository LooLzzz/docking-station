'use client'

import { useGetComposeService, useUpdateComposeStackService } from '@/hooks/stacks'
import {
  ActionIcon,
  ColorSwatch,
  Group,
  LoadingOverlay,
  Card as MantineCard,
  Stack,
  Text,
  Tooltip,
  rem
} from '@mantine/core'
import {
  IconCalendar,
  IconCheck,
  IconCloudDownload,
  IconDeviceFloppy,
  IconExclamationCircle,
  IconInfoCircle,
  IconPencil,
  IconRefresh,
  IconTag
} from '@tabler/icons-react'
import { useQueryClient } from 'react-query'

interface CardProps {
  stackName: string
  serviceName: string
  miw?: string
  mih?: string
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
  stackName,
  serviceName,
  colors = {
    red: '#c60000',
    orange: '#df8c36',
    green: '#1cc95a',
  },
}: CardProps) {
  const client = useQueryClient()
  const isFetchingParents = client.isFetching(['stacks'])
  const { data, isFetching, refetch } = useGetComposeService(stackName, serviceName, {
    refetchOnWindowFocus: false,
    enabled: false,  // no auto-fetch
  })
  const { mutate, isLoading: isMutating } = useUpdateComposeStackService(stackName, serviceName)

  return (
    <MantineCard
      withBorder
      pos='relative'
      miw={miw}
      mih={mih}
      padding='lg'
      radius='md'
      className={className}
    >
      <Group
        pos='absolute'
        top={18}
        right={18}
        gap={5}
        wrap='nowrap'
      >
        <Tooltip
          withArrow
          label={data?.hasUpdates ? 'Updates available' : 'Up to date'}
        >
          {
            data?.hasUpdates
              ? <IconExclamationCircle color='#f6bc2c' />
              : <IconCheck color='#1ed760' />
          }
        </Tooltip>

        {
          data?.hasUpdates &&
          <Tooltip withArrow label='Update Service'>
            <ActionIcon
              color='gray'
              variant='transparent'
              onClick={() => mutate({})}
            >
              <IconCloudDownload
                size={20}
                stroke={2.5}
              />
            </ActionIcon>
          </Tooltip>
        }

        <Tooltip withArrow label='Refresh'>
          <ActionIcon
            color='gray'
            variant='transparent'
            onClick={() => refetch()}
          >
            <IconRefresh
              size={20}
              stroke={2.5}
            />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Stack gap={5}>
        <Group wrap='nowrap'>
          <Tooltip withArrow label='Container name'>
            <IconInfoCircle
              size={16}
              stroke={2.5}
              color='gray'
            />
          </Tooltip>
          <Text fw='bold' w={rem(data?.hasUpdates ? 160 : 190)} truncate='end' title={data?.name}>
            {data?.name}
          </Text>
        </Group>

        <Group>
          <Tooltip withArrow label='Stack name'>
            <IconPencil
              color='gray'
              size={16}
              stroke={2.5}
            />
          </Tooltip>
          <Text fz='h6' w={rem(250)} truncate='end' title={data?.stackName}>
            {data?.stackName}
          </Text>
        </Group>

        <Group>
          <Tooltip withArrow label='Image'>
            <IconDeviceFloppy
              color='gray'
              size={16}
              stroke={2.5}
            />
          </Tooltip>
          <Text fz='h6' w={rem(250)} truncate='end' title={data?.image.imageName}>
            {data?.image.imageName}
          </Text>
        </Group>

        <Group>
          <Tooltip withArrow label='Image tag'>
            <IconTag
              color='gray'
              size={16}
              stroke={2.5}
            />
          </Tooltip>
          <Text fz='h6' w={rem(250)} truncate='end' title={data?.image.imageTag}>
            {data?.image.imageTag}
          </Text>
        </Group>

        <Group>
          <Tooltip withArrow label='Status'>
            <IconCalendar
              color='gray'
              size={16}
              stroke={2.5}
            />
          </Tooltip>
          <Text fz='h6' w={rem(250)} truncate='end'>
            {data?.uptime}
          </Text>
        </Group>
      </Stack>

      <LoadingOverlay
        visible={!!isFetchingParents || isFetching || isMutating}
        overlayProps={{
          blur: 1,
        }}
      />
    </MantineCard>
  )
}
