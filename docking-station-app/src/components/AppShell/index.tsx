'use client'

import deeperLogo from '@/public/deeper-logo.png'
import { AppShell, Group } from '@mantine/core'
import Image from 'next/image'

export default function BasicAppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      header={{ height: { base: 60, md: 70, lg: 80 } }}
      padding='md'
    >

      <AppShell.Header>
        <Group h='100%'>
          <Image
            fill
            src={deeperLogo}
            alt='Deeper Logo'
            style={{
              objectFit: 'contain',
              objectPosition: 'left',
              paddingLeft: '10px',
            }}
          />
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {children}
      </AppShell.Main>

    </AppShell>
  )
}
