import { apiRoutes } from '@/routes'
import type {
  DockerContainer,
  DockerContainerResponse,
  DockerServiceUpdateRequest,
  DockerServiceUpdateResponse,
  DockerServiceUpdateWsMessage,
  DockerStack,
  DockerStackResponse,
} from '@/types'
import { notifications } from '@mantine/notifications'
import axios, { AxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { UseQueryOptions, useMutation, useQuery, useQueryClient } from 'react-query'
import useWebSocket from 'react-use-websocket'
import { parseDockerContainerDates, parseDockerStackDates } from './utils'


export const useGetComposeService = <TData extends DockerContainer>(stackName: string, serviceName: string, options: UseQueryOptions<TData> = {}) => {
  const client = useQueryClient()

  return useQuery<TData>(
    ['stacks', stackName, serviceName],
    async ({ queryKey, meta }) => {
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
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      ...options,
    }
  )
}

export const useListComposeStacks = <TData extends DockerStack[]>(options: UseQueryOptions<TData> = {}) => {
  const client = useQueryClient()

  return useQuery<TData>(
    ['stacks'],
    async ({ queryKey, meta }) => {
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
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      ...options,
    }
  )
}

export const useGetComposeStack = <TData extends DockerStack>(stackName: string, options: UseQueryOptions<TData> = {}) => {
  const client = useQueryClient()

  return useQuery<TData>(
    ['stacks', stackName],
    async ({ queryKey, meta }) => {
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
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      ...options,
    }
  )
}

export const useUpdateComposeStackService = <TData extends DockerServiceUpdateWsMessage>(stackName: string, serviceName: string, options: DockerServiceUpdateRequest = {}) => {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(false)
  const [messageHistory, setMessageHistory] = useState<TData[]>([])

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

  const onSuccess = async () => {
    // force a no-cache refetch
    await queryClient.cancelQueries(['stacks', 'task', stackName, serviceName])
    await queryClient.invalidateQueries(['stacks', stackName, serviceName])
    await queryClient.refetchQueries(['stacks', stackName, serviceName])

    setEnabled(false)

    notifications.show({
      title: 'Service updated',
      message: 'The service has been updated successfully',
      color: 'teal',
    })
  }

  const onError = (error: Error | AxiosError) => {
    if (
      axios.isAxiosError(error)
      && error.status === 404
    ) return // ignore 404 errors

    notifications.show({
      title: 'Unexpected error',
      message: error.message,
      color: 'red',
    })
  }

  const lastMessage = useMemo(() =>
    messageHistory.length > 0
      ? messageHistory[messageHistory.length - 1]
      : undefined,
    [messageHistory]
  )

  useEffect(() => {
    if (lastMessage) {
      console.log(lastMessage)

      if (lastMessage.stage.toLowerCase() === 'finished') {
        onSuccess()
      }
    }
  }, [lastMessage])

  const mutate = async () => {
    queryClient.invalidateQueries(['stacks', 'task', stackName, serviceName])
    setMessageHistory([{ stage: 'Connecting', message: null } as any])
    setEnabled(true)
  }

  const { } = useQuery(
    ['stacks', 'task', stackName, serviceName, 'create'],
    {
      enabled,
      staleTime: Infinity,
      retry: false,
      onError,
      queryFn: async () => {
        const { data } = await axios.post(
          apiRoutes.createUpdateComposeStackServiceTask(stackName, serviceName),
          options,
        )
        return data
      },
    },
  )

  const { isLoading: isPolling } = useQuery(
    ['stacks', 'task', stackName, serviceName, 'poll'],
    {
      enabled,
      refetchInterval: 100,
      retry: false,
      onError,
      queryFn: async () => {
        const { data } = await axios.get<TData[]>(
          apiRoutes.pollUpdateComposeStackServiceTask(stackName, serviceName),
        )
        concatMessageHistory(data)
        return data
      },
    },
  )

  return {
    messageHistory,
    lastMessage,
    isPolling,
    isMutating: enabled,
    mutate,
  }
}
