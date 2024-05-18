'use client'

import { Input, Text } from '@mantine/core'
import { useClickOutside, useDisclosure, useEventListener } from '@mantine/hooks'
import { useCallback, useState } from 'react'
import classes from './EditableText.module.css'

interface EditableTextProps {
  initialValue: string
  onSave?: (value: string) => void
}

export default function EditableText({ initialValue, onSave }: EditableTextProps) {
  const [value, setValue] = useState(initialValue)
  const [editable, { open: openEditable, close: closeEditable }] = useDisclosure(false)

  const handleSave = useCallback(() => {
    onSave?.(value)
    closeEditable()
  }, [value, onSave, closeEditable])

  const handleCancel = useCallback(() => {
    setValue(initialValue)
    closeEditable()
  }, [setValue, initialValue, closeEditable])

  const handleInputKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        handleSave()
        break

      case 'Escape':
        handleCancel()
        break
    }
  }, [handleCancel, handleSave])

  const wrapperRef = useClickOutside(handleCancel)
  const inputRef = useEventListener('keydown', handleInputKeyDown)

  return (
    <span ref={wrapperRef}>
      {
        editable
          ? (
            <Input
              autoFocus
              ref={inputRef}
              w={110}
              size='xs'
              variant='unstyled'
              defaultValue={initialValue}
              onChange={(e) => setValue(e.currentTarget.value)}
              onBlur={handleSave}
              classNames={{ input: classes.input }}
            />
          ) : (
            <Text onClick={openEditable} className={classes.text}>
              {value}
            </Text>
          )
      }
    </span>
  )
}
