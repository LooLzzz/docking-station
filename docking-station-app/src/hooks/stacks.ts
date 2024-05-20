import { apiRoutes } from '@/routes'
import type {
  DockerContainer,
  DockerContainerResponse,
  DockerStack,
  DockerStackResponse,
  DockerStackUpdateRequest
} from '@/types'
import axios from 'axios'
import { UseQueryOptions, useMutation, useQuery, useQueryClient } from 'react-query'
import { parseDockerContainerDates, parseDockerStackDates } from './utils'


export const useGetComposeService = <TData extends DockerContainer>(stackName: string, serviceName: string, options: UseQueryOptions<TData> = {}) => {
  const client = useQueryClient()

  return useQuery<TData>(
    ['stacks', stackName, serviceName],
    async () => {
      const { data } = await axios.get<DockerContainerResponse>(apiRoutes.getComposeService(stackName, serviceName))
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
      ...options,
    }
  )
}

export const useListComposeStacks = <TData extends DockerStack[]>(options: UseQueryOptions<TData> = {}) => {
  const client = useQueryClient()

  return useQuery<TData>(
    ['stacks'],
    async () => {
      const { data } = await axios.get<DockerStackResponse[]>(apiRoutes.listComposeStacks)
      const stacks = data.map(parseDockerStackDates) as TData

      stacks.forEach(stack => {
        stack.services.forEach(service => {
          client.setQueryData(['stacks', service.stackName, service.serviceName], service)
        })
      })

      return stacks
    },
    {
      ...options
    }
  )
}

export const useGetComposeStack = <TData extends DockerStack>(stackName: string, options: UseQueryOptions<TData> = {}) => {
  const client = useQueryClient()

  return useQuery<TData>(
    ['stacks', stackName],
    async () => {
      const { data } = await axios.get<DockerStackResponse>(apiRoutes.getComposeStack(stackName))
      const stack = parseDockerStackDates(data) as TData

      stack.services.forEach(service => {
        client.setQueryData(['stacks', stackName, service.serviceName], service)
      })

      return stack
    },
    {
      ...options
    }
  )
}

export const useUpdateComposeStack = <TData extends DockerStack, TVar extends DockerStackUpdateRequest>() => {
  const queryClient = useQueryClient()

  return useMutation<TData, unknown, TVar>(
    async (options) => {
      const { stack, ...rest } = options
      const resp = await axios.post(
        apiRoutes.updateComposeStack(stack),
        rest
      )
      return resp.data
    },

    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['stacks', data.name])
      },
    }
  )
}

export const useUpdateComposeStackService = <TData extends DockerStack, TVar extends DockerStackUpdateRequest>() => {
  const queryClient = useQueryClient()

  return useMutation<TData, unknown, TVar>(
    async (vars) => {
      const { stack, ...rest } = vars
      const resp = await axios.post<TData>(
        apiRoutes.updateComposeStack(stack),
        rest
      )
      return resp.data
    },

    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['stacks', data.name])
      },
    }
  )
}
