import { useState } from 'react'
import { Icon } from './Icons'

const SLIDES = [
  { ko: '돈코츠', ja: '豚骨', subtitle: '깊고 진한 한 그릇의 위로.', description: '오랜 시간 푹 끓인 돼지 사골 육수.\n크리미한 풍미가 입안 가득 퍼지는 오사카의 클래식.', image: '/images/ramen-tonkotsu.svg', tags: ['진하게 우린 사골', '부드러운 차슈', '반숙 아지타마'], bottom: '진한 국물, 부드러운 차슈, 그리고 완벽한 한 입.', en: 'RICH & CREAMY' },
  { ko: '쇼유', ja: '醤油', subtitle: '담백함 속에 숨은 깊은 감칠맛.', description: '맑은 육수에 향긋한 간장을 더해.\n깔끔한 끝맛과 깊은 감칠맛이 어우러지는 한 그릇.', image: '/images/ramen-shoyu.svg', tags: ['향긋한 간장 육수', '아삭한 멘마', '쫄깃한 면발'], bottom: '언제 먹어도 좋은, 라멘의 가장 기본적인 맛.', en: 'CLEAR & SAVORY' },
  { ko: '미소', ja: '味噌', subtitle: '구수하고 든든하게, 마음까지 따뜻하게.', description: '발효된 된장의 풍미에 볶은 채소를 더해.\n고소한 버터와 옥수수가 포근하게 감싸는 진한 맛.', image: '/images/ramen-miso.svg', tags: ['깊은 된장 풍미', '달콤한 옥수수', '고소한 버터'], bottom: '고소함과 구수함이 만나 만드는 든든한 한 그릇.', en: 'HEARTY & WARM' },
  { ko: '시오', ja: '塩', subtitle: '투명한 국물에 담은 섬세한 맛.', description: '소금으로 완성한 맑고 깨끗한 육수.\n은은한 유자 향과 재료 본연의 맛을 천천히 즐겨요.', image: '/images/ramen-shio.svg', tags: ['맑은 소금 육수', '촉촉한 닭 차슈', '은은한 유자 향'], bottom: '가벼운 첫맛 뒤에 오래 남는 섬세한 여운.', en: 'LIGHT & DELICATE' },
  { ko: '탄탄', ja: '担々', subtitle: '오늘은 조금 더 뜨겁게.', description: '고소한 참깨 육수와 화끈한 고추기름.\n매콤한 다진 고기가 입맛을 깨우는 강렬한 한 그릇.', image: '/images/ramen-spicy.svg', tags: ['매콤한 고추기름', '고소한 참깨', '풍미 가득 다진 고기'], bottom: '매콤하게 시작해서, 고소하게 마무리되는 맛.', en: 'BOLD & SPICY' },
]
const POPULAR = [{ id: 'chuo', ko: '주오구', ja: '中央区', area: '도톤보리 · 난바', number: '01' }, { id: 'kita', ko: '기타구', ja: '北区', area: '우메다', number: '02' }, { id: 'naniwa', ko: '나니와구', ja: '浪速区', area: '신세카이', number: '03' }]
export function Introduction({ onSelect }: { onSelect: (id: string) => void }) {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const changeSlide = (direction: number) => setIndex((i) => (i + direction + SLIDES.length) % SLIDES.length)
  return <div className="intro-content">
    <div className="intro-overline"><span className="tiny-rule" /> A BOWL OF OSAKA <span className="intro-jp">大阪の一杯</span></div>
    <section className="ramen-feature" aria-label="육수별 라멘 소개" aria-roledescription="캐러셀">
      <div className="feature-heading" key={`title-${index}`}><div className="feature-title"><span className="feature-number">0{index + 1}</span><h2>{slide.ko} <span>({slide.ja})</span></h2></div><p className="feature-subtitle">{slide.subtitle}</p><p className="feature-description">{slide.description}</p></div>
      <div className="bowl-stage">
        <span className="bowl-halo" /><span className="bowl-orbit orbit-one" /><span className="bowl-orbit orbit-two" />
        <span className="bowl-en">{slide.en}</span>
        <img key={slide.image} className="hero-bowl" src={slide.image} alt={`${slide.ko} 라멘: ${slide.tags.join(', ')}`} />
        <div className="ingredient-tags" key={`tags-${index}`}>{slide.tags.map((tag, i) => <span key={tag} className={`ingredient ingredient-${i}`}><i />{tag}</span>)}</div>
        <button className="carousel-arrow prev" onClick={() => changeSlide(-1)} aria-label="이전 라멘 소개"><Icon name="chevron" size={18} /></button><button className="carousel-arrow next" onClick={() => changeSlide(1)} aria-label="다음 라멘 소개"><Icon name="chevron" size={18} /></button>
      </div>
      <div className="feature-caption"><h3>{slide.ko} 라멘 <span>{slide.ja}</span></h3><p>{slide.bottom}</p><div className="carousel-dots">{SLIDES.map((s, i) => <button key={s.ko} className={index === i ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`${s.ko} 라멘 소개`} aria-current={index === i ? 'true' : undefined} />)}</div></div>
    </section>
    <section className="popular-section"><div className="popular-heading"><h3>어디부터 맛볼까요?</h3><span>인기 지역 바로가기 <Icon name="arrow" size={14} /></span></div><div className="popular-wards">{POPULAR.map((ward) => <button key={ward.id} onClick={() => onSelect(ward.id)}><span className="popular-number">{ward.number}</span><span className="popular-name">{ward.ko} <small>{ward.ja}</small></span><span className="popular-area">{ward.area}<Icon name="arrow" size={17} /></span></button>)}</div></section>
    <div className="intro-footnote"><span>좋은 라멘은, 좋은 여행의 시작.</span><span>ITADAKIMASU.</span></div>
  </div>
}
