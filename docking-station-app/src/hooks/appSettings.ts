import { apiRoutes } from '@/routes'
import type { AppSettings } from '@/types'
import axios from 'axios'
import { UseQueryOptions, useQuery } from 'react-query'


export const useAppSettings = <TData extends AppSettings>(options: UseQueryOptions<TData> = {}) => {
  return useQuery<TData>(
    ['appSettings'],
    async ({ queryKey }) => {
      const { data } = await axios.get<TData>(apiRoutes.getAppSettings)
      return data
    },
    {
      initialData: {} as TData,
      ...options,
    }
  )
}
