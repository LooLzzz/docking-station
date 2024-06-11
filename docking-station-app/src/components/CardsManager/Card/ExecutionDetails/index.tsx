import { DockerServiceUpdateWsMessage } from '@/types'
import { Blockquote, Box, Code, Stack, Text, Timeline, Title } from '@mantine/core'
import { useEffect, useMemo, useState } from 'react'

interface ExecutionDetailsProps {
  messageHistory?: DockerServiceUpdateWsMessage[]
}

export default function ExecutionDetails({
  messageHistory = [],
}: ExecutionDetailsProps) {
  const groupedMessages = useMemo(() => {
    const res: Array<[string, string[]]> = []
    for (const message of messageHistory) {
      const { stage, payload } = message
      const p = payload ? [payload] : []
      if (res.length === 0 || res.slice(-1)[0][0] !== stage)
        res.push([stage, p])
      else
        res.slice(-1)[0][1].push(payload)
    }
    return res
  }, [messageHistory])

  return (
    <Timeline>
      {
        groupedMessages.map(([stage, lines], index) => (
          <Timeline.Item key={index} title={stage}>
            {
              lines.length > 0 &&
              <Code block>
                {lines.join('\n')}
              </Code>
            }
          </Timeline.Item>
        ))
      }
    </Timeline>
  )
}
