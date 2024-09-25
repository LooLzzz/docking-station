'use client'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import { AppShell } from '@/components'
import { themeOverride } from '@/mantineTheme'
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const theme = createTheme(themeOverride)
const queryClient = new QueryClient()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <ColorSchemeScript defaultColorScheme='auto' />
      </head>

      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <MantineProvider
            theme={theme}
            defaultColorScheme='dark'
          >
            <Notifications position='bottom-left' />
            <ModalsProvider>
              <AppShell>
                {children}
              </AppShell>
            </ModalsProvider>
          </MantineProvider>
        </QueryClientProvider>
      </body>

    </html>
  )
}
