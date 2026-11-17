/**
 * UI 상태 훅 (선택된 구 / 필터 / 찜하기).
 *
 * 세 훅 모두 앱 전역에서 공유되는 작은 외부 스토어를 `useSyncExternalStore` 로 구독한다.
 * 따라서 지도, 필터 패널, 랭킹 목록처럼 서로 다른 컴포넌트에서 각각 훅을 호출해도
 * 같은 상태를 보고 같은 값으로 갱신된다(별도 Context 없이 동작).
 *
 * - 선택된 구·필터: 새로고침하면 초기화되는 메모리 상태
 * - 찜하기: localStorage 에 저장/복원 (파싱 실패 시 빈 배열로 안전하게 폴백)
 */

import { useCallback, useSyncExternalStore } from 'react'
import { DEFAULT_FILTERS } from '../lib/ramenRepository'
import type { RamenFilters } from '../types/ramen'

/** 아주 작은 외부 스토어 (구독/스냅샷/갱신) */
interface Store<T> {
  getSnapshot: () => T
  subscribe: (listener: () => void) => () => void
  setValue: (next: T) => void
}

function createStore<T>(initialValue: T): Store<T> {
  let value = initialValue
  const listeners = new Set<() => void>()

  return {
    getSnapshot: () => value,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setValue: (next) => {
      if (Object.is(next, value)) return
      value = next
      listeners.forEach((listener) => listener())
    },
  }
}

/* ------------------------------------------------------------------ */
/* 1. 선택된 구                                                        */
/* ------------------------------------------------------------------ */

const wardStore = createStore<string | null>(null)

export interface WardSelection {
  selectedWard: string | null
  selectWard: (id: string | null) => void
}

/** 지도에서 선택된 구 slug. `null` 이면 소개(홈) 화면 상태. */
export function useWardSelection(): WardSelection {
  const selectedWard = useSyncExternalStore(
    wardStore.subscribe,
    wardStore.getSnapshot,
    wardStore.getSnapshot,
  )

  const selectWard = useCallback((id: string | null) => {
    wardStore.setValue(id)
  }, [])

  return { selectedWard, selectWard }
}

/* ------------------------------------------------------------------ */
/* 2. 육수 / 매운맛 / 정렬 필터                                        */
/* ------------------------------------------------------------------ */

const filterStore = createStore<RamenFilters>({ ...DEFAULT_FILTERS })

export interface RamenFilterState {
  filters: RamenFilters
  setFilter: <K extends keyof RamenFilters>(key: K, value: RamenFilters[K]) => void
  resetFilters: () => void
}

/** 랭킹 필터 상태. `filterRamens()` 에 그대로 넘겨 사용한다. */
export function useRamenFilters(): RamenFilterState {
  const filters = useSyncExternalStore(
    filterStore.subscribe,
    filterStore.getSnapshot,
    filterStore.getSnapshot,
  )

  const setFilter = useCallback(
    <K extends keyof RamenFilters>(key: K, value: RamenFilters[K]) => {
      const next: RamenFilters = { ...filterStore.getSnapshot() }
      next[key] = value
      filterStore.setValue(next)
    },
    [],
  )

  const resetFilters = useCallback(() => {
    filterStore.setValue({ ...DEFAULT_FILTERS })
  }, [])

  return { filters, setFilter, resetFilters }
}

/* ------------------------------------------------------------------ */
/* 3. 찜하기 (localStorage 영속)                                       */
/* ------------------------------------------------------------------ */

const FAVORITES_STORAGE_KEY = 'osakaram:favorites'

/** localStorage 에서 찜 목록을 안전하게 읽는다. 실패/손상 시 빈 배열. */
function readFavorites(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    // JSON 손상, 저장소 접근 차단(사생활 보호 모드 등) 모두 빈 목록으로 처리
    return []
  }
}

/** localStorage 에 저장. 용량 초과/차단되어도 UI 동작은 계속되도록 조용히 무시. */
function writeFavorites(items: string[]): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // 저장 실패는 치명적이지 않으므로 무시 (메모리 상태는 유지)
  }
}

const favoritesListeners = new Set<() => void>()
let favoritesSnapshot: string[] = readFavorites()

function emitFavoritesChange(): void {
  favoritesListeners.forEach((listener) => listener())
}

function subscribeFavorites(listener: () => void): () => void {
  favoritesListeners.add(listener)
  return () => {
    favoritesListeners.delete(listener)
  }
}

function getFavoritesSnapshot(): string[] {
  return favoritesSnapshot
}

function toggleFavoriteInternal(id: string): void {
  favoritesSnapshot = favoritesSnapshot.includes(id)
    ? favoritesSnapshot.filter((shopId) => shopId !== id)
    : [...favoritesSnapshot, id]

  writeFavorites(favoritesSnapshot)
  emitFavoritesChange()
}

// 다른 탭에서 찜 목록이 바뀌면 현재 탭도 동기화한다.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== FAVORITES_STORAGE_KEY) return
    favoritesSnapshot = readFavorites()
    emitFavoritesChange()
  })
}

export interface FavoritesState {
  favorites: string[]
  toggleFavorite: (id: string) => void
}

/** 찜한 상점 id 목록. localStorage 에 저장되어 새로고침 후에도 유지된다. */
export function useFavorites(): FavoritesState {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    getFavoritesSnapshot,
  )

  const toggleFavorite = useCallback((id: string) => {
    toggleFavoriteInternal(id)
  }, [])

  return { favorites, toggleFavorite }
}
