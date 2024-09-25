'use client'

import { useListComposeServicesFiltered } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import { SimpleGrid, rem, useComputedColorScheme } from '@mantine/core'
import { useCallback } from 'react'
import Card from './Card'
import classes from './CardManager.module.css'
import EmptyCard from './EmptyCard'

export default function CardsManager() {
  const [
    selectedServices,
    addSelectedService,
    deleteSelectedService,
  ] = useFiltersStore((state) => [
    state.selectedServices,
    state.addSelectedService,
    state.deleteSelectedService,
    state.clearSelectedServices,
  ])
  const colorScheme = useComputedColorScheme()
  const { data: services, isFetching } = useListComposeServicesFiltered()

  const handleSelect = useCallback((selected: boolean, stackName: string, serviceName: string) => {
    selected
      ? addSelectedService(`${stackName}/${serviceName}`)
      : deleteSelectedService(`${stackName}/${serviceName}`)
  }, [selectedServices])

  return (
    <div>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 4, xxxl: 5 }}>
        {
          services.map(({ stackName, serviceName }) => (
            <Card
              key={`${stackName}/${serviceName}`}
              stackName={stackName!}
              serviceName={serviceName!}
              onSelect={(selected) => handleSelect(selected, stackName!, serviceName!)}
              selected={selectedServices.has(`${stackName}/${serviceName}`)}
              bg={colorScheme === 'light' ? 'gray.1' : undefined}
              className={classes.item}
              miw={rem(325)}
              mih={rem(150)}
            />
          ))
        }

        {
          !services?.length &&
          <EmptyCard
            loading={isFetching}
            bg={colorScheme === 'light' ? 'gray.1' : undefined}
            className={classes.item}
            miw={rem(325)}
            mih={rem(150)}
          />
        }
      </SimpleGrid>
    </div>
  )
}
