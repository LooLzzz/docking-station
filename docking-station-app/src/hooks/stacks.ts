import { apiRoutes } from '@/routes'
import type {
  DockerContainer,
  DockerContainerResponse,
  DockerServiceUpdateRequest,
  DockerServiceUpdateResponse,
  DockerStack,
  DockerStackResponse
} from '@/types'
import { notifications } from '@mantine/notifications'
import axios from 'axios'
import { UseQueryOptions, useMutation, useQuery, useQueryClient } from 'react-query'
import { parseDockerContainerDates, parseDockerStackDates } from './utils'


export const useGetComposeService = <TData extends DockerContainer>(stackName: string, serviceName: string, options: UseQueryOptions<TData> = {}) => {
  const client = useQueryClient()

  return useQuery<TData>(
    ['stacks', stackName, serviceName],
    async ({ meta }) => {
      const noCache = meta?.noCache ?? false
      const { data } = await axios.get<DockerContainerResponse>(
        apiRoutes.getComposeService(stackName, serviceName),
        {
          headers: noCache ? { 'Cache-Control': 'no-cache' } : undefined,
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
    async ({ meta }) => {
      const noCache = meta?.noCache ?? false
      const { data } = await axios.get<DockerStackResponse[]>(
        apiRoutes.listComposeStacks,
        {
          headers: noCache ? { 'Cache-Control': 'no-cache' } : undefined,
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
    async ({ meta }) => {
      const noCache = meta?.noCache ?? false
      const { data } = await axios.get<DockerStackResponse>(
        apiRoutes.getComposeStack(stackName),
        {
          headers: noCache ? { 'Cache-Control': 'no-cache' } : undefined,
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
        onSuccess: () => {
          queryClient.invalidateQueries(['stacks', stackName, serviceName])
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
