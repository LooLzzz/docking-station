import { apiRoutes } from '@/routes'
import { useFiltersStore } from '@/store'
import type {
  DockerContainer,
  DockerContainerResponse,
  DockerServiceUpdateRequest,
  DockerServiceUpdateWsMessage,
  DockerStack,
  DockerStackResponse,
} from '@/types'
import { escapeRegExp } from '@/utils'
import { notifications, useNotifications } from '@mantine/notifications'
import { UseQueryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import axios, { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAppSettings } from './appSettings'
import { parseDockerContainerDates, parseDockerStackDates } from './utils'

export interface StackServiceRefreshEventDetail {
  stackName: string
  serviceName: string
}

export interface StacksTaskCreateEventDetail {
  stackName: string
  serviceNames: string[]
}

export const useGetComposeService = <TData extends DockerContainer>(stackName: string, serviceName: string, options: Omit<Omit<UseQueryOptions<TData>, 'queryKey'>, 'queryKey'> = {}) => {
  const queryKey = ['stacks', stackName, serviceName]
  const client = useQueryClient()

  const { refetch, ...rest } = useQuery<TData>({
    queryKey,
    queryFn: async ({ queryKey, meta }) => {
      const isInvalidated = client.getQueryState(queryKey)?.isInvalidated
      const noCache = meta?.noCache || isInvalidated
      const { data } = await axios.get<DockerContainerResponse>(
        apiRoutes.getComposeService(stackName, serviceName),
        {
          params: noCache ? { no_cache: true } : undefined,
        },
      )
      const parsedData = parseDockerContainerDates(data) as TData

      client.setQueryData<DockerStack[]>(['stacks'], input => (
        (input ?? []).map(stack => (
          stack.name !== stackName
            ? stack
            : {
              ...stack,
              services: stack.services.map(service => (
                service.serviceName === serviceName
                  ? parsedData
                  : service
              ))
            }
        ))
      ))

      return parsedData
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: false,
    ...options,
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleStackServiceRefreshEvent = useCallback(
    (({ detail }: CustomEvent<StackServiceRefreshEventDetail>) => {
      if (
        detail.stackName === stackName
        && detail.serviceName === serviceName
      ) refetch()
    }) as EventListener, [refetch])

  useEffect(() => {
    document.addEventListener('stack-service-refresh', handleStackServiceRefreshEvent)
    return () => {
      document.removeEventListener('stack-service-refresh', handleStackServiceRefreshEvent)
    }
  }, [handleStackServiceRefreshEvent])

  return {
    refetch,
    ...rest
  }
}

export const useListComposeStacks = <TData extends DockerStack[]>(options: Omit<Omit<UseQueryOptions<TData>, 'queryKey'>, 'queryKey'> = {}) => {
  const queryKey = ['stacks']
  const client = useQueryClient()

  return useQuery<TData>({
    queryKey,
    queryFn: async ({ queryKey, meta }) => {
      const selfQueryState = client.getQueryState(queryKey)
      const noCache = selfQueryState?.data && (meta?.noCache || selfQueryState?.isInvalidated)
      const { data } = await axios.get<DockerStackResponse[]>(
        apiRoutes.listComposeStacks,
        {
          params: noCache ? { no_cache: true } : undefined,
        },
      )
      const stacks = data.map(parseDockerStackDates) as TData

      stacks.forEach(stack => {
        stack.services.forEach(service => {
          client.setQueryData(['stacks', service.stackName, service.serviceName], service)
        })
      })

      return stacks
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: false,
    ...options,
  })
}

export const useListComposeServicesFiltered = <TData extends DockerStack[]>(options: Omit<UseQueryOptions<TData>, 'queryKey'> = {}) => {
  const [
    maturedUpdatesOnly,
    searchValue,
    updatesOnly,
  ] = useFiltersStore((state) => [
    state.maturedUpdatesOnly,
    state.searchValue,
    state.updatesOnly,
  ])
  const { appSettings } = useAppSettings()
  const { data = [], ...rest } = useListComposeStacks(options)

  const services = useMemo(() => (
    data
      .flatMap(stack => stack.services)
      .sort((a, b) => (
        a.hasUpdates !== b.hasUpdates
          ? Number(b.hasUpdates) - Number(a.hasUpdates)
          : a.hasUpdates
            ? a.image.latestUpdate.getTime() - b.image.latestUpdate.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime()
      ))
      .filter(service => {
        let flag = true

        if (updatesOnly) {
          flag &&= service.hasUpdates
        }

        if (maturedUpdatesOnly) {
          if (!service?.hasUpdates || !appSettings?.server?.timeUntilUpdateIsMature)
            flag &&= false

          const latestUpdateTimestampSeconds = (
            service?.image?.latestUpdate
              ? (Date.now() - service?.image?.latestUpdate.getTime()) * 0.001
              : 0
          )
          flag &&= latestUpdateTimestampSeconds >= (appSettings?.server.timeUntilUpdateIsMature ?? 0)
        }

        if (searchValue) {
          flag &&= [
            service.stackName?.match(new RegExp(escapeRegExp(searchValue), 'i')),
            service.name.match(new RegExp(escapeRegExp(searchValue), 'i')),
          ].some(Boolean)
        }

        return flag
      })
  ), [data, updatesOnly, appSettings, searchValue, maturedUpdatesOnly])

  return {
    data: services,
    ...rest
  }
}

export const useGetComposeStack = <TData extends DockerStack>(stackName: string, options: Omit<UseQueryOptions<TData>, 'queryKey'> = {}) => {
  const queryKey = ['stacks', stackName]
  const client = useQueryClient()

  return useQuery<TData>({
    queryKey,
    queryFn: async ({ queryKey, meta }) => {
      const isInvalidated = client.getQueryState(queryKey)?.isInvalidated
      const noCache = meta?.noCache || isInvalidated
      const { data } = await axios.get<DockerStackResponse>(
        apiRoutes.getComposeStack(stackName),
        {
          params: noCache ? { no_cache: true } : undefined,
        }
      )
      const stack = parseDockerStackDates(data) as TData

      stack.services.forEach(service => {
        client.setQueryData(['stacks', stackName, service.serviceName], service)
      })

      return stack
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    retry: false,
    ...options,
  })
}

export const useCreateUpdateComposeStackTask = (options: DockerServiceUpdateRequest = {}) => {
  const queryClient = useQueryClient()

  const onError = (error: Error | AxiosError) => {
    if (
      axios.isAxiosError(error)
      && error.status === 404
    ) return // ignore 404 errors

    console.error(error)
    notifications.show({
      title: 'Unexpected error',
      message: error.message,
      color: 'red',
    })
  }

  const createTask = useCallback(async (stackName: string, serviceNames: string[]) => {
    const queryPartialKey = ['stacks', 'task', 'create', stackName]
    const queryKey = [...queryPartialKey, Object.fromEntries(serviceNames.map(x => [x, true]))]

    try {
      const { isInvalidated = true } = queryClient.getQueryState(queryPartialKey) ?? {}

      if (!isInvalidated) {
        return
      }

      await queryClient.fetchQuery({
        queryKey,
        retry: false,
        queryFn: async () => {
          const { data } = await axios.post(
            apiRoutes.createComposeBatchUpdateTask,
            {
              ...options,
              services: serviceNames.map(serviceName => (`${stackName}/${serviceName}`)),
            },
          )

          return data
        },
      })

      console.log('dispatchEvent', 'stacks-task-create', { stackName, serviceNames })
      document.dispatchEvent(
        new CustomEvent<StacksTaskCreateEventDetail>(
          'stacks-task-create',
          {
            detail: {
              stackName,
              serviceNames,
            },
          },
        )
      )

    } catch (error) {
      onError(error as Error)
    }
  }, [queryClient, options])

  return createTask
}

export const usePollUpdateComposeStackTask = <TData extends DockerServiceUpdateWsMessage>(stackName: string, serviceName: string) => {
  const stackServiceQueryKey = ['stacks', stackName, serviceName]
  const pollTaskQueryKey = ['stacks', 'task', 'poll', stackName, serviceName]
  const createTaskQueryKey = ['stacks', 'task', 'create', stackName, { [serviceName]: true }]
  const createTaskPartialQueryKey = ['stacks', 'task', 'create', stackName]

  const queryClient = useQueryClient()
  const notificationsState = useNotifications()
  const [enabled, setEnabled] = useState(false)
  const [messageHistory, setMessageHistory] = useState<TData[]>([])
  const { isInvalidated: isTaskInvalidated = true } = queryClient.getQueryState(createTaskQueryKey) ?? {}
  const isTaskRunning = !isTaskInvalidated

  const appendMessageHistory = useCallback((item: TData) => {
    setMessageHistory((prev) => [...prev, item])
  }, [setMessageHistory])
  const concatMessageHistory = useCallback((items: TData[]) => {
    setMessageHistory((prev) => [...prev, ...items])
  }, [setMessageHistory])
  const clearMessageHistory = useCallback(
    () => setMessageHistory([]),
    [setMessageHistory]
  )

  const lastMessage = useMemo(() =>
    messageHistory.length > 0
      ? messageHistory.at(-1)
      : undefined,
    [messageHistory]
  )

  const onSuccess = async () => {
    // force a no-cache refetch
    setEnabled(false)
    document.dispatchEvent(
      new CustomEvent<StackServiceRefreshEventDetail>('stack-service-refresh', {
        detail: { stackName, serviceName }
      })
    )

    for (const notification of notificationsState.notifications) {
      const notificationMessage = (
        typeof notification.message === 'string'
          ? notification.message
          : ''
      )

      if (notificationMessage.includes(stackName)) {
        return
      }
    }

    await queryClient.invalidateQueries({ queryKey: createTaskPartialQueryKey })
    notifications.show({
      title: `Stack Update Finished`,
      message: `'${stackName}' has been updated successfully`,
      color: 'teal',
    })
  }

  const onError = (error: Error | AxiosError) => {
    if (
      axios.isAxiosError(error)
      && error.status === 404
    ) return false // ignore 404 errors

    for (const notification of notificationsState.notifications) {
      const notificationMessage = (
        typeof notification.message === 'string'
          ? notification.message
          : ''
      )

      if (notificationMessage.includes(stackName)) {
        return false
      }
    }

    console.error(error)
    notifications.show({
      title: 'Unexpected error',
      message: `'${stackName}' has encountered an unexpected error`,
      color: 'red',
    })

    return false
  }

  const startPolling = useCallback(() => {
    setMessageHistory([{ stage: 'Connecting', message: null } as TData])
    setEnabled(true)
  }, [])

  const handleStacksTaskCreateEvent = useCallback(({ detail }: CustomEvent<StacksTaskCreateEventDetail>) => {
    if (
      detail.stackName === stackName
      && detail.serviceNames.includes(serviceName)
    ) startPolling()
  }, [stackName, serviceName, startPolling])

  useEffect(() => {
    if (isTaskRunning) {
      startPolling()
    }
  }, [isTaskRunning, startPolling])

  useEffect(() => {
    if (lastMessage?.stage.toLowerCase() === 'finished') {
      onSuccess()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage])

  useEffect(() => {
    document.addEventListener(
      'stacks-task-create',
      handleStacksTaskCreateEvent as EventListener,
    )
    return () => {
      document.removeEventListener(
        'stacks-task-create',
        handleStacksTaskCreateEvent as EventListener,
      )
    }
  }, [handleStacksTaskCreateEvent])

  const { } = useQuery({
    queryKey: pollTaskQueryKey,
    enabled: enabled,
    refetchInterval: 100,
    retry: false,
    throwOnError: onError,
    queryFn: async () => {
      const { data } = await axios.get<TData[]>(
        apiRoutes.pollUpdateComposeStackServiceTask(stackName, serviceName),
        {
          params: { offset: Math.max(0, messageHistory.length - 1) }
        }
      )
      concatMessageHistory(data)
      return data
    },
  })

  return {
    startPolling,
    messageHistory,
    lastMessage,
    isPolling: enabled,
  }
}

export const useUpdateComposeStackServices = <TData extends DockerServiceUpdateWsMessage>(stackName: string, serviceName: string, options: DockerServiceUpdateRequest = {}) => {
  const createTask = useCreateUpdateComposeStackTask(options)
  const { startPolling, ...rest } = usePollUpdateComposeStackTask<TData>(stackName, serviceName)

  return {
    ...rest,
    updateServices: async () => {
      await createTask(stackName, [serviceName])
      startPolling()
    },
  }
}
