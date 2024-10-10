'use client'

import { useListComposeStacks } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import {
  ActionIcon,
  Center,
  Group,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core'
import { IconCloudDownload, IconRefresh } from '@tabler/icons-react'
import ThemeButton from '../../ThemeButton'

export default function Bar({ onUpdate, onRefresh }: { onUpdate: () => void, onRefresh: () => void }) {
  const { colorScheme } = useMantineColorScheme();
  const { data: stacks = [] } = useListComposeStacks({
    enabled: false,  // no auto-fetch
    meta: { noCache: true },
  })
  const services = stacks.flatMap(({ services }) => services)
  const [selectedServicesKeys] = useFiltersStore((state) => [state.selectedServices])
  const selectedServices = (services.filter(({ stackName, serviceName }) => (
    !selectedServicesKeys.size
    || selectedServicesKeys.has(`${stackName}/${serviceName}`)
  ))
  )
  const selectedServicesWithUpdates = (selectedServices.filter((service) => service.hasUpdates))
  return (
    <Center component={Group} gap={5} wrap='nowrap'>
      <Tooltip
        withArrow
        disabled={!stacks.length || !selectedServicesWithUpdates.length}
        label={selectedServicesKeys.size ? 'Update Selected' : 'Update All'}
      >
        <ActionIcon
          c={selectedServicesWithUpdates.length ? 'gray' : (colorScheme == 'dark' ? 'gray.7' : 'gray.4')}
          disabled={!stacks.length || !selectedServicesWithUpdates.length}
          variant='transparent'
          onClick={onUpdate}
        >
          <IconCloudDownload
            size={20}
            stroke={2.5}
          />
        </ActionIcon>
      </Tooltip>
      <Tooltip
        withArrow
        disabled={!stacks.length}
        label={!selectedServices.length || services.length === selectedServices.length ? 'Refresh All' : 'Refresh Selected'}
      >
        <ActionIcon
          color='gray'
          disabled={!stacks.length}
          variant='transparent'
          onClick={onRefresh}
        >
          <IconRefresh
            size={20}
            stroke={2.5}
          />
        </ActionIcon>
      </Tooltip>
      <ThemeButton />
    </Center>


  )
}
