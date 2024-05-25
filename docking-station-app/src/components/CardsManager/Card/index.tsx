import { useGetComposeService, useListComposeStacks, useUpdateComposeStackService } from '@/hooks/stacks'
import {
  ActionIcon,
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
  const { isRefetching: isLoadingParents } = useListComposeStacks()
  const { mutate, isLoading: isMutating } = useUpdateComposeStackService(stackName, serviceName)
  const { data, refetch, isRefetching, isLoading } = useGetComposeService(stackName, serviceName, {
    enabled: false,  // no auto-fetch
    meta: { noCache: true },
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
              ? <IconExclamationCircle color='#4fb2ff' />
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

        <Group wrap='nowrap'>
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

        <Group wrap='nowrap'>
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

        <Group wrap='nowrap'>
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
        visible={isLoadingParents || isMutating || isRefetching || isLoading}
        overlayProps={{
          blur: 1,
        }}
      />
    </MantineCard>
  )
}
