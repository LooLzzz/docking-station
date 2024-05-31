'use client'

import { useFiltersStore } from '@/store'
import { ActionIcon, Center, Popover, TextInput, rem, useComputedColorScheme } from '@mantine/core'
import { useDebouncedState, useWindowEvent } from '@mantine/hooks'
import { IconFilter, IconFilterFilled, IconSearch } from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import FiltersPane from './FiltersPane'

export default function SearchBar() {
  const textInputRef = useRef<HTMLInputElement>(null)
  const colorScheme = useComputedColorScheme()
  const { searchValue, updatesOnly, setSearchValue } = useFiltersStore()
  const [searchValueDebounced, setSearchValueDebounced] = useDebouncedState(searchValue, 150)

  const ComputedIconFilter = useMemo(() => (
    (searchValue || updatesOnly)
      ? IconFilterFilled
      : IconFilter
  ), [searchValue, updatesOnly])

  const windowKeydownHandler = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      textInputRef.current?.blur()
    }
    else if (event.key === '/') {
      textInputRef.current?.focus()
      event.preventDefault()
    }
  }, [textInputRef?.current])

  useEffect(() => {
    setSearchValue(searchValueDebounced)
  }, [searchValueDebounced])

  useWindowEvent('keydown', windowKeydownHandler)

  return (
    <Center w='100%'>
      <TextInput
        ref={textInputRef}
        radius='xl'
        size='md'
        defaultValue={searchValue}
        placeholder='Search containers'
        rightSectionWidth={42}
        maw={rem(600)}
        w='100%'

        onChange={(event) => setSearchValueDebounced(event.currentTarget.value)}

        leftSection={
          <IconSearch
            stroke={1.5}
            style={{
              width: rem(18),
              height: rem(18)
            }}
          />}

        rightSection={
          <Popover withArrow arrowSize={20} shadow='md' radius='lg'>
            <Popover.Target>
              <ActionIcon
                size={32}
                radius='xl'
                variant='transparent'
                color={colorScheme === 'dark' ? 'white' : 'dark'}
              >
                <ComputedIconFilter
                  stroke={1.5}
                  style={{
                    width: rem(18),
                    height: rem(18)
                  }}
                />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <FiltersPane />
            </Popover.Dropdown>
          </Popover>
        }
      />
    </Center>
  )
}
