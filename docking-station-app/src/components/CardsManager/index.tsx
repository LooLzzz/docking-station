'use client'

import { useAppSettings } from '@/hooks'
import { useListComposeStacks } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import { escapeRegExp } from '@/utils'
import { SimpleGrid, rem, useComputedColorScheme } from '@mantine/core'
import { useMemo } from 'react'
import Card from './Card'
import classes from './CardManager.module.css'
import EmptyCard from './EmptyCard'

export default function CardsManager() {
  const colorScheme = useComputedColorScheme()
  const { appSettings } = useAppSettings()
  const {
    maturedUpdatesOnly,
    searchValue,
    updatesOnly,
  } = useFiltersStore()
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

        if (maturedUpdatesOnly) {
          if (!service?.hasUpdates || !appSettings?.server?.timeUntilUpdateIsMature)
            flag &&= false

          const latestUpdateTimestampSeconds = (
            service?.image?.latestUpdate
              ? (Date.now() - service?.image?.latestUpdate.getTime()) * 0.001
              : 0
          )
          flag &&= latestUpdateTimestampSeconds >= (appSettings?.server.timeUntilUpdateIsMature ?? 0)
        }

        if (searchValue) {
          flag &&= [
            service.stackName?.match(new RegExp(escapeRegExp(searchValue), 'i')),
            service.name.match(new RegExp(escapeRegExp(searchValue), 'i')),
          ].some(Boolean)
        }

        return flag
      })
  ), [data, updatesOnly, searchValue, maturedUpdatesOnly])

  return (
    <div>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3, xl: 4, xxxl: 5 }}>
        {
          services.map(({ stackName, serviceName }) => (
            <Card
              key={`${stackName}/${serviceName}`}
              stackName={stackName!}
              serviceName={serviceName!}
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
