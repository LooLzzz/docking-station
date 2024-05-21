'use client'

import { useAppSettingsStore } from '@/store/zustand'
import { Button, Center, Group, Card as MantineCard, Stack, Switch, Title } from '@mantine/core'
import { useQueryClient } from 'react-query'

export default function AppSettings() {
  const client = useQueryClient()
  const { updatesOnly, toggleUpdatesOnlyFilter } = useAppSettingsStore(state => ({
    toggleUpdatesOnlyFilter: state.toggleUpdatesOnlyFilter,
    updatesOnly: state.filters.updatesOnly,
  }))

  return (
    <Center w='100%'>
      <MantineCard withBorder padding='lg' radius='md' miw={500} style={{ justifyContent: 'center' }}>
        <Group>
          <Title order={2}>App Settings</Title>
        </Group>

        <Stack gap='xl' py='md'>

          <Group wrap='nowrap' gap='xs' justify='center'>
            <Button
              variant='filled'
              onClick={() => client.invalidateQueries(['stacks'])}
            >
              Refresh all
            </Button>
          </Group>

          <Group wrap='nowrap' gap='xs' justify='center'>
            <Switch
              label='Show only services with updates'
              checked={updatesOnly}
              onChange={() => toggleUpdatesOnlyFilter()}
            />
          </Group>

        </Stack>
      </MantineCard>
    </Center>
  )
}
