import { create } from 'zustand'
import { persist } from 'zustand/middleware'


export interface AppSettingsStore {
  lessAnimations: boolean
  rollingAverageEnabled: boolean
  rollingAverageWindow: number

  setRollingAverageWindow: (value: number) => void
  toggleRollingAverage: (value?: boolean) => void
  toggleLessAnimations: (value?: boolean) => void
}

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    (set) => ({
      lessAnimations: false,
      rollingAverageEnabled: false,
      rollingAverageWindow: 60,

      setRollingAverageWindow: (value: number) => set({ rollingAverageWindow: value }),
      toggleRollingAverage: (value?: boolean) => set((state) => ({ rollingAverageEnabled: value ?? !state.rollingAverageEnabled })),
      toggleLessAnimations: (value?: boolean) => set((state) => ({ lessAnimations: value ?? !state.lessAnimations })),
    }),
    {
      name: 'app-settings',
    }
  )
)
