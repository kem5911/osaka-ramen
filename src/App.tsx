import { useEffect, useMemo, useRef, useState } from 'react'
import { WardMap } from './components/WardMap'
import { WardSearch } from './components/WardSearch'
import { Filters } from './components/Filters'
import { Introduction } from './components/Introduction'
import { RamenCard } from './components/RamenCard'
import { BowlMark, Icon } from './components/Icons'
import { CORE_WARDS } from './data/wards'
import { subscribeToRamens, filterRamens, topRanked } from './lib/ramenRepository'
import { useFavorites, useRamenFilters, useWardSelection } from './state/useRamenState'
import type { RamenFilters, RamenShop } from './types/ramen'
import './styles/app.css'

type View = 'intro' | 'ranking' | 'all' | 'favorites'
const PAGE_SIZE = 5

export default function App() {
  const { selectedWard, selectWard } = useWardSelection()
  const { filters, setFilter, resetFilters } = useRamenFilters()
  const { favorites, toggleFavorite } = useFavorites()
  const [view, setView] = useState<View>('intro')
  const [page, setPage] = useState(1)
  const listRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const ward = CORE_WARDS.find((w) => w.id === selectedWard)

  const [allShops, setAllShops] = useState<RamenShop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  // 검색으로 고른 라멘집 (해당 카드를 강조하고 그 카드가 있는 페이지로 이동)
  const [focusShopId, setFocusShopId] = useState<string | null>(null)

  // ⭐ 파이어베이스의 데이터 변화를 실시간으로 감지하여 반영 (1회성 getDocs 대신 onSnapshot 사용)
  useEffect(() => {
    const unsubscribe = subscribeToRamens(
      (data) => { setAllShops(data); setLoadError(false); setIsLoading(false) },
      () => { setLoadError(true); setIsLoading(false) },
    )
    return () => unsubscribe() // 컴포넌트 종료 시 통신 연결 해제
  }, [])

  const chooseWard = (id: string) => { setFocusShopId(null); selectWard(id); setView('ranking'); setPage(1) }
  const goHome = () => { setFocusShopId(null); selectWard(null); setView('intro'); setPage(1) }
  // 검색에서 라멘집을 고르면: 그 구의 TOP 10 안에 있으면 구 랭킹으로, 아니면 전체 목록으로 이동
  const chooseShop = (shop: RamenShop) => {
    resetFilters()
    const inTopTen = topRanked(allShops.filter((s) => s.ward === shop.ward)).some((s) => s.id === shop.id)
    if (inTopTen) { selectWard(shop.ward); setView('ranking') } else { selectWard(null); setView('all') }
    setFocusShopId(shop.id)
  }
  const goToPage = (p: number) => { setFocusShopId(null); setPage(p) }
  const updateFilter = <K extends keyof RamenFilters,>(key: K, value: RamenFilters[K]) => {
    setFocusShopId(null)
    setFilter(key, value)
    if (view === 'intro') { selectWard(null); setView('all') }
  }

  const sourceShops = useMemo(() => {
    if (view === 'favorites') return allShops.filter((shop) => favorites.includes(shop.id))
    if (view === 'all') return allShops
    // 구별 랭킹은 평점 상위 10곳만 보여준다 (11위 이하는 평점이 오르면 자동으로 진입)
    if (selectedWard) return topRanked(allShops.filter(shop => shop.ward === selectedWard))
    return []
  }, [view, selectedWard, allShops, favorites])

  // 구 안에서의 평점 순위 (정렬을 바꿔도 순위 번호는 평점 기준으로 유지)
  const wardRank = useMemo(() => {
    const ranks = new Map<string, number>()
    if (view === 'ranking') sourceShops.forEach((shop, i) => ranks.set(shop.id, i + 1))
    return ranks
  }, [view, sourceShops])

  const results = useMemo(() => filterRamens(sourceShops, filters), [sourceShops, filters])
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const effectivePage = Math.min(page, totalPages)
  const visibleShops = results.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [selectedWard, filters, view])
  // 검색으로 고른 라멘집이 있는 페이지로 이동 (위의 1페이지 초기화보다 나중에 실행되어야 한다)
  useEffect(() => {
    if (!focusShopId) return
    const index = results.findIndex((shop) => shop.id === focusShopId)
    if (index >= 0) setPage(Math.floor(index / PAGE_SIZE) + 1)
  }, [focusShopId, results])
  useEffect(() => { listRef.current?.scrollTo({ top: 0, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }, [effectivePage, selectedWard, filters, view])
  useEffect(() => {
    if (!window.matchMedia?.('(max-width: 760px)').matches) return
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    if (view === 'intro') window.scrollTo({ top: 0, behavior })
    else contentRef.current?.scrollIntoView({ behavior, block: 'start' })
  }, [view, selectedWard])

  const heading = view === 'favorites' ? '내가 찜한 라멘집' : view === 'all' ? '오사카, 모든 라멘집' : `${ward?.ko ?? ''}의 맛있는 순위`
  const label = view === 'favorites' ? '찜한 맛집' : view === 'all' ? '전체 지역' : ward?.ko ?? '오사카'

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' }}>파이어베이스와 실시간 연결 중...🔥</div>
  }
  if (loadError) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', textAlign: 'center', padding: '24px' }}>데이터베이스에 연결하지 못했습니다. Firestore 규칙과 네트워크 상태를 확인해 주세요.</div>
  }

  return <div className="app-shell">
    <header className="site-header"><button className="brand" onClick={goHome} aria-label="오사카 라멘 지도 소개 화면으로"><BowlMark /><span className="wordmark">오사카<span>OSAKA RAMEN MAP</span></span><span className="brand-jp">大阪</span></button><nav aria-label="주요 메뉴"><button className={view === 'intro' || view === 'ranking' ? 'nav-active' : ''} onClick={goHome}>지역별 탐색</button><button className={view === 'all' ? 'nav-active' : ''} onClick={() => { setFocusShopId(null); setView('all'); selectWard(null) }}>전체 라멘</button><button className={`nav-favorites ${view === 'favorites' ? 'nav-active' : ''}`} onClick={() => { setFocusShopId(null); selectWard(null); setView('favorites') }}><Icon name="heart" size={17} /> 찜한 맛집 <span>{favorites.length}</span></button></nav><span className="header-demo">실시간 순위 반영 활성화</span></header>
    <main className="split-layout">
      <aside className="explore-pane">
        <WardSearch onSelect={chooseWard} shops={allShops} onSelectShop={chooseShop} />
        <div className="explore-heading"><div className="eyebrow"><span /> TASTE YOUR WAY THROUGH OSAKA</div><h1>어디로 갈까요?<br /><span>한 그릇의 오사카.</span></h1><p>지도의 지역을 선택해, 골목마다 숨어 있는<br className="desktop-break" /> 나만의 라멘 맛집을 발견해 보세요.</p></div>
        <WardMap selectedWard={selectedWard} onSelect={chooseWard} />
        <div className="map-summary"><span><Icon name="pin" size={15} />{selectedWard && ward ? <>{ward.ko} <strong>{view === 'ranking' ? results.length : allShops.filter(s => s.ward === selectedWard).length}곳</strong></> : <>오사카 <strong>10개 지역</strong></>}</span><span>지도에서 지역을 선택하세요 <Icon name="arrow" size={13} /></span></div>
        <Filters filters={filters} onChange={updateFilter} onReset={resetFilters} />
        <div className="map-footer"><span>Firebase Firestore 실시간 연동 데이터</span><a href="https://github.com/geolonia/japanese-boundaries" target="_blank" rel="noreferrer">지도 데이터 © Geolonia</a></div>
      </aside>
      <section ref={contentRef} className={`content-pane ${view !== 'intro' ? 'ranking-pane' : ''}`}>
        {view === 'intro' ? <Introduction onSelect={chooseWard} /> : <div className="ranking-content">
          <div className="ranking-overline"><button onClick={goHome}><Icon name="arrow" size={14} /> 지역별 탐색</button><span>라멘 랭킹</span><span className="demo-pill">LIVE DB</span></div>
          <div className="ranking-title"><div><div className="eyebrow">THE BEST BOWLS IN {view === 'ranking' ? ward?.id.toUpperCase() ?? 'OSAKA' : 'OSAKA'}</div><h2>{heading}</h2><p>{view === 'favorites' ? '다음 여행에서 꼭 맛보고 싶은, 나만의 한 그릇.' : view === 'all' ? '10개 지역의 라멘집을 한눈에 둘러보세요.' : `${ward?.hint} · ${ward?.ja}에서 만나는 특별한 한 그릇.`}</p></div><div className="ranking-count"><strong>{results.length}</strong><span>곳의 라멘집</span></div></div>
          <div className="results-bar" aria-live="polite"><span><Icon name="star" size={14} /> {view === 'ranking' ? '지역별 TOP 10' : view === 'favorites' ? 'MY RAMEN LIST' : 'ALL RAMEN'} <i />{label} <b>{results.length}곳</b></span><span>{filters.sort === 'rating' ? '평점 높은순' : '리뷰 많은순'} <Icon name="chevron" size={13} /></span></div>
          <div className="ranking-scroll" ref={listRef}>
            {visibleShops.length > 0 ? visibleShops.map((shop, i) => <RamenCard key={shop.id} shop={shop} rank={wardRank.get(shop.id) ?? (effectivePage - 1) * PAGE_SIZE + i + 1} highlighted={shop.id === focusShopId} favorite={favorites.includes(shop.id)} onFavorite={() => toggleFavorite(shop.id)} />) : <div className="empty-state"><BowlMark size={66} /><h3>조건에 맞는 라멘집이 없어요.</h3><button onClick={resetFilters}>필터 초기화<Icon name="arrow" size={16} /></button></div>}
          </div>
          <footer className="ranking-bottom"><div className="pagination"><button disabled={effectivePage === 1} onClick={() => goToPage(effectivePage - 1)}><Icon name="chevron" size={15} /></button>{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <button key={p} className={effectivePage === p ? 'current' : ''} onClick={() => goToPage(p)}>{p}</button>)}<button disabled={effectivePage === totalPages} onClick={() => goToPage(effectivePage + 1)}><Icon name="chevron" size={15} /></button></div><p>Firebase 실시간 연동 데이터입니다.<span>{effectivePage} / {totalPages}</span></p></footer>
        </div>}
      </section>
    </main>
  </div>
}