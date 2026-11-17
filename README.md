# 오사카 라멘 랭킹

Firebase 데이터베이스 기말 과제 시연을 위한 React · TypeScript 웹사이트입니다. 데스크톱에서는 좌측 40%에 지도·검색·필터를, 우측 60%에 라멘 소개 또는 랭킹을 배치합니다. 모바일에서는 두 영역이 세로로 쌓입니다.

**현재 실제 Firebase 연결은 없습니다.** 모든 맛집 정보는 로컬 더미 JSON이고, 찜은 브라우저 localStorage에 저장됩니다. 상호명·평점·리뷰 수·가격은 가상의 시연 데이터이므로 실제 여행 정보로 사용하면 안 됩니다.

## 실행

Node.js 22와 pnpm 11.25.0을 사용합니다.

```bash
pnpm install
pnpm dev          # 0.0.0.0:3000 (Vite)
pnpm test         # DOM 기반 React 상호작용 테스트
pnpm typecheck    # TypeScript 검사
pnpm build        # TypeScript 검사 + dist/ 정적 빌드
```

## 시연 방법

초기 화면에서 이전/다음 버튼이나 점 표시를 클릭해 돈코츠·쇼유·미소·시오·탄탄 소개를 넘겨보세요. 좌측 지도에서 구를 클릭하거나 인기 지역 바로가기를 누르면 해당 구의 TOP 10 랭킹으로 전환됩니다. 지도 구역은 마우스 Hover와 Active 상태를 구분하며, Tab으로 초점을 옮기고 Enter 또는 Space로 선택할 수도 있습니다.

검색창은 구의 한국어·일본어 이름, 영문 ID와 주요 지역명을 찾습니다. 예를 들어 `기타구`, `北区`, `우메다`로 같은 구를 찾을 수 있습니다. 육수·맵기·정렬 조건은 독립 상태로 유지됩니다. 소개 화면에서 필터를 바꾸면 전체 라멘 결과로 전환되어 즉시 반영됩니다. 필터를 바꾸면 결과 개수와 페이지 수가 함께 바뀌고 첫 페이지로 돌아갑니다. 목록은 5개씩 표시하며 목록 내부가 세로 스크롤됩니다. 결과가 없으면 ‘필터 초기화’를 사용하세요.

카드의 하트는 찜 상태를 토글합니다. 상단 ‘찜한 맛집’에서 모아볼 수 있고 같은 브라우저에서는 새로고침 후에도 유지됩니다. 상단 ‘전체 라멘’은 10개 구의 데모 목록을 함께 보여줍니다. ‘지역별 탐색’ 또는 브랜드 로고를 누르면 처음 소개 화면으로 돌아갑니다.

## 코드 구조

```text
src/
├── App.tsx                    # 소개/랭킹/전체/찜 화면, 파생 목록, 페이지네이션
├── main.tsx                   # React 엔트리
├── components/
│   ├── WardMap.tsx             # SVG 지도, Hover/Active, 확대/축소, 키보드 선택
│   ├── WardSearch.tsx          # 한국어/일본어 지역 검색
│   ├── Filters.tsx             # 육수/맵기/정렬 입력
│   ├── Introduction.tsx        # 5종 육수 소개, 재료 콜아웃, 인기 지역
│   ├── RamenCard.tsx           # 상호, 썸네일, 별점, 고추, 가격, 찜
│   └── Icons.tsx               # SVG 아이콘, 라멘 브랜드 마크
├── data/
│   ├── wards.ts               # 24개 구 경계, 탐색 가능한 핵심 10개 구
│   └── ramen.json             # 가상 라멘집 템플릿 정확히 10건
├── types/ramen.ts             # Broth, RamenShop, RamenFilters
├── lib/ramenRepository.ts     # JSON → Firestore 교체 지점, 순수 필터/정렬
├── state/useRamenState.ts     # 선택 구 / 필터 / 찜 독립 스토어와 훅
└── styles/app.css             # 40:60 레이아웃, 일본풍 테마, 반응형

tests/app.test.tsx             # 데이터와 화면 연결 테스트
public/manus-routes.json       # 실제 페이지 경로 선언
```

## 더미 데이터 10개를 구별 TOP 10으로 재사용

`ramen.json`에는 10개 템플릿만 들어 있습니다. 각 구에서 같은 템플릿을 재사용하고 구별로 `ward`와 `id`를 부여합니다. 예를 들어 첫 템플릿은 주오구에서 `chuo-t01`, 기타구에서 `kita-t01`이 됩니다. 따라서 전체 목록은 100개의 고유 ID를 가지지만 원본 JSON 레코드는 정확히 10개입니다.

서로 다른 구에서 같은 상호명·평점이 반복되는 것은 시연을 위한 의도적인 동작입니다. 실제 서비스에서는 구별 Firestore 문서로 대체하세요. 육수 5종, 맵기 0~3, 가격 850~1,400엔, 평점 4.28~4.95로 구성되어 필터와 정렬을 시연할 수 있습니다.

