'use client'

import { useGetAllMonitoredWebsites } from '@/hooks/monitoring'
import { useAppSettingsStore } from '@/store/zustand'
import { SimpleGrid, rem } from '@mantine/core'
import Card from './Card'
import classes from './CardManager.module.css'
import EmptyCard from './EmptyCard'

export default function CardsManager() {
  const { lessAnimations } = useAppSettingsStore()
  const { data = [], isLoading } = useGetAllMonitoredWebsites()

  return (
    <div>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        {
          data.map((website) => (
            <Card
              key={website.id}
              website={website}
              className={lessAnimations ? undefined : classes.item}
              miw={rem(300)}
              mih={rem(150)}
            />
          ))
        }

        <EmptyCard
          loading={isLoading}
          className={lessAnimations ? undefined : classes.item}
          miw={rem(300)}
          mih={rem(150)}
        />
      </SimpleGrid>
    </div>
  )
}
