import { ActionIcon, Center, Card as MantineCard, rem } from '@mantine/core'
import { modals } from '@mantine/modals'
import { IconSquarePlus } from '@tabler/icons-react'
import NewCardForm from './NewCardForm'

interface EmptyCardProps {
  loading?: boolean
  className?: string
  miw?: string
  mih?: string
}

export default function EmptyCard({
  loading = false,
  className,
  miw,
  mih,
}: EmptyCardProps) {
  const handleCreateCard = () => {
    modals.open({
      title: 'Create a new monitored website',
      children: <NewCardForm />,
      centered: true,
    })
  }

  return (
    <MantineCard
      withBorder
      className={className}
      miw={miw}
      mih={mih}
      radius='md'
    >
      <Center h='100%'>
        <ActionIcon
          w='100%'
          h='100%'
          onClick={handleCreateCard}
          loading={loading}
          size={80}
          color='gray'
          variant='light'
          radius='md'
        >
          <IconSquarePlus size={48} />
        </ActionIcon>
      </Center>
    </MantineCard>
  )
}
