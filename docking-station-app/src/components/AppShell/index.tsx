'use client'

import DockingStationLogo from '@/public/dockingstation-solid-black.svg'

import { SearchBar } from '@/components'
import { useListComposeStacks } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import {
  ActionIcon,
  AppShell,
  Center,
  Container,
  Group,
  Switch,
  Tooltip,
  rem,
  useMantineColorScheme,
  useMantineTheme
} from '@mantine/core'
import { IconCloudDownload, IconMoonStars, IconRefresh, IconSun } from '@tabler/icons-react'
import { useCallback } from 'react'
import { useQueryClient } from 'react-query'

const SunIcon = () => {
  const theme = useMantineTheme()
  return (
    <IconSun
      style={{ width: rem(16), height: rem(16) }}
      stroke={2.5}
      color={theme.colors.yellow[4]}
    />
  )
}

const MoonIcon = () => {
  const theme = useMantineTheme()
  return (
    <IconMoonStars
      style={{ width: rem(16), height: rem(16) }}
      stroke={2.5}
      color={theme.colors.blue[6]}
    />
  )
}

export default function BasicAppShell({ children }: { children: React.ReactNode }) {
  const [
    selectedServices,
    clearSelectedServices,
  ] = useFiltersStore((state) => [
    state.selectedServices,
    state.clearSelectedServices,
  ])
  const queryClient = useQueryClient()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const { data: services, refetch: refetchComposeStacks } = useListComposeStacks({
    enabled: false,  // no auto-fetch
    meta: { noCache: true },
  })

  const handleRefreshSelected = useCallback(() => {
    if (!selectedServices.size) {
      refetchComposeStacks()
    } else {
      selectedServices.forEach((service) => {
        const [stackName, serviceName] = service.split('/')
        queryClient.refetchQueries(['stacks', stackName, serviceName])
        clearSelectedServices()
      })
    }
  }, [selectedServices, queryClient, refetchComposeStacks, clearSelectedServices])

  const handleUpdateSelected = useCallback(() => {
    // TODO: Implement batch update
  }, [selectedServices, services])

  return (
    <AppShell
      header={{ height: 65 }}
      padding='md'
    >

      <AppShell.Header>
        <Container h='100%' size={1375}>
          <Group h='100%' justify='space-between' wrap='nowrap'>
            <DockingStationLogo
              fill={colorScheme === 'dark' ? '#ffffff' : '#242424'}
              alt='Docker Logo'
              width={75}
              height={75}
            />

            <Center flex={1}>
              <SearchBar />
            </Center>

            <Center component={Group} gap={5} wrap='nowrap'>
              <Tooltip
                withArrow
                label={selectedServices.size ? 'Update Selected' : 'Update All'}
              >
                <ActionIcon
                  c='gray'
                  variant='transparent'
                  onClick={handleUpdateSelected}
                >
                  <IconCloudDownload
                    size={20}
                    stroke={2.5}
                  />
                </ActionIcon>
              </Tooltip>
              <Tooltip
                withArrow
                label={selectedServices.size ? 'Refresh Selected' : 'Refresh All'}
              >
                <ActionIcon
                  color='gray'
                  variant='transparent'
                  onClick={handleRefreshSelected}
                >
                  <IconRefresh
                    size={20}
                    stroke={2.5}
                  />
                </ActionIcon>
              </Tooltip>
              <Switch
                size='md'
                color='dark.4'
                onLabel={<SunIcon />}
                offLabel={<MoonIcon />}
                checked={colorScheme === 'light'}
                onChange={() => toggleColorScheme()}
              />
            </Center>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        {children}
      </AppShell.Main>

    </AppShell>
  )
}
