'use client'

import { useGetComposeService } from '@/hooks/stacks'
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
import { IconCalendar, IconCloudDownload, IconDeviceFloppy, IconInfoCircle, IconPencil, IconRefresh, IconTag } from '@tabler/icons-react'
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
      <Stack gap={5}>
        <Group wrap='nowrap'>
          <Tooltip withArrow label='Container name'>
            <IconInfoCircle
              size={16}
              stroke={2.5}
              color='gray'
            />
          </Tooltip>
          <Group gap={0} wrap='nowrap' flex={1}>
            <Text fw='bold' w='100%' truncate='end'>
              {data?.name}
            </Text>

            <Tooltip
              withArrow
              label={data?.hasUpdates ? 'Updates available' : 'Up to date'}
            >
              <ColorSwatch
                color={data?.hasUpdates ? colors.orange : colors.green}
                size={20}
                mt={1}
                mr={5}
                radius='xl'
              />
            </Tooltip>

            {
              data?.hasUpdates &&
              <Tooltip withArrow label='Update Service'>
                <ActionIcon
                  color='gray'
                  variant='transparent'
                  // TODO: implement update service
                  onClick={() => ({})}
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
          <Tooltip withArrow label='Creation date'>
            <IconCalendar
              color='gray'
              size={16}
              stroke={2.5}
            />
          </Tooltip>
          <Text fz='h6' w={rem(250)} truncate='end'>
            {data?.createdAt.toLocaleString()}
          </Text>
        </Group>
      </Stack>

      <LoadingOverlay
        visible={!!isFetchingParents || isFetching}
      />
    </MantineCard>
  )
}
