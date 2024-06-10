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
import axios from 'axios'
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
      ...options,
    }
  )
}

export const useUpdateComposeStackService = (
  <
    TData extends DockerServiceUpdateResponse,
    TVar extends DockerServiceUpdateRequest,
  >(
    stackName: string,
    serviceName: string,
  ) => {

    const queryClient = useQueryClient()

    return useMutation<TData, Error, TVar>(
      async (vars) => {
        const { data: { output, success } } = await axios.post<TData>(
          apiRoutes.updateComposeStackService(stackName, serviceName),
          vars
        )

        if (!success)
          throw new Error(output.join('\n'))

        return { output, success } as TData
      },

      {
        mutationKey: ['stacks', stackName, serviceName],
        onSuccess: async () => {
          // force a no-cache refetch
          await queryClient.invalidateQueries(['stacks', stackName, serviceName])
          await queryClient.refetchQueries(['stacks', stackName, serviceName])

          notifications.show({
            title: 'Service updated',
            message: 'The service has been updated successfully',
            color: 'teal',
          })
        },

        onError(error) {
          notifications.show({
            title: 'Service update failed',
            message: error.message,
            color: 'red',
          })
        },
      }
    )
  }
)

export const useUpdateComposeStackServiceWS = <T extends DockerServiceUpdateWsMessage>(stackName: string, serviceName: string, updateRequest: DockerServiceUpdateRequest = {}) => {
  const queryClient = useQueryClient()
  const serverPort = process.env.SERVER_PORT ?? 3001
  const [connect, setConnect] = useState(false)
  const [messageHistory, setMessageHistory] = useState<T[]>([])
  const [isMutating, setIsMutating] = useState(false)

  const appendMessageHistory = useCallback((item: T) => {
    setMessageHistory((prev) => [...prev, item])
  }, [setMessageHistory])
  const clearMessageHistory = useCallback(
    () => setMessageHistory([]),
    [setMessageHistory]
  )

  const onSuccess = async () => {
    // force a no-cache refetch
    await queryClient.invalidateQueries(['stacks', stackName, serviceName])
    await queryClient.refetchQueries(['stacks', stackName, serviceName])

    notifications.show({
      title: 'Service updated',
      message: 'The service has been updated successfully',
      color: 'teal',
    })
  }

  const onError = ({ reason, code }: WebSocketEventMap['close']) => {
    notifications.show({
      title: 'Service update failed',
      message: `WebSocket closed unexpectedly: ${reason} (${code})`,
      color: 'red',
    })
  }

  const ws = useWebSocket(
    `ws://localhost:${serverPort}/${apiRoutes.updateComposeStackService(stackName, serviceName)}/ws`,
    {
      queryParams: updateRequest as {},
      shouldReconnect: () => false,
      onMessage: (event) => appendMessageHistory(JSON.parse(event.data)),
      onClose: (event) => event.code !== 1000 && onError(event)
    },
    connect,
  )

  useEffect(() => {
    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        appendMessageHistory({ stage: 'Connecting' } as T)

      case WebSocket.OPEN:
        setIsMutating(true)
        ws.sendJsonMessage(updateRequest ?? {})
        break

      case WebSocket.CLOSED:
        setConnect(false)
        setTimeout(() => {
          onSuccess()
          clearMessageHistory()
          setIsMutating(false)
        }, 750)
        break
    }
  }, [ws.readyState])

  const lastMessage = useMemo(() =>
    messageHistory.length > 0
      ? messageHistory[messageHistory.length - 1]
      : undefined,
    [messageHistory]
  )

  useEffect(() => {
    if (lastMessage) {
      console.log(lastMessage)
    }
  }, [lastMessage])

  return {
    // ws,
    readyState: ws.readyState,
    getWebSocket: ws.getWebSocket,
    messageHistory,
    lastMessage,
    isMutating,
    mutate: () => setConnect(true),
  }
}
