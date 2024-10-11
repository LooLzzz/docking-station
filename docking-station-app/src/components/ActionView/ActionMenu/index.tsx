'use client'

import { useListComposeStacks } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import {
  ActionIcon,
  Burger,
  Center,
  Group,
  Menu,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core'
import { IconCloudDownload, IconRefresh } from '@tabler/icons-react'
import ThemeButton from '../../ThemeButton'

export default function ActionMenu({ onUpdate, onRefresh }: { onUpdate: () => void, onRefresh: () => void }) {
  const { colorScheme } = useMantineColorScheme();
  const { data: stacks = [] } = useListComposeStacks({
    enabled: false,
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
      <Menu withArrow transitionProps={{ transition: 'scale-y', duration: 100 }}>
        <Menu.Target>
          <Burger c={colorScheme == 'dark' ? 'gray.7' : 'gray.4'} />
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Actions</Menu.Label>
          <Menu.Item leftSection={<IconCloudDownload size={14} />} disabled={!stacks.length || !selectedServicesWithUpdates.length} onClick={onUpdate}>
            {!selectedServicesKeys.size || services.length == selectedServices.length ? 'Update All' : 'Update Selected'}
          </Menu.Item>
          <Menu.Item leftSection={<IconRefresh size={14} />} disabled={!stacks.length} onClick={onRefresh}>
            {!selectedServices.length || services.length === selectedServices.length ? 'Refresh All' : 'Refresh Selected'}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Label>Theme</Menu.Label>
          <Menu.Item closeMenuOnClick={false}><ThemeButton /></Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Center>


  )
}
