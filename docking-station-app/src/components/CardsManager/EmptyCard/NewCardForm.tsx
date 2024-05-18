import { useCreateMonitoredWebsite } from '@/hooks/monitoring'
import type { MonitoredWebsiteCreate } from '@/types'
import { Button, FocusTrap, Group, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { useEffect } from 'react'

const urlRegex = /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/

export default function NewCardForm() {
  const { mutate } = useCreateMonitoredWebsite()
  const [focusActive, { open: activeFocus }] = useDisclosure(false)

  const form = useForm({
    initialValues: {
      url: '',
      friendlyName: '',
      isActive: true,
    },

    validate: {
      url: (value: string) => {
        if (!value) {
          return 'URL is required'
        }
        return urlRegex.test(value) ? undefined : 'Invalid URL'
      },
      friendlyName: (value: string) => {
        if (!value) {
          return 'Friendly name is required'
        }
      },
    },
  })

  const handleSubmit = (values: MonitoredWebsiteCreate) => {
    mutate(values)
    modals.closeAll()
  }

  useEffect(() => {
    activeFocus()
  }, [])

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <FocusTrap active={focusActive}>
        <Stack>
          <TextInput
            data-autofocus
            placeholder='URL'
            {...form.getInputProps('url')}
          />
          <TextInput
            placeholder='Friendly Name'
            {...form.getInputProps('friendlyName')}
          />
          <Group justify='flex-end' mt='md'>
            <Button variant='default' onClick={() => modals.closeAll()}>Cancel</Button>
            <Button type='submit'>Submit</Button>
          </Group>
        </Stack>
      </FocusTrap>
    </form >
  )
}
