'use client'

import DockingStationLogo from '@/public/dockingstation-solid-black.svg'

import { SearchBar } from '@/components'
import { useListComposeStacks } from '@/hooks/stacks'
import {
  ActionIcon,
  AppShell,
  Box,
  Center,
  Container,
  Group,
  Stack,
  Switch,
  Text,
  Tooltip,
  rem,
  useMantineColorScheme,
  useMantineTheme
} from '@mantine/core'
import { IconMoonStars, IconRefresh, IconSun } from '@tabler/icons-react'

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
        <Stack>
          {children}

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
        </Stack>
      </AppShell.Main>


    </AppShell>
  )
}
