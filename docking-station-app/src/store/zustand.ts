import { create } from 'zustand'
import { persist } from 'zustand/middleware'


export interface AppSettingsStore {

}

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    (set) => ({
    }),
    {
      name: 'app-settings',
    }
  )
)
