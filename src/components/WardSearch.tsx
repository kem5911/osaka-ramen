import { useState } from 'react'
import { CORE_WARDS } from '../data/wards'
import type { RamenShop } from '../types/ramen'
import { Icon } from './Icons'

interface Props {
  /** 구를 골랐을 때 */
  onSelect: (id: string) => void
  /** 검색 대상이 되는 전체 라멘집 (Firestore 에서 받아 온 목록) */
  shops?: RamenShop[]
  /** 라멘집을 골랐을 때 */
  onSelectShop?: (shop: RamenShop) => void
}

type Result =
  | { kind: 'ward'; key: string; id: string; ko: string; ja: string }
  | { kind: 'shop'; key: string; shop: RamenShop; wardName: string }

const MAX_SHOP_RESULTS = 8

export function WardSearch({ onSelect, shops = [], onSelectShop }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const keyword = query.trim().toLowerCase()

  const wardResults: Result[] = CORE_WARDS
    .filter((ward) => `${ward.ko} ${ward.ja} ${ward.id} ${ward.hint}`.toLowerCase().includes(keyword))
    .map((ward) => ({ kind: 'ward', key: `ward-${ward.id}`, id: ward.id, ko: ward.ko, ja: ward.ja }))
  // 라멘집은 검색어를 입력했을 때만 찾는다 (한국어 이름, 일본어 이름, 대표 메뉴)
  const shopResults: Result[] = keyword === '' ? [] : shops
    .filter((shop) => `${shop.nameKo} ${shop.nameJa} ${shop.specialty}`.toLowerCase().includes(keyword))
    .slice(0, MAX_SHOP_RESULTS)
    .map((shop) => ({ kind: 'shop', key: `shop-${shop.id}`, shop, wardName: CORE_WARDS.find((w) => w.id === shop.ward)?.ko ?? '' }))
  const results = [...wardResults, ...shopResults]

  const active = Math.min(activeIndex, Math.max(results.length - 1, 0))
  const choose = (result: Result) => {
    if (result.kind === 'ward') onSelect(result.id)
    else if (onSelectShop) onSelectShop(result.shop)
    else onSelect(result.shop.ward)
    setQuery(''); setOpen(false); setActiveIndex(0)
  }
  return <div className="search-wrap">
    <form className="ward-search" onSubmit={(e) => { e.preventDefault(); if (open && results.length > 0) choose(results[active]); else setOpen(true) }}>
      <Icon name="pin" size={19} />
      <input role="combobox" value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(0) }} onFocus={() => setOpen(true)} onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActiveIndex((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + Math.max(1, results.length)) % Math.max(1, results.length)) }
      }} placeholder="지역이나 라멘집 이름을 검색하세요" aria-label="지역·라멘집 검색 (한국어 또는 일본어)" aria-expanded={open} aria-controls="ward-results" aria-autocomplete="list" aria-activedescendant={open && results[active] ? `option-${results[active].key}` : undefined} autoComplete="off" />
      {query && <button type="button" className="icon-button search-clear" onClick={() => { setQuery(''); setOpen(true); setActiveIndex(0) }} aria-label="검색어 지우기"><Icon name="close" size={16} /></button>}
      <button type="submit" className="search-submit" aria-label="검색"><Icon name="search" size={21} /></button>
    </form>
    {open && <><div className="search-backdrop" aria-hidden="true" onClick={() => setOpen(false)} /><div className="search-results" id="ward-results" role="listbox" aria-label="검색 결과">
      <div className="search-results-label">{query ? '검색 결과' : '오사카의 10개 지역'} <small>↑ ↓ 선택 · Enter 이동</small></div>
      {results.length === 0 ? <p className="search-empty">일치하는 지역이나 라멘집이 없어요.<br />‘주오구’, ‘中央区’ 또는 가게 이름을 검색해 보세요.</p> : results.map((result, i) => <button type="button" role="option" id={`option-${result.key}`} key={result.key} aria-selected={i === active} className={i === active ? 'search-option-active' : ''} onClick={() => choose(result)}>
        {result.kind === 'ward'
          ? <span>{result.ko} <small>{result.ja}</small></span>
          : <span><em className="search-kind">라멘집</em>{result.shop.nameKo} <small>{result.shop.nameJa}</small><small>{result.wardName}</small></span>}
        <Icon name="arrow" size={16} />
      </button>)}
    </div></>}
  </div>
}
