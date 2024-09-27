import { apiRoutes } from '@/routes'
import type { AppSettings } from '@/types'
import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import axios from 'axios'


export const useAppSettings = <TData extends AppSettings>(options: Omit<UseQueryOptions<TData>, 'queryKey'> = {}) => {
  const { data, ...rest } = useQuery<TData>({
    queryKey: ['appSettings'],
    queryFn: async () => {
      const { data } = await axios.get<TData>(apiRoutes.getAppSettings)
      return data
    },
    initialData: {} as TData,
    refetchOnWindowFocus: false,
    ...options,
  })

  return {
    appSettings: data,
    ...rest,
  }
}
