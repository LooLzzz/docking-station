'use client'

import { useListComposeServicesFiltered } from '@/hooks/stacks'
import { useFiltersStore } from '@/store'
import { ActionIcon, Group, Popover, TextInput, rem, useComputedColorScheme } from '@mantine/core'
import { useDebouncedState, useWindowEvent } from '@mantine/hooks'
import { IconFilter, IconFilterFilled, IconSearch, IconSquare, IconSquareCheckFilled, IconSquareMinusFilled } from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import FiltersPane from './FiltersPane'


export default function SearchBar() {
  const [
    searchValue,
    maturedUpdatesOnly,
    updatesOnly,
    isFiltersActive,
    selectedServices,
    setSearchValue,
    addSelectedService,
    clearSelectedServices,
  ] = useFiltersStore(state => [
    state.searchValue,
    state.maturedUpdatesOnly,
    state.updatesOnly,
    state.isFiltersActive,
    state.selectedServices,
    state.setSearchValue,
    state.addSelectedService,
    state.clearSelectedServices,
  ])
  const textInputRef = useRef<HTMLInputElement>(null)
  const colorScheme = useComputedColorScheme()
  const [searchValueDebounced, setSearchValueDebounced] = useDebouncedState(searchValue, 150)
  const { data: filteredServices, isFetching } = useListComposeServicesFiltered({ enabled: false })

  const ComputedIconFilter = useMemo(() => (
    isFiltersActive
      ? IconFilterFilled
      : IconFilter
  ), [isFiltersActive])

  const windowKeydownHandler = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      textInputRef.current?.blur()
    }
    else if (event.key === '/') {
      textInputRef.current?.focus()
      event.preventDefault()
    }
  }, [textInputRef])

  useEffect(() => {
    clearSelectedServices()
  }, [searchValue, maturedUpdatesOnly, updatesOnly, clearSelectedServices])

  useEffect(() => {
    setSearchValue(searchValueDebounced)
  }, [searchValueDebounced, setSearchValue])

  useWindowEvent('keydown', windowKeydownHandler)

  return (
    <Group gap='md' w='100%' justify='center' wrap='nowrap'>
      <TextInput
        ref={textInputRef}
        radius='xl'
        size='md'
        defaultValue={searchValue}
        placeholder='Press / to search...'
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
          <Popover withArrow shadow='md' radius='lg'>
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
            <Popover.Dropdown
              p={5}
              bg={colorScheme === 'dark' ? '#353535' : undefined}
            >
              <FiltersPane />
            </Popover.Dropdown>
          </Popover>
        }
      />

      <ActionIcon
        disabled={filteredServices.length === 0 || isFetching}
        variant='transparent'
        size='sm'
        onClick={() => {
          selectedServices.size === filteredServices.length
            ? clearSelectedServices()
            : filteredServices.forEach(({ stackName, serviceName }) =>
              addSelectedService(`${stackName}/${serviceName}`)
            )
        }}
        c={
          filteredServices.length === 0 || isFetching
            ? (colorScheme == 'dark' ? 'gray.7' : 'gray.4')
            : filteredServices.length && selectedServices.size === filteredServices.length
              ? undefined
              : (colorScheme == 'dark' ? 'gray.4' : 'gray.7')
        }
      >
        {
          !filteredServices.length || !selectedServices.size
            ? <IconSquare />
            : selectedServices.size === filteredServices.length
              ? <IconSquareCheckFilled />
              : <IconSquareMinusFilled />
        }
      </ActionIcon>
    </Group>
  )
}
