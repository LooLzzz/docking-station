'use client'

import { SearchBar } from '@/components'
import { useListComposeStacks } from '@/hooks/stacks'
import {
  ActionIcon,
  AppShell,
  Center,
  Container,
  Group,
  Switch,
  Title,
  Tooltip,
  rem,
  useMantineColorScheme,
  useMantineTheme
} from '@mantine/core'
import { IconMoonStars, IconRefresh, IconSun } from '@tabler/icons-react'
import Image from 'next/image'

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
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const { refetch } = useListComposeStacks({
    enabled: false,  // no auto-fetch
    meta: { noCache: true },
  })

  return (
    <AppShell
      header={{ height: 65 }}
      padding='md'
    >

      <AppShell.Header>
        <Container h='100%' size={1375}>
          <Group h='100%' justify='space-between' wrap='nowrap'>
            {/* TODO: get an original icon */}
            <Image
              src='/logo.png'
              alt='Docker Logo'
              width={65}
              height={65}
            />

            <Center flex={1}>
              <SearchBar />
            </Center>

            <Center component={Group} gap={5} wrap='nowrap'>
              <Tooltip withArrow label='Refresh All'>
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
