import { DockerServiceUpdateWsMessage } from '@/types'
import { Code, Timeline, TimelineItemProps } from '@mantine/core'
import { IconArrowUp, IconCloud, IconPlayerPlayFilled, IconRecycle, IconSquareRoundedCheck } from '@tabler/icons-react'
import { useMemo } from 'react'

interface ExecutionDetailsProps {
  messageHistory?: DockerServiceUpdateWsMessage[]
}

export default function ExecutionDetails({
  messageHistory = [],
}: ExecutionDetailsProps) {
  const groupedMessages = useMemo(() => {
    const res: Array<[string, string[]]> = []
    for (const { stage, message } of messageHistory) {
      const p = message ? [message] : []
      if (res.length === 0 || res.slice(-1)[0][0] !== stage)
        res.push([stage, p])
      else
        res.slice(-1)[0][1].push(message)
    }
    return res
  }, [messageHistory])

  const isFinished = useMemo(() => (
    messageHistory.length > 0
    && messageHistory.slice(-1)[0].stage === 'Finished'
  ), [groupedMessages])

  const timelineItemProps = useMemo<{ [key: string]: TimelineItemProps }>(() => ({
    'Connecting...': {
      bullet: <IconCloud size={18} />,
      lineVariant: 'dashed',
    },

    'Starting': {
      lineVariant: 'dashed',
      bullet: <IconPlayerPlayFilled size={18} />,
    },

    'docker compose up --pull always': {
      bullet: <IconArrowUp size={18} />,
    },

    'docker image prune': {
      bullet: <IconRecycle size={18} />,
    },

    'Finished': {
      bullet: <IconSquareRoundedCheck size={18} />,
    },
  }), [])

  return (
    <Timeline color='cyan.9' lineWidth={3} bulletSize={27} active={groupedMessages.length - 1}>
      {
        groupedMessages.map(([stage, lines]) => (
          <Timeline.Item key={stage} title={stage} {...timelineItemProps?.[stage]}>
            {
              lines.length > 0 &&
              <Code block w='100%'>
                {lines.join('\n')}
              </Code>
            }
          </Timeline.Item>
        ))
      }
      {
        !isFinished && (
          <Timeline.Item title='Finished' {...timelineItemProps?.['Finished']} />
        )
      }
    </Timeline>
  )
}
