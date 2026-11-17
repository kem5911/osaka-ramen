import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Broth, RamenFilters, RamenShop, RamenSort } from '../types/ramen'

export const BROTH_LABELS: Record<Broth, string> = {
  tonkotsu: '돈코츠',
  shoyu: '쇼유',
  miso: '미소',
  shio: '시오',
  spicy: '매운맛',
}

export const DEFAULT_FILTERS: RamenFilters = {
  broth: 'all',
  spice: 'all',
  sort: 'rating',
}

function byRating(a: RamenShop, b: RamenShop): number {
  return b.rating - a.rating || (b.reviewCount || 0) - (a.reviewCount || 0)
}

function sortRamens(items: RamenShop[], sort: RamenSort): RamenShop[] {
  const copy = [...items]
  switch (sort) {
    case 'reviews': return copy.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || byRating(a, b))
    case 'rating': default: return copy.sort(byRating)
  }
}

// ⭐ 파이어베이스 DB가 변할 때마다 즉시 화면을 새로고침 해주는 실시간 감지 함수
export function subscribeToRamens(
  callback: (shops: RamenShop[]) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, 'ramen_shops'),
    (snapshot) => {
      const shops = snapshot.docs.map(doc => doc.data() as RamenShop)
      callback(shops.sort(byRating))
    },
    (error) => {
      console.error('Firestore 구독 실패:', error)
      onError?.(error)
    },
  )
}

export function filterRamens(items: RamenShop[], filters: RamenFilters): RamenShop[] {
  const filtered = items.filter((shop) => {
    if (filters.broth !== 'all' && shop.broth !== filters.broth) return false
    if (filters.spice !== 'all' && shop.spice !== Number(filters.spice)) return false
    return true
  })
  return sortRamens(filtered, filters.sort)
}

export const RANK_LIMIT = 10

// 한 구의 가게들 중 평점 상위 10곳만 남깁니다
export function topRanked(items: RamenShop[], limit = RANK_LIMIT): RamenShop[] {
  return [...items].sort(byRating).slice(0, limit)
}
