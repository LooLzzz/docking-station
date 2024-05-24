import { create } from 'zustand'


interface FiltersStoreState {
  searchValue: string
  updatesOnly: boolean
}

interface FiltersStoreActions {
  resetFilters: () => void
  setFilters: (filters: Partial<FiltersStore>) => void
  setSearchValue(searchValue: FiltersStoreState['searchValue']): void
  toggleUpdatesOnlyFilter: () => void
}

export type FiltersStore = FiltersStoreState & FiltersStoreActions

export const useFiltersStore = create<FiltersStore>()(
  (set) => ({

    // ## State ##
    searchValue: '',
    updatesOnly: false,


    // ## Actions ##
    resetFilters: () => set({
      searchValue: '',
      updatesOnly: false,
    }),

    setSearchValue: (searchValue) => set({ searchValue }),

    setFilters: (filters: Partial<FiltersStore>) => set(filters),

    toggleUpdatesOnlyFilter: () => set(
      (state) => ({
        updatesOnly: !state.updatesOnly,
      })
    ),
  })
)
