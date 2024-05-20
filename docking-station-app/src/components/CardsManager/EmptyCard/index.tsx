import { Center, LoadingOverlay, Card as MantineCard, Text } from '@mantine/core'
import localFont from 'next/font/local'

interface EmptyCardProps {
  loading?: boolean
  className?: string
  miw?: string
  mih?: string
}

const determinationMonoFont = localFont({ src: 'DeterminationMonoWeb.ttf' })

export default function EmptyCard({
  loading = false,
  className,
  miw,
  mih,
}: EmptyCardProps) {
  return (
    <MantineCard
      withBorder
      className={className}
      miw={miw}
      mih={mih}
      radius='md'
    >
      <Center h='100%'>
        {
          !loading &&
          <Text fz='h3' className={determinationMonoFont.className}>
            * But nobody came.
          </Text>
        }
        <LoadingOverlay visible={loading} />
      </Center>
    </MantineCard>
  )
}
