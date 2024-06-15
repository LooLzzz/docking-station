import { create } from 'zustand'
import computed from 'zustand-computed'


interface FiltersStoreState {
  maturedUpdatesOnly: boolean
  searchValue: string
  updatesOnly: boolean
}

interface FiltersStoreComputedState {
  isFiltersActive: boolean
}

interface FiltersStoreActions {
  resetFilters: () => void
  setFilters: (filters: Partial<FiltersStoreState>) => void
  setSearchValue(searchValue: FiltersStoreState['searchValue']): void
  toggleMaturedUpdatesOnlyFilter: () => void
  toggleUpdatesOnlyFilter: () => void
}

export type FiltersStore = FiltersStoreState & FiltersStoreActions
export type FiltersStoreComputed = FiltersStore & FiltersStoreComputedState

const computeState = (state: FiltersStore): FiltersStoreComputedState => ({
  isFiltersActive: (
    !!state.searchValue
    || state.updatesOnly
    || state.maturedUpdatesOnly
  ),
})

export const useFiltersStore = create<FiltersStore>()(
  computed(
    (set) => ({

      // ## State ##
      maturedUpdatesOnly: false,
      searchValue: '',
      updatesOnly: false,


      // ## Actions ##
      resetFilters: () => set({
        searchValue: '',
        updatesOnly: false,
      }),

      setSearchValue: (searchValue) => set({ searchValue }),

      setFilters: (filters: Partial<FiltersStoreComputed>) => set(filters),

      toggleMaturedUpdatesOnlyFilter: () => set(
        (state) => ({
          maturedUpdatesOnly: !state.maturedUpdatesOnly,
        })
      ),

      toggleUpdatesOnlyFilter: () => set(
        (state) => ({
          updatesOnly: !state.updatesOnly,
        })
      ),
    }),
    computeState,
  ),
)
