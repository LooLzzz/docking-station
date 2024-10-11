'use client'

import { useListComposeStacks } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import {
  Burger,
  Center,
  Group,
  Menu,
  useMantineColorScheme,
} from '@mantine/core'
import { IconCloudDownload, IconRefresh } from '@tabler/icons-react'
import { useState } from 'react'
import { ThemeButton } from '@/components'

export default function ActionMenu({ onUpdate, onRefresh }: { onUpdate: () => void, onRefresh: () => void }) {
  const { colorScheme } = useMantineColorScheme();
  const [menuOpened, setMenuOpened] = useState(false);
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
    <Menu withArrow transitionProps={{ transition: 'scale-y', duration: 100 }} onOpen={() => setMenuOpened(true)} onClose={() => setMenuOpened(false)}>
      <Menu.Target>
        <Burger color={colorScheme == 'dark' ? 'gray.4' : 'gray.7'} opened={menuOpened} aria-label='Menu' />
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
  )
}
