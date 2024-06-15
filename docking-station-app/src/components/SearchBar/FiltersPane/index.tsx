import { useFiltersStore } from '@/store'
import { Card as MantineCard, Stack, Switch, type CardProps as MantineCardProps } from '@mantine/core'

interface FiltersPaneProps extends MantineCardProps { }

export default function FiltersPane({ ...props }: FiltersPaneProps) {
  const {
    maturedUpdatesOnly,
    toggleMaturedUpdatesOnlyFilter,
    toggleUpdatesOnlyFilter,
    updatesOnly,
  } = useFiltersStore()

  return (
    <MantineCard bg='inherit' {...props}>
      <Stack gap='md'>
        <Switch
          size='sm'
          label='Only show services with updates'
          checked={updatesOnly}
          onChange={toggleUpdatesOnlyFilter}
        />
        <Switch
          size='sm'
          label='Only show matured updates'
          checked={maturedUpdatesOnly}
          onChange={toggleMaturedUpdatesOnlyFilter}
        />
      </Stack>
    </MantineCard>
  )
}
