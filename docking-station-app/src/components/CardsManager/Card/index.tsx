'use client'

import { useAppSettings } from '@/hooks/appSettings'
import { useGetComposeService, useListComposeStacks, useUpdateComposeStackService } from '@/hooks/stacks'
import {
  ActionIcon,
  Box,
  Center,
  Code,
  Group,
  LoadingOverlay,
  Card as MantineCard,
  Modal,
  Stack,
  Text,
  Title,
  Tooltip,
  rem
} from '@mantine/core'
import { useDisclosure, useInterval } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import {
  IconCalendarDown,
  IconCheck,
  IconCloudDownload,
  IconExclamationCircle,
  IconExternalLink,
  IconListDetails,
  IconRefresh,
  IconStack2,
  IconTag,
  IconVersions,
} from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import ExecutionDetails from './ExecutionDetails'

interface CardProps {
  stackName: string
  serviceName: string
  miw?: string
  mih?: string
  className?: string
}


export default function Card({
  miw,
  mih,
  className,
  stackName,
  serviceName,
}: CardProps) {
  const { data: appSettings } = useAppSettings()

  const { isRefetching: isLoadingParents } = useListComposeStacks({
    enabled: false, // no auto-fetch
  })
  const { mutate, isMutating, lastMessage, messageHistory } = useUpdateComposeStackService(stackName, serviceName, { pruneImages: true })
  const { data, refetch, isRefetching, isLoading } = useGetComposeService(stackName, serviceName, {
    enabled: false,  // no auto-fetch
    meta: { noCache: true },
  })
  const loadingOverlayVisible = isLoadingParents || isMutating || isRefetching || isLoading

  const [seconds, setSeconds] = useState(0)
  const interval = useInterval(() => setSeconds(s => s + 0.1), 100)
  const [executionDetailsModalVisible, {
    open: executionDetailsModalOpen,
    close: executionDetailsModalClose,
  }] = useDisclosure()

  const isReleaseMature = useMemo(() => {
    if (!data?.hasUpdates || !appSettings?.server?.timeUntilUpdateIsMature)
      return false

    const latestUpdateTimestampSeconds = (
      data?.image?.latestUpdate
        ? (Date.now() - data?.image?.latestUpdate.getTime()) * 0.001
        : 0
    )

    return latestUpdateTimestampSeconds >= appSettings.server.timeUntilUpdateIsMature
  }, [data?.hasUpdates, data?.image?.latestUpdate, appSettings?.server?.timeUntilUpdateIsMature])

  const releaseStatus = useMemo(() => {
    if (!data?.hasUpdates)
      return 'Up to date'

    const daysAgo = (
      data?.image?.latestUpdate
        ? Math.floor((Date.now() - data?.image?.latestUpdate.getTime()) / (1000 * 60 * 60 * 24))
        : 0
    )
    if (daysAgo === 0) return 'Today'
    if (daysAgo === 1) return '1 day ago'
    return `${daysAgo} days ago`
  }, [data?.hasUpdates, data?.image?.latestUpdate])

  const openMutateConfirmModal = useCallback(() => modals.openConfirmModal({
    centered: true,
    title: 'Confirm Update Service Action',
    children: (
      <Text size='sm'>
        Are you sure you want to update <Code fw='bold' style={{ whiteSpace: 'nowrap' }}>{data?.image.imageName ?? '???'}</Code>?
      </Text>
    ),
    labels: { confirm: 'Confirm', cancel: 'Cancel' },
    onConfirm: () => {
      mutate()
      executionDetailsModalOpen()
    },
  }), [modals, data?.image.imageName])

  // useEffect(() => {
  //   if (!isMutating)
  //     executionDetailsModalClose()
  // }, [isMutating])

  useEffect(() => {
    loadingOverlayVisible
      ? interval.start()
      : interval.stop()
  }, [loadingOverlayVisible])

  useEffect(() => {
    !interval.active
      && setSeconds(0)
  }, [interval?.active, setSeconds])

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
          label={
            data?.hasUpdates
              ? <>
                <Center>Updates available</Center>
                {data?.image?.latestVersion ? <Center>{`Version ${data?.image?.latestVersion}`}</Center> : null}
                <Center>{releaseStatus} {isReleaseMature ? '[Matured]' : '[Not-matured]'}</Center>
              </>
              : 'Up to date'
          }
        >
          {
            data?.hasUpdates
              ? <IconExclamationCircle color={
                isReleaseMature
                  ? '#4fb2ff'
                  : '#ffab00'
              } />
              : <IconCheck color='#1ed760' />
          }
        </Tooltip>

        {
          data?.hasUpdates &&
          <Tooltip
            withArrow
            label='Update Service'
            events={{
              hover: true,
              focus: false,
              touch: false,
            }}
          >
            <ActionIcon
              color='gray'
              variant='transparent'
              onClick={() => openMutateConfirmModal()}
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
            <IconExternalLink
              size={16}
              stroke={2.5}
              color='gray'
            />
          </Tooltip>
          <Text
            component='a'
            title={data?.name}
            href={data?.homepageUrl}
            target='_blank'
            truncate='end'
            fw='bold'
            maw={rem(data?.hasUpdates ? 160 : 190)}
          >
            {data?.name}
          </Text>
        </Group>

        <Group wrap='nowrap'>
          <Tooltip withArrow label='Stack name'>
            <IconStack2
              color='gray'
              size={16}
              stroke={2.5}
            />
          </Tooltip>
          <Text
            style={{ fontSize: 'var(--mantine-h6-font-size)' }}
            w={rem(250)}
            truncate='end'
            title={data?.stackName}
          >
            {data?.stackName}
          </Text>
        </Group>

        <Group wrap='nowrap'>
          <Tooltip withArrow label='Image'>
            <IconTag
              color='gray'
              size={16}
              stroke={2.5}
            />
          </Tooltip>
          <Text
            style={{ fontSize: 'var(--mantine-h6-font-size)' }}
            w={rem(250)}
            truncate='end'
            title={`${data?.image.imageName}:${data?.image.imageTag}`}
          >
            {`${data?.image.imageName}:${data?.image.imageTag}`}
          </Text>
        </Group>

        {
          data?.image.version &&
          <Group wrap='nowrap'>
            <Tooltip withArrow label='Version'>
              <IconVersions
                color='gray'
                size={16}
                stroke={2.5}
              />
            </Tooltip>
            <Text
              style={{ fontSize: 'var(--mantine-h6-font-size)' }}
              w={rem(250)}
              truncate='end'
            >
              {data?.image.version}
            </Text>
          </Group>
        }

        {/* <Group wrap='nowrap'>
          <Tooltip withArrow label='Uptime'>
            <IconCalendar
              color='gray'
              size={16}
              stroke={2.5}
            />
          </Tooltip>
          <Text
            style={{ fontSize: 'var(--mantine-h6-font-size)' }}
            w={rem(250)}
            truncate='end'
          >
            {data?.uptime}
          </Text>
        </Group> */}

        <Group wrap='nowrap'>
          <Tooltip withArrow label='Local image date'>
            <IconCalendarDown
              color='gray'
              size={16}
              stroke={2.5}
            />
          </Tooltip>
          <Text
            style={{ fontSize: 'var(--mantine-h6-font-size)' }}
            w={rem(250)}
            truncate='end'
          >
            {data?.image?.createdAt?.toLocaleDateString()}
          </Text>
        </Group>

      </Stack>

      <LoadingOverlay
        visible={loadingOverlayVisible}
        overlayProps={{
          blur: 1,
          children: (
            <Stack align='center' justify='center' h='100%' gap={45}>
              <Text>
                {lastMessage ? lastMessage.stage : ''}
              </Text>
              <Text pt={lastMessage ? undefined : 25}>
                {`${seconds.toFixed(1)}s`}
              </Text>
            </Stack>
          ),
        }}
      />

      <Modal
        centered
        radius='lg'
        padding={25}
        opened={executionDetailsModalVisible}
        onClose={executionDetailsModalClose}
        title={<Title order={2} fw='bold'>Execution Details</Title>}
      >
        <ExecutionDetails messageHistory={messageHistory} />
      </Modal>

      {
        messageHistory.length > 0 &&
        <Box pos='absolute' bottom={12.5} right={20} style={{ zIndex: 999 }}>
          <Tooltip withArrow label='Execution Details' events={{
            hover: true,
            focus: false,
            touch: false,
          }}>
            <ActionIcon
              size='sm'
              color='gray.5'
              variant='transparent'
              onClick={() => executionDetailsModalOpen()}
            >
              <IconListDetails />
            </ActionIcon>
          </Tooltip>
        </Box>
      }
    </MantineCard>
  )
}
