'use client'

import { Container } from '@mantine/core'
import ActionMenu from './ActionMenu'
import ActionBar from './ActionBar'

export default function ActionView({ onUpdate, onRefresh }: { onUpdate: () => void, onRefresh: () => void }) {
  return (
    <>
      <Container visibleFrom='sm'>
        <ActionBar onUpdate={onUpdate} onRefresh={onRefresh} />
      </Container>
      <Container hiddenFrom='sm'>
        <ActionMenu onUpdate={onUpdate} onRefresh={onRefresh} />
      </Container>
    </>
  )
}
