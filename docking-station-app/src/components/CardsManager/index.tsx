'use client'

import { useListComposeStacks } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import { SimpleGrid, rem } from '@mantine/core'
import Card from './Card'
import classes from './CardManager.module.css'
import EmptyCard from './EmptyCard'

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

export default function CardsManager() {
  const { updatesOnly, searchValue } = useFiltersStore(state => ({
    updatesOnly: state.updatesOnly,
    searchValue: state.searchValue,
  }))
  const { data = [], isFetching } = useListComposeStacks()
  const services = (
    data
      .flatMap(stack => stack.services)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .filter(service => {
        let flag = true

        if (updatesOnly) {
          flag &&= service.hasUpdates
        }

        if (searchValue) {
          flag &&= [
            service.stackName?.match(new RegExp(escapeRegExp(searchValue), 'i')),
            service.name.match(new RegExp(escapeRegExp(searchValue), 'i')),
          ].some(Boolean)
        }

        return flag
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
