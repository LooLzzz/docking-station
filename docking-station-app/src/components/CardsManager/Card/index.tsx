'use client'

import { useAppSettings } from '@/hooks/appSettings'
import { useGetComposeService, useListComposeStacks, useUpdateComposeStackServices } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import {
  ActionIcon,
  Center,
  Code,
  Group,
  LoadingOverlay,
  Card as MantineCard,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Title,
  Tooltip,
  rem,
  type CardProps as MantineCardProps,
} from '@mantine/core'
import { useDisclosure, useInterval, usePrevious } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import {
  IconCalendarEvent,
  IconCalendarUp,
  IconCheck,
  IconCloudDownload,
  IconExclamationCircle,
  IconExternalLink,
  IconListDetails,
  IconRefresh,
  IconSquare,
  IconSquareCheck,
  IconStack2,
  IconTag,
  IconVersions,
} from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ExecutionDetails from './ExecutionDetails'
import classes from './index.module.scss'

interface CardProps extends Omit<React.DOMAttributes<HTMLDivElement>, 'onSelect'>, MantineCardProps {
  stackName: string
  serviceName: string
  selected?: boolean
  onSelect?: (selected: boolean) => void
}


export default function Card({
  stackName,
  serviceName,
  selected,
  onSelect,
  className = '',
  ...props
}: CardProps) {
  const [
    deleteSelectedService,
  ] = useFiltersStore((state) => [
    state.deleteSelectedService,
  ])
  const { appSettings } = useAppSettings()
  const modalViewportRef = useRef<HTMLDivElement>(null)
  const modalViewportPrevScrollHeight = usePrevious(modalViewportRef.current?.scrollHeight)
  const modalViewportPrevClientHeight = usePrevious(modalViewportRef.current?.clientHeight)
  const modalViewportPrevScrollTop = usePrevious(modalViewportRef.current?.scrollTop)

  const { isRefetching: isLoadingParents } = useListComposeStacks({
    enabled: false, // no auto-fetch
  })
  const { updateServices, isPolling, lastMessage, messageHistory } = useUpdateComposeStackServices(stackName, serviceName, { pruneImages: true })
  const { data, refetch, isRefetching, isLoading } = useGetComposeService(stackName, serviceName, {
    enabled: false,  // no auto-fetch
    meta: { noCache: true },
  })
  const loadingOverlayVisible = isLoadingParents || isPolling || isRefetching || isLoading

  const [seconds, setSeconds] = useState(0)
  const advanceSeconds = useCallback(() => setSeconds(s => s + 0.1), [])
  const interval = useInterval(advanceSeconds, 100)
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

  const isModalViewportAtBottom = useMemo(() => Boolean(
    modalViewportPrevScrollHeight
    && modalViewportPrevClientHeight
    && modalViewportPrevScrollHeight - modalViewportPrevClientHeight - modalViewportPrevScrollTop! < 10
  ), [modalViewportPrevScrollHeight, modalViewportPrevClientHeight, modalViewportPrevScrollTop])

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
      updateServices()
      executionDetailsModalOpen()
    },
  }), [data?.image.imageName, executionDetailsModalOpen, updateServices])

  const modalscrollToBottom = useCallback(() => {
    modalViewportRef.current?.scrollTo({
      top: modalViewportRef.current?.scrollHeight,
    })
  }, [modalViewportRef])

  useEffect(() => {
    if (!isPolling && isModalViewportAtBottom)
      executionDetailsModalClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPolling, executionDetailsModalClose])

  useEffect(() => {
    loadingOverlayVisible
      ? interval.start()
      : interval.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingOverlayVisible])

  useEffect(() => {
    !interval.active
      && setSeconds(0)
  }, [interval?.active, setSeconds])

  useEffect(() => {
    executionDetailsModalVisible
      && isModalViewportAtBottom
      && modalscrollToBottom()
  }, [lastMessage, executionDetailsModalVisible, isModalViewportAtBottom, modalscrollToBottom])

  const ModalScrollAreaComponent = useCallback((props: any) => (
    <ScrollArea.Autosize
      {...props}
      viewportRef={modalViewportRef}
      type='auto'
    />
  ), [modalViewportRef])

  return (
    <MantineCard
      withBorder
      data-selected={(selected && !loadingOverlayVisible) || undefined}
      pos='relative'
      padding='lg'
      radius='md'
      onMouseDown={(e) => {
        // on middle-mouse click
        if (loadingOverlayVisible) return
        if (e.button === 1) {
          onSelect?.(!selected)
          e.preventDefault()
        }
      }}
      {...props}
      className={`${className} ${classes.container}`}
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
                <Center>{releaseStatus} {isReleaseMature ? '[Matured]' : '[Not-Matured]'}</Center>
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
            onClick={() => {
              refetch()
              deleteSelectedService(`${stackName}/${serviceName}`)
            }}
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

        <Group wrap='nowrap'>
          <Tooltip withArrow label='Uptime'>
            <IconCalendarUp
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
        </Group>

        <Group wrap='nowrap'>
          <Tooltip withArrow label='Local image date'>
            <IconCalendarEvent
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

      <Group pos='absolute' bottom={12.5} right={20} style={{ zIndex: 999 }}>
        {
          !loadingOverlayVisible &&
          <ActionIcon
            size='sm'
            variant='transparent'
            c={selected ? undefined : 'gray.7'}
            onClick={() => onSelect?.(!selected)}
            data-checked={selected || undefined}
            className={classes.selectIcon}
          >
            {
              selected
                ? <IconSquareCheck />
                : <IconSquare />
            }
          </ActionIcon>
        }

        {
          messageHistory.length > 0 &&
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
        }
      </Group>

      {
        messageHistory.length > 0 &&
        (
          <>
            <Modal
              centered
              size='xl'
              radius='lg'
              opened={executionDetailsModalVisible}
              onClose={executionDetailsModalClose}
              title={<Title order={2} fw='bold'>Execution Details <Code fz='h4'>{serviceName}</Code></Title>}
              scrollAreaComponent={ModalScrollAreaComponent}
            >
              <ExecutionDetails
                messageHistory={messageHistory}
                style={{
                  width: 'min(83vw, 45rem)'  // yay magic numbers (not 🤦‍♂️)
                }}
              />
            </Modal>
          </>
        )
      }
    </MantineCard>
  )
}
