import {
  Center,
  LoadingOverlay,
  Card as MantineCard,
  Text,
  type CardProps as MantineCardProps,
} from '@mantine/core'
import localFont from 'next/font/local'

const determinationMonoFont = localFont({ src: 'DeterminationMonoWeb.ttf' })

interface EmptyCardProps extends MantineCardProps {
  loading?: boolean
}


export default function EmptyCard({
  loading = false,
  ...props
}: EmptyCardProps) {
  return (
    <MantineCard
      withBorder
      radius='md'
      {...props}
    >
      <Center h='100%'>
        {
          !loading &&
          <Text
            className={determinationMonoFont.className}
            style={{ fontSize: 'var(--mantine-h3-font-size)' }}
          >
            * But nobody came.
          </Text>
        }
        <LoadingOverlay visible={loading} />
      </Center>
    </MantineCard>
  )
}
