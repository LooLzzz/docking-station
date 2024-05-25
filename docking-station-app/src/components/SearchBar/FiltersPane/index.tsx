import { useFiltersStore } from '@/store'
import { Group, Card as MantineCard, Stack, Switch } from '@mantine/core'

export default function SearchBar() {
  const { updatesOnly, toggleUpdatesOnlyFilter, resetFilters } = useFiltersStore()

  return (
    <MantineCard>
      <Stack gap='md'>
        <Group>
          <Switch
            size='sm'
            label='Only show services with updates'
            checked={updatesOnly}
            onChange={toggleUpdatesOnlyFilter}
          />
        </Group>
      </Stack>
    </MantineCard>
  )
}