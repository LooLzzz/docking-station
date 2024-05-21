import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'


interface AppSettingsStoreState {
  filters: {
    serviceName: string | null
    stackName: string | null
    updatesOnly: boolean
  }
}

interface AppSettingsStoreActions {
  clearFilters: () => void
  setFilters: (filters: Partial<AppSettingsStore['filters']>) => void
  toggleUpdatesOnlyFilter: () => void
}

export type AppSettingsStore = AppSettingsStoreState & AppSettingsStoreActions

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    immer((set) => ({
      filters: {
        serviceName: null,
        stackName: null,
        updatesOnly: false,
      },

      clearFilters: () => {
        set((state) => {
          state.filters = {
            serviceName: null,
            stackName: null,
            updatesOnly: false,
          }
        })
      },

      setFilters: (filters: Partial<AppSettingsStore['filters']>) => {
        set((state) => {
          state.filters = {
            ...state.filters,
            ...filters,
          }
        })
      },

      toggleUpdatesOnlyFilter: () => {
        set((state) => {
          state.filters.updatesOnly = !state.filters.updatesOnly
        })
      },

    })),

    {
      name: 'app-settings',
    }
  )
)
