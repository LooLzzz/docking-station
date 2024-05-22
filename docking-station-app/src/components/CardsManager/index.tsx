'use client'

import { useListComposeStacks } from '@/hooks/stacks'
import { useAppSettingsStore } from '@/store/zustand'
import { SimpleGrid, rem } from '@mantine/core'
import Card from './Card'
import classes from './CardManager.module.css'
import EmptyCard from './EmptyCard'

export default function CardsManager() {
  const filters = useAppSettingsStore(state => state.filters)
  const { data = [], isFetching } = useListComposeStacks({ refetchOnWindowFocus: false })
  const services = (
    data
      .flatMap(stack => stack.services)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .filter(service => {
        if (filters.updatesOnly) {
          return service.hasUpdates
        }

        return true
      })
  )

  return (
    <div>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }}>
        {
          services.map(({ stackName, serviceName }) => (
            <Card
              key={`${stackName}/${serviceName}`}
              stackName={stackName!}
              serviceName={serviceName!}
              className={classes.item}
              miw={rem(300)}
              mih={rem(150)}
            />
          ))
        }

        {
          !services?.length &&
          <EmptyCard
            loading={isFetching}
            className={classes.item}
            miw={rem(300)}
            mih={rem(150)}
          />
        }
      </SimpleGrid>
    </div>
  )
}
