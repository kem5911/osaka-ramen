import type { RamenShop } from '../types/ramen'
import { BROTH_LABELS } from '../lib/ramenRepository'
import { useState } from 'react'
import { Icon } from './Icons'

interface Props { shop: RamenShop; rank: number; favorite: boolean; onFavorite: () => void; highlighted?: boolean }

export function RamenCard({ shop, rank, favorite, onFavorite, highlighted = false }: Props) {
  // 썸네일 주소가 비었거나 불러오지 못하면 육수 종류에 맞는 기본 그림을 보여준다
  const fallback = `/images/ramen-${shop.broth}.svg`
  const [imageFailed, setImageFailed] = useState(false)
  const imageSrc = !shop.thumbnail || imageFailed ? fallback : shop.thumbnail
  const openGoogleMaps = () => {
    const mapUrl = shop.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.nameJa} 大阪`)}`;
    window.open(mapUrl, '_blank');
  };

  return <article className={`ramen-card ${highlighted ? 'is-searched' : ''}`}>
    <div className={`rank-badge ${rank <= 3 ? 'top-rank' : ''}`}>{String(rank).padStart(2, '0')}</div>
    <div className={`card-thumbnail broth-${shop.broth}`}><img src={imageSrc} onError={() => setImageFailed(true)} alt={`${shop.nameKo}의 ${BROTH_LABELS[shop.broth]} 라멘`} loading="lazy" /><span>{BROTH_LABELS[shop.broth]}</span></div>
    <div className="card-info">
      <div className="card-topline"><span className="card-specialty">{shop.specialty}</span></div>
      <h3>{shop.nameKo}</h3>
      <p className="card-japanese">{shop.nameJa}</p>
      <div className="card-rating">
        <span className="stars" aria-label={`별점 5점 만점 중 ${shop.rating}`}><Icon name="star" size={14} filled /><b>{shop.rating.toFixed(2)}</b></span>
        <span className="review-count">({shop.reviewCount})</span>
        <i className="rating-divider" />
        <span className={`spice-icons spice-${shop.spice}`} aria-label={`맵기 ${shop.spice}단계`}>
          {[1, 2, 3].map((level) => <Icon key={level} name="pepper" size={15} filled={level <= shop.spice} className={level <= shop.spice ? 'hot' : ''} />)}
          <small>{['순한맛', '살짝 매콤', '매운맛', '아주 매운맛'][shop.spice]}</small>
        </span>
      </div>
      <p className="card-description">{shop.description}</p>
      <button onClick={openGoogleMaps} style={{ marginTop: '12px', padding: '6px 12px', background: '#4285F4', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
        📍 구글 지도에서 리뷰 보기
      </button>
    </div>
    <button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} onClick={onFavorite} aria-label={`${shop.nameKo} ${favorite ? '찜 해제' : '찜하기'}`} aria-pressed={favorite}><Icon name="heart" size={20} filled={favorite} /></button>
  </article>
}