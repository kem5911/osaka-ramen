/**
 * 라멘 데이터 도메인 타입.
 *
 * Firestore `ramen_shops` 컬렉션의 문서 1건이 `RamenShop` 과 1:1 대응된다.
 * 원본 데이터는 `src/data/ramen.json` 에 적고 `node scripts/seed.mjs` 로 Firestore 에 올린다.
 * 평점과 리뷰 수는 구글 지도에 표시된 값을 직접 옮겨 적은 것이다.
 */

/** 육수 종류 (5종) */
export type Broth = 'tonkotsu' | 'shoyu' | 'miso' | 'shio' | 'spicy'

/** 랭킹 카드 1건 = Firestore `ramen_shops/{shopId}` 문서 1건 */
export interface RamenShop {
  /** 문서 ID. `구id-가게이름` 형태로 가게마다 다르게 적는다. */
  id: string
  /** 소속 구 slug. `src/data/wards.ts` 의 `WardGeo.id` 와 동일한 값. */
  ward: string
  /** 상호명(한국어 표기) */
  nameKo: string
  /** 상호명(일본어 표기) */
  nameJa: string
  /** 구글 지도 평점 (0 ~ 5) */
  rating: number
  /** 리뷰 수 */
  reviewCount: number
  /** 매운맛 단계: 0(순함) ~ 3(매우 매움) */
  spice: number
  /** 육수 종류 */
  broth: Broth
  /** 카드에 노출되는 한 줄 소개 */
  description: string
  /** 썸네일 이미지 경로 */
  thumbnail: string
  /** 대표 메뉴/특징 키워드 */
  specialty: string
  /** 구글 지도 가게 페이지 주소. 비워 두면 가게 이름으로 검색한다. */
  mapUrl?: string
}

/** 정렬 방식 */
export type RamenSort = 'rating' | 'reviews'

/** 랭킹 목록 필터 상태 */
export interface RamenFilters {
  /** 'all' 이면 육수 종류 필터 없음 */
  broth: Broth | 'all'
  /** 'all' 이면 매운맛 필터 없음, '0'~'3' 은 해당 단계만 */
  spice: 'all' | '0' | '1' | '2' | '3'
  /** 평점 높은순 / 리뷰 많은순 */
  sort: RamenSort
}
