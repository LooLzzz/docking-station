import { create } from 'zustand'
import computed from 'zustand-computed'


interface FiltersStoreState {
  maturedUpdatesOnly: boolean
  searchValue: string
  updatesOnly: boolean
  selectedServices: Set<string>
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
  addSelectedService: (serviceName: string) => void
  deleteSelectedService: (serviceName: string) => void
  clearSelectedServices: () => void
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
      selectedServices: new Set(),


      // ## Actions ##
      resetFilters: () => set({
        searchValue: '',
        updatesOnly: false,
      }),

      setSearchValue: (searchValue) => set({ searchValue }),

      setFilters: (filters: Partial<FiltersStoreComputed>) => set(filters),

      toggleMaturedUpdatesOnlyFilter: () => set(
        ({ maturedUpdatesOnly }) => ({
          maturedUpdatesOnly: !maturedUpdatesOnly,
        })
      ),

      toggleUpdatesOnlyFilter: () => set(
        ({ updatesOnly }) => ({
          updatesOnly: !updatesOnly,
        })
      ),

      addSelectedService: (serviceName) => set(
        ({ selectedServices }) => {
          selectedServices.add(serviceName)
          return { selectedServices }
        }
      ),

      deleteSelectedService: (serviceName) => set(
        ({ selectedServices }) => {
          selectedServices.delete(serviceName)
          return { selectedServices }
        }
      ),

      clearSelectedServices: () => set(
        ({ selectedServices }) => {
          selectedServices.clear()
          return { selectedServices }
        }
      ),
    }),
    computeState,
  ),
)
