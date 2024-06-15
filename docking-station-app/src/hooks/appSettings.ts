import { apiRoutes } from '@/routes'
import type { AppSettings } from '@/types'
import axios from 'axios'
import { UseQueryOptions, useQuery } from 'react-query'


export const useAppSettings = <TData extends AppSettings>(options: UseQueryOptions<TData> = {}) => {
  const { data, ...rest } = useQuery<TData>(
    ['appSettings'],
    async ({ queryKey }) => {
      const { data } = await axios.get<TData>(apiRoutes.getAppSettings)
      return data
    },
    {
      initialData: {} as TData,
      refetchOnWindowFocus: false,
      ...options,
    }
  )

  return {
    appSettings: data,
    ...rest,
  }
}
