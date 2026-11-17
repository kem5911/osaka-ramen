import { afterEach, beforeAll, expect, test, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { RamenShop } from '../src/types/ramen'

// Firestore 대신 테스트가 직접 데이터를 밀어 넣는다
let pushShops: (shops: RamenShop[]) => void = () => {}
vi.mock('../src/firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', () => ({
  collection: () => ({}),
  onSnapshot: (_ref: unknown, onNext: (snapshot: { docs: { data: () => RamenShop }[] }) => void) => {
    pushShops = (shops) => onNext({ docs: shops.map((shop) => ({ data: () => shop })) })
    return () => {}
  },
}))

import App from '../src/App'
import { DEFAULT_FILTERS, filterRamens, topRanked } from '../src/lib/ramenRepository'

function shop(ward: string, n: number, rating: number, extra: Partial<RamenShop> = {}): RamenShop {
  return { id: `${ward}-${n}`, ward, nameKo: `${ward} 가게 ${n}`, nameJa: `店${n}`, rating, reviewCount: 100 + n, spice: 0, broth: 'shoyu', description: '설명', thumbnail: '', specialty: '대표 메뉴', ...extra }
}
// 주오구 12곳 (4.9, 4.8, ... 3.8), 기타구 2곳
const chuo = Array.from({ length: 12 }, (_, i) => shop('chuo', i + 1, Number((4.9 - i * 0.1).toFixed(1))))
const kita = [shop('kita', 1, 4.2), shop('kita', 2, 4.6)]

afterEach(cleanup)

beforeAll(() => {
  Element.prototype.scrollTo = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
  window.scrollTo = vi.fn()
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: false, media: query }))
  window.localStorage.clear()
})

test('topRanked keeps the ten best by rating, review count breaks ties', () => {
  const top = topRanked(chuo)
  expect(top).toHaveLength(10)
  expect(top[0].id).toBe('chuo-1')
  expect(top.at(-1)?.id).toBe('chuo-10')
  const tie = topRanked([shop('kita', 1, 4.5, { reviewCount: 10 }), shop('kita', 2, 4.5, { reviewCount: 900 })])
  expect(tie[0].id).toBe('kita-2')
  expect(filterRamens(chuo, { ...DEFAULT_FILTERS, sort: 'reviews' })[0].id).toBe('chuo-12')
})

test('ward ranking shows the top 10 and re-ranks live when a rating changes in the database', () => {
  render(<App />)
  act(() => pushShops([...chuo, ...kita]))

  fireEvent.click(screen.getByRole('button', { name: '주오구 라멘집 TOP 10 보기' }))
  expect(screen.getByRole('heading', { name: '주오구의 맛있는 순위' })).toBeTruthy()
  expect(screen.getByText('지역별 TOP 10', { exact: false })).toBeTruthy()
  // 12곳 중 10곳만, 한 페이지에 5곳씩
  expect(screen.getAllByRole('article')).toHaveLength(5)
  expect(screen.getAllByRole('article')[0].textContent).toContain('chuo 가게 1')
  fireEvent.click(screen.getByRole('button', { name: '2' }))
  expect(screen.getAllByRole('article')).toHaveLength(5)
  expect(screen.getAllByRole('article').at(-1)?.textContent).toContain('chuo 가게 10')
  expect(screen.queryByText('chuo 가게 11')).toBeNull()

  // DB 에서 11위 가게의 평점이 5.0 으로 오르면 1위로 진입하고 10위 가게는 밀려난다
  act(() => pushShops([...chuo.map((s) => (s.id === 'chuo-11' ? { ...s, rating: 5 } : s)), ...kita]))
  fireEvent.click(screen.getByRole('button', { name: '1' }))
  const first = screen.getAllByRole('article')[0]
  expect(first.textContent).toContain('chuo 가게 11')
  expect(first.textContent).toContain('01')
  fireEvent.click(screen.getByRole('button', { name: '2' }))
  expect(screen.queryByText('chuo 가게 10')).toBeNull()
  expect(screen.getAllByRole('article').at(-1)?.textContent).toContain('chuo 가게 9')

  // 리뷰 많은순으로 정렬해도 순위 번호는 평점 기준 그대로 (리뷰가 가장 많은 건 10위 가게)
  fireEvent.change(screen.getByRole('combobox', { name: '정렬 기준' }), { target: { value: 'reviews' } })
  const mostReviewed = screen.getAllByRole('article')[0]
  expect(mostReviewed.textContent).toContain('chuo 가게 11')
  expect(mostReviewed.textContent).not.toContain('¥')

  // 다른 구는 그 구의 가게만
  fireEvent.click(screen.getByRole('button', { name: '기타구 라멘집 TOP 10 보기' }))
  expect(screen.getAllByRole('article')).toHaveLength(2)
})

test('search finds a ramen shop by Korean or Japanese name and jumps to its card', () => {
  render(<App />)
  act(() => pushShops([...chuo, ...kita, shop('kita', 3, 3.1, { nameKo: '라멘 야시치', nameJa: 'らーめん弥七' })]))
  const box = screen.getByRole('combobox', { name: '지역·라멘집 검색 (한국어 또는 일본어)' })

  // 일본어 이름으로 검색 → 그 가게가 있는 구 랭킹으로 이동하고 카드가 강조된다
  fireEvent.change(box, { target: { value: '弥七' } })
  fireEvent.click(screen.getByRole('option', { name: /라멘 야시치/ }))
  expect(screen.getByRole('heading', { name: '기타구의 맛있는 순위' })).toBeTruthy()
  const card = screen.getAllByRole('article').find((el) => el.textContent?.includes('라멘 야시치'))
  expect(card?.className).toContain('is-searched')

  // TOP 10 안에 있지만 2페이지에 있는 가게(7위) → 2페이지로 이동
  fireEvent.change(box, { target: { value: 'chuo 가게 7' } })
  fireEvent.click(screen.getByRole('option', { name: /chuo 가게 7/ }))
  expect(screen.getByRole('heading', { name: '주오구의 맛있는 순위' })).toBeTruthy()
  expect(screen.getAllByRole('article').some((el) => el.textContent?.includes('chuo 가게 7'))).toBe(true)

  // TOP 10 밖(12위) 가게 → 전체 목록에서 보여 준다
  fireEvent.change(box, { target: { value: 'chuo 가게 12' } })
  fireEvent.click(screen.getByRole('option', { name: /chuo 가게 12/ }))
  expect(screen.getByRole('heading', { name: '오사카, 모든 라멘집' })).toBeTruthy()
  expect(screen.getAllByRole('article').some((el) => el.textContent?.includes('chuo 가게 12'))).toBe(true)

  // 구 이름 검색은 그대로 동작
  fireEvent.change(box, { target: { value: '北区' } })
  fireEvent.click(screen.getByRole('option', { name: /기타구/ }))
  expect(screen.getByRole('heading', { name: '기타구의 맛있는 순위' })).toBeTruthy()
})
