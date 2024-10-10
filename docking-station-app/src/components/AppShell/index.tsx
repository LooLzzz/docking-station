'use client'

import DockingStationLogo from '@/public/dockingstation-solid-black.svg'

import { SearchBar } from '@/components'
import { StackServiceRefreshEventDetail, useCreateUpdateComposeStackTask, useListComposeStacks } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import {
  ActionIcon,
  AppShell,
  Box,
  Center,
  Code,
  Container,
  Group,
  Switch,
  Text,
  Tooltip,
  rem,
  useMantineColorScheme,
  useMantineTheme
} from '@mantine/core'
import { modals } from '@mantine/modals'
import { useCallback, useRef } from 'react'
import ActionView from '../ActionView'


export default function BasicAppShell({ children }: { children: React.ReactNode }) {
  const [
    selectedServicesKeys,
    clearSelectedServices,
  ] = useFiltersStore((state) => [
    state.selectedServices,
    state.clearSelectedServices,
  ])
  const appShellHeaderRef = useRef<HTMLDivElement>(null)
  const createUpdateComposeStackTask = useCreateUpdateComposeStackTask({ pruneImages: true })
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const { data: stacks = [], refetch: refetchComposeStacks } = useListComposeStacks({
    enabled: false,  // no auto-fetch
    meta: { noCache: true },
  })

  const services = stacks.flatMap(({ services }) => services)

  const selectedServices = (
    services
      .filter(({ stackName, serviceName }) => (
        !selectedServicesKeys.size
        || selectedServicesKeys.has(`${stackName}/${serviceName}`)
      ))
  )

  const selectedServicesWithUpdates = (
    selectedServices
      .filter((service) => service.hasUpdates)
  )

  const handleRefreshSelected = useCallback(() => {
    if (!selectedServices.length || services.length === selectedServices.length) {
      refetchComposeStacks()
    } else {
      selectedServices.forEach(async ({ stackName, serviceName }) => {
        document.dispatchEvent(
          new CustomEvent<StackServiceRefreshEventDetail>('stack-service-refresh', {
            detail: { stackName, serviceName },
          }),
        )
        clearSelectedServices()
      })
    }
  }, [selectedServices, services, refetchComposeStacks, clearSelectedServices])

  const openUpdateSelectedConfirmModal = useCallback(() => modals.openConfirmModal({
    centered: true,
    title: 'Confirm Update Services Action',
    children: (
      <Text size='sm'>
        {[
          'Are you sure you want to update ',
          <Code key='1' fw='bold'>{selectedServicesWithUpdates.length}</Code>,
          ` service${selectedServicesWithUpdates.length > 1 ? 's' : ''}?`
        ]}
      </Text>
    ),
    labels: { confirm: 'Confirm', cancel: 'Cancel' },
    onConfirm: () => {
      const selectedServicesWithUpdatesByStack = selectedServicesWithUpdates.reduce((acc, service) => {
        const stackName = service.stackName!
        acc[stackName] = acc[stackName] || []
        acc[stackName].push(service)
        return acc
      }, {} as Record<string, typeof selectedServicesWithUpdates>)

      Object
        .entries(selectedServicesWithUpdatesByStack)
        .forEach(([stackName, services]) => {
          const serviceNames = services.map(({ serviceName }) => serviceName!)
          createUpdateComposeStackTask(stackName, serviceNames)
        })

      clearSelectedServices()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [selectedServicesWithUpdates])

  return (
    <AppShell
      header={{ height: 65 }}
      padding='md'
    >

      <AppShell.Header ref={appShellHeaderRef}>
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
            <ActionView onUpdate={openUpdateSelectedConfirmModal} onRefresh={handleRefreshSelected} />
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Box mih={`calc(100vh - 2 * ${appShellHeaderRef.current?.clientHeight ?? 64}px)`}>
          {children}
        </Box>

        <Box ta='right'>
          <Text
            span
            component='a'
            fz='xs'
            opacity={0.65}
            href={`https://github.com/LooLzzz/docking-station/releases/tag/v${process.env.NPM_PACKAGE_VERSION}`}
          >
            v{process.env.NPM_PACKAGE_VERSION}
          </Text>
        </Box>
      </AppShell.Main>

    </AppShell>
  )
}
