'use client'

import { useAppSettingsStore } from '@/store/zustand'
import { Button, Center, Group, Card as MantineCard, NumberInput, RangeSlider, Slider, Stack, Switch, Text, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import { useQueryClient } from 'react-query'

export default function AppSettings() {
  // const {} = useAppSettingsStore()
  const client = useQueryClient()

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

        </Stack>
      </MantineCard>
    </Center>
  )
}