## 선택 구와 필터 상태 분리

세 독립 스토어를 `useSyncExternalStore`로 구독합니다. UI는 상태와 파생 데이터를 구분해서 사용합니다.

```tsx
const { selectedWard, selectWard } = useWardSelection()
const { filters, setFilter, resetFilters } = useRamenFilters()
const { favorites, toggleFavorite } = useFavorites()

// 필터와 선택 구를 섞지 않고, 목록을 파생 값으로 계산합니다.
const results = useMemo(
  () => filterRamens(getRamensForWard(selectedWard ?? ''), filters),
  [selectedWard, filters],
)
```

선택 구와 필터는 메모리 상태이며 새로고침하면 초기화됩니다. 찜은 `osakaram:favorites` 키에 상점 ID 배열을 저장합니다. 읽기·쓰기 오류는 처리되어 저장소가 차단되어도 앱이 중단되지 않습니다. 다른 탭의 저장 변경도 동기화됩니다.

## Firebase Firestore 연동 준비

현재 Firebase SDK·설정·자격 증명은 포함하지 않습니다. `src/lib/ramenRepository.ts`가 데이터 교체 지점입니다. 다음 문서 구조는 `RamenShop` 타입과 대응됩니다.

```text
ramenShops/{shopId}
  ward: string                    # 예: chuo, kita
  nameKo: string
  nameJa: string
  rating: number
  reviewCount: number
  spice: number                   # 0~3
  broth: tonkotsu | shoyu | miso | shio | spicy
  price: number                   # 엔
  description: string
  thumbnail: string               # Firebase Storage URL 등
  specialty: string

users/{uid}/favorites/{shopId}
  createdAt: Timestamp
```

연동 시 SDK를 설치하고 Firebase 초기화 모듈을 추가한 뒤, `getRamensForWard`를 비동기 조회 함수로 교체합니다. 현재 동기 함수의 호출부인 `App.tsx`도 `useEffect` 또는 쿼리 훅에서 로딩·오류·응답 상태를 처리하도록 변경해야 합니다. 지역을 빠르게 바꾸는 경우 이전 요청 응답이 현재 구의 목록을 덮어쓰지 않도록 요청 ID 또는 취소 플래그를 사용하세요.

```ts
// Firebase 설정을 완료한 뒤 사용할 조회 예시입니다.
const q = query(
  collection(db, 'ramenShops'),
  where('ward', '==', wardId),
)
const snapshot = await getDocs(q)
const shops = snapshot.docs.map((doc) => ({
  ...doc.data(),
  id: doc.id,
}) as RamenShop)

// 육수/맵기/정렬은 기존 순수 함수를 재사용할 수 있습니다.
const results = filterRamens(shops, filters)
```

`getAllDemoRamens`는 전체 컬렉션 조회로 교체하고, 찜 스토어는 로그인한 사용자의 하위 컬렉션에 연결하면 됩니다. UI 페이지네이션은 현재 클라이언트 배열을 5개씩 나누는 방식입니다. 데이터가 많아지면 Firestore의 `limit`과 커서 페이지네이션으로 옮기세요. 서버에서 여러 조건과 정렬을 함께 쿼리하면 복합 인덱스가 필요할 수 있습니다.

찜 문서는 본인 uid만 읽고 쓰게 제한해야 합니다. 상점 데이터는 공개 읽기와 관리자 전용 쓰기로 분리하세요. 서비스 계정 키는 브라우저 코드에 넣으면 안 됩니다.

```js
match /users/{uid}/favorites/{shopId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
match /ramenShops/{shopId} {
  allow read: if true;
  allow write: if false; // Admin SDK 또는 관리자 서버에서 수정
}
```

## 검증과 출처

`pnpm test`가 10개 구 전환, 소개 슬라이드, 일본어 검색, 필터·정렬, 빈 결과, 페이지네이션, 찜 저장·해제를 검사합니다. `pnpm build`도 통과합니다. 실제 브라우저 스크린샷 비교 테스트는 포함하지 않았습니다.

지도 경계와 AI 이미지의 출처 및 용도는 [DATA_SOURCES.md](./DATA_SOURCES.md)를 참고하세요. 라멘 이미지는 특정 실제 매장의 사진이 아닙니다. 이미지 경로는 Manus 프로젝트 저장소의 `/manus-storage/`를 사용하므로 Manus 미리보기에서 표시됩니다. 다운로드한 코드를 별도 로컬 서버 또는 Firebase Hosting에서 실행할 때는 `Introduction.tsx`와 `ramen.json`의 이미지 URL을 본인의 Firebase Storage URL 또는 로컬 에셋 경로로 교체하세요.
