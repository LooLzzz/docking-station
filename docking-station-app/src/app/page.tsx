import DockingStationLogo from '@/public/dockingstation-logo.png'

import { CardsManager } from '@/components'
import { Center } from '@mantine/core'
import { Metadata } from 'next'

export default function Home() {
  return (
    <Center>
      <CardsManager />
    </Center>
  )
}

export const metadata: Metadata = {
  title: 'Docking Station',
  icons: {
    icon: [
      {
        rel: 'icon',
        url: DockingStationLogo.src,
      },
    ],
  },
}
