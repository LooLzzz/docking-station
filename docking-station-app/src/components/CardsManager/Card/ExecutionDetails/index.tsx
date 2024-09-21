import { DockerServiceUpdateWsMessage } from '@/types'
import { Accordion, Code, ScrollArea, Text, Timeline, TimelineItemProps, Title, type TimelineProps } from '@mantine/core'
import { IconArrowsUpDown, IconCloud, IconPlayerPlayFilled, IconRecycle, IconSquareRoundedCheck } from '@tabler/icons-react'
import { useMemo } from 'react'
import classes from './styles.module.scss'

interface ExecutionDetailsProps extends TimelineProps {
  messageHistory?: DockerServiceUpdateWsMessage[]
}

type TimelineStages = typeof timelineStages[number]

const timelineStages = [
  'Connecting',
  'Starting',
  'docker compose up --pull always',
  'docker image prune',
  'Finished',
] as const

const timelineItemProps: Record<TimelineStages, TimelineItemProps> = {
  'Connecting': {
    bullet: <IconCloud size={18} />,
    lineVariant: 'dashed',
  },

  'Starting': {
    bullet: <IconPlayerPlayFilled size={18} />,
  },

  'docker compose up --pull always': {
    bullet: <IconArrowsUpDown size={18} />,
  },

  'docker image prune': {
    bullet: <IconRecycle size={18} />,
  },

  'Finished': {
    bullet: <IconSquareRoundedCheck size={18} />,
  },
}

export default function ExecutionDetails({
  messageHistory = [],
  ...props
}: ExecutionDetailsProps) {
  const groupedMessages = useMemo(() => {
    const res: Array<[TimelineStages, string[]]> = []
    for (const { stage, message } of messageHistory) {
      const p = message ? [message] : []
      if (res.length === 0 || res.slice(-1)[0][0] !== stage)
        res.push([stage as TimelineStages, p])
      else
        res.slice(-1)[0][1].push(message)
    }
    return res
  }, [messageHistory])

  const missingStages = useMemo(() => (
    timelineStages.filter(
      stage => !groupedMessages.some(([s]) => s === stage)
    )
  ), [groupedMessages])

  return (
    <Timeline
      color='blue.9'
      lineWidth={3}
      bulletSize={27}
      active={groupedMessages.length - 1}
      {...props}
    >
      {
        groupedMessages.map(([stage, lines], idx) => (
          <Timeline.Item key={stage} {...timelineItemProps?.[stage]}>
            {
              !lines?.length
                ? (
                  <Text fw='500' fz='h5'>{stage}</Text>
                )
                : (
                  <Accordion defaultValue={idx === groupedMessages.length - 1 ? stage : undefined} classNames={classes}>
                    <Accordion.Item value={stage}>
                      <Accordion.Control>
                        <Text fw='500' fz='h5'>{stage}</Text>
                      </Accordion.Control>
                      <Accordion.Panel>
                        {
                          lines.length > 0 &&
                          <Code block>
                            <ScrollArea
                              type='auto'
                              offsetScrollbars='x'
                              scrollbars='x'
                            >
                              {lines.join('\n')}
                            </ScrollArea>
                          </Code>
                        }
                      </Accordion.Panel>
                    </Accordion.Item>
                  </Accordion>)
            }
          </Timeline.Item>
        ))
      }

      {
        missingStages.map(stage => (
          <Timeline.Item key={stage} title={stage} {...timelineItemProps?.[stage]} />
        ))
      }
    </Timeline>
  )
}
