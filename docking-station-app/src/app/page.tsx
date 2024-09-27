import { CardsManager } from '@/components'
import { Center } from '@mantine/core'
import { Metadata } from 'next'

import './page.scss'

export default function Home() {
  return (
    <Center>
      <CardsManager />
    </Center>
  )
}

const APP_NAME = 'Docking-Station'
const APP_TITLE_TEMPLATE = `%s | ${APP_NAME}`
const APP_DESCRIPTION = 'Docking Station for the 21st Century'

export const metadata: Metadata = {
  applicationName: APP_NAME,

  title: {
    default: APP_NAME,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_NAME,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: {
      default: APP_NAME,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
}
