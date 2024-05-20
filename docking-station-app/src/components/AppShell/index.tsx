'use client'

import { AppShell, Group, Title } from '@mantine/core'

export default function BasicAppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      header={{ height: { base: 60, md: 70, lg: 80 } }}
      padding='md'
    >

      <AppShell.Header>
        <Group h='100%' pl='xl'>
          <Title order={1}>
            Docking Station
          </Title>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {children}
      </AppShell.Main>

    </AppShell>
  )
}
