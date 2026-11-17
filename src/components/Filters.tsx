import type { RamenFilters } from '../types/ramen'
import { Icon } from './Icons'
interface Props { filters: RamenFilters; onChange: <K extends keyof RamenFilters>(key: K, value: RamenFilters[K]) => void; onReset: () => void }
export function Filters({ filters, onChange, onReset }: Props) {
  return <section className="filter-panel" aria-label="라멘 검색 필터">
    <div className="filter-heading"><span><Icon name="sliders" size={17} /> 나만의 라멘 찾기</span><button onClick={onReset}>초기화 <Icon name="reset" size={12} /></button></div>
    <div className="filter-fields">
      <label><span>육수 종류</span><div className="select-box"><select value={filters.broth} onChange={(e) => onChange('broth', e.target.value as RamenFilters['broth'])}><option value="all">모든 육수</option><option value="tonkotsu">돈코츠 · 豚骨</option><option value="shoyu">쇼유 · 醤油</option><option value="miso">미소 · 味噌</option><option value="shio">시오 · 塩</option><option value="spicy">탄탄 · 担々</option></select><Icon name="chevron" size={14} /></div></label>
      <label><span>맵기 수준</span><div className="select-box"><select value={filters.spice} onChange={(e) => onChange('spice', e.target.value as RamenFilters['spice'])}><option value="all">모든 맵기</option><option value="0">순한맛</option><option value="1">살짝 매운맛</option><option value="2">매운맛</option><option value="3">아주 매운맛</option></select><Icon name="chevron" size={14} /></div></label>
      <label><span>정렬 기준</span><div className="select-box"><select value={filters.sort} onChange={(e) => onChange('sort', e.target.value as RamenFilters['sort'])}><option value="rating">평점 높은순</option><option value="reviews">리뷰 많은순</option></select><Icon name="chevron" size={14} /></div></label>
    </div>
  </section>
}
