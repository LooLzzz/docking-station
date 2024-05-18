import { CardsManager, AppSettings } from '@/components'
import { Center, Group, Stack } from '@mantine/core'

export default function Home() {
  return (
    <Center>
      <Stack>
        <Group>
          <AppSettings />
        </Group>
        <CardsManager />
      </Stack>
    </Center>
  )
}
