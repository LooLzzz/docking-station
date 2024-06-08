'use client'

import { useListComposeStacks } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import { escapeRegExp } from '@/utils'
import { SimpleGrid, rem } from '@mantine/core'
import { useMemo } from 'react'
import Card from './Card'
import classes from './CardManager.module.css'
import EmptyCard from './EmptyCard'

export default function CardsManager() {
  const { updatesOnly, searchValue } = useFiltersStore(state => ({
    updatesOnly: state.updatesOnly,
    searchValue: state.searchValue,
  }))
  const { data = [], isFetching } = useListComposeStacks()

  const services = useMemo(() => (
    data
      .flatMap(stack => stack.services)
      .sort((a, b) => (
        a.hasUpdates !== b.hasUpdates
          ? Number(b.hasUpdates) - Number(a.hasUpdates)
          : a.hasUpdates
            ? a.image.latestUpdate.getTime() - b.image.latestUpdate.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime()
      ))
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
  ), [data, updatesOnly, searchValue])

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
