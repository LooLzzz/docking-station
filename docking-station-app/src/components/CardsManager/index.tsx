'use client'

import { useListComposeStacks } from '@/hooks/stacks'
import { SimpleGrid, rem } from '@mantine/core'
import Card from './Card'
import classes from './CardManager.module.css'
import EmptyCard from './EmptyCard'

export default function CardsManager() {
  const { data = [], isLoading } = useListComposeStacks({ refetchOnWindowFocus: false })
  const services = (
    data
      .flatMap(stack => stack.services)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  )

  return (
    <div>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
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
          (isLoading || !data?.length) &&
          <EmptyCard
            loading={isLoading}
            className={classes.item}
            miw={rem(300)}
            mih={rem(150)}
          />
        }
      </SimpleGrid>
    </div>
  )
}
