'use client'

import { Box } from '@mantine/core'
import ActionMenu from './ActionMenu'
import ActionBar from './ActionBar'

export default function ActionView({ onUpdate, onRefresh }: { onUpdate: () => void, onRefresh: () => void }) {
  return (
    <>
      <Box visibleFrom='sm'>
        <ActionBar onUpdate={onUpdate} onRefresh={onRefresh} />
      </Box>
      <Box hiddenFrom='sm'>
        <ActionMenu onUpdate={onUpdate} onRefresh={onRefresh} />
      </Box>
    </>
  )
}
