import { useState } from 'react'
import { WARD_GEOMETRIES } from '../data/wards'
import { Icon } from './Icons'

interface Props { selectedWard: string | null; onSelect: (id: string) => void }
export function WardMap({ selectedWard, onSelect }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const highlight = hovered ?? selectedWard
  const highlightedWard = WARD_GEOMETRIES.find((w) => w.id === highlight)
  const core = WARD_GEOMETRIES.filter((w) => w.core)
  return <div className="map-shell">
    <div className="map-tools"><button aria-label="지도 확대" disabled={zoom >= 1.6} onClick={() => setZoom((z) => Math.min(1.6, z + .2))}><Icon name="plus" size={17} /></button><button aria-label="지도 축소" disabled={zoom <= .8} onClick={() => setZoom((z) => Math.max(.8, z - .2))}><Icon name="minus" size={17} /></button><button aria-label="지도 배율 초기화" onClick={() => setZoom(1)}><Icon name="reset" size={15} /></button></div>
    <div className="map-compass"><span>N</span><svg width="17" height="23" viewBox="0 0 17 23" aria-hidden="true"><path d="m8.5 1 7 20-7-5-7 5Z" fill="currentColor" /></svg></div>
    <svg className="osaka-map" viewBox="385 77 510 670" role="group" aria-label="오사카 핵심 10개 구 인터랙티브 지도">
      <defs><filter id="ward-shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="11" stdDeviation="6" floodColor="#665446" floodOpacity=".18" /></filter><filter id="map-soft-shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="3" floodColor="#d4d5d2" floodOpacity=".3" /></filter></defs>
      <g transform={`translate(640 412) scale(${zoom}) translate(-640 -412)`} className="map-zoom">
        <g className="context-wards">{WARD_GEOMETRIES.filter((w) => !w.core).map((ward) => <path key={ward.id} d={ward.d} />)}</g>
        <path className="river-line" d="M410 260 Q480 280 550 305T690 295T820 240" />
        {/* Keep each keyed ward in the same parent. Moving highlighted wards into a
            different group would unmount the focused element on hover/focus. */}
        <g filter="url(#map-soft-shadow)">{core.map((ward) => <g key={ward.id} className={`map-ward ${ward.id === highlight ? 'is-highlighted' : ''} ${ward.id === selectedWard ? 'is-selected' : ''}`} tabIndex={0} role="button" aria-label={`${ward.ko} 라멘집 TOP 10 보기`} aria-pressed={ward.id === selectedWard} onMouseEnter={() => setHovered(ward.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(ward.id)} onBlur={() => setHovered(null)} onClick={() => onSelect(ward.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(ward.id) } }}>
          <path d={ward.d} filter={ward.id === highlight ? 'url(#ward-shadow)' : undefined} />
          <text x={ward.label[0]} y={ward.label[1] - (ward.id === highlight ? 8 : 0)} textAnchor="middle">{ward.ko}<tspan x={ward.label[0]} dy="24" className="map-japanese">{ward.ja}</tspan></text>
        </g>)}</g>
        {['kita', 'naniwa', 'tennoji'].map((id) => { const w = core.find((v) => v.id === id)!; return <g key={id} className="map-bowl" transform={`translate(${w.label[0] + 25} ${w.label[1] - 43})`} aria-hidden="true"><ellipse cx="0" cy="0" rx="15" ry="6" fill="#faf3dc" stroke="#d34f2a" strokeWidth="3" /><path d="M-15 0c1 11 8 16 15 16S14 11 15 0" fill="#d34f2a" /><path d="M-4 -2h8M-2 -5v6" stroke="#72925d" strokeWidth="2" /></g> })}
        {highlightedWard && <g className="map-tooltip" transform={`translate(${highlightedWard.label[0]} ${highlightedWard.label[1] - 83})`} aria-hidden="true"><rect x="-137" y="-25" width="274" height="48" rx="10" fill="#fffefb" /><path d="m-8 22 8 9 8-9" fill="#fffefb" /><text x="0" y="5" textAnchor="middle">{highlightedWard.ko} · 라멘집 보기 ↗</text></g>}
      </g>
    </svg>
    <div className="map-legend"><i /> 탐색 가능한 지역 <span /><b /> 선택한 지역</div>
    <div className="map-location">OSAKA, JAPAN <span>34°41′ N · 135°30′ E</span></div>
  </div>
}
