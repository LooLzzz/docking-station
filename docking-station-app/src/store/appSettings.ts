import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ColorSchemaType = 'light' | 'dark'

interface AppSettingsStoreState {
  colorSchema: ColorSchemaType
}

interface AppSettingsStoreActions {
  toggleColorScheme: () => void
}

export type AppSettingsStore = AppSettingsStoreState & AppSettingsStoreActions

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    (set) => ({

      colorSchema: 'dark',

      toggleColorScheme: () => set(
        (state) => ({
          colorSchema: (state.colorSchema === 'light' ? 'dark' : 'light') as ColorSchemaType
        })
      ),

    }),

    { name: 'appSettings' }
  )
)
