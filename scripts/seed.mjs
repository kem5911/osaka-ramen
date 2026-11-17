// src/data/ramen.json 의 가게 데이터를 Firestore `ramen_shops` 컬렉션에 올리는 스크립트
//
//   node scripts/seed.mjs --check   데이터 검사만 하고 올리지 않음
//   node scripts/seed.mjs           검사 후 Firestore 에 올림 (같은 id 는 덮어씀)
//   node scripts/seed.mjs --prune   올린 뒤, ramen.json 에 없는 문서는 Firestore 에서 삭제
//
// osaka-ramen 폴더에서 실행해야 합니다.

import { readFileSync } from 'node:fs'

const COLLECTION = 'ramen_shops'
const RANK_LIMIT = 10

// 지도에서 선택할 수 있는 10개 구 (src/data/wards.ts 의 id 와 같아야 함)
const WARDS = {
  chuo: '주오구',
  kita: '기타구',
  naniwa: '나니와구',
  tennoji: '텐노지구',
  fukushima: '후쿠시마구',
  yodogawa: '요도가와구',
  nishi: '니시구',
  abeno: '아베노구',
  miyakojima: '미야코지마구',
  joto: '조토구',
}
const BROTHS = ['tonkotsu', 'shoyu', 'miso', 'shio', 'spicy']
const TEXT_FIELDS = ['id', 'ward', 'nameKo', 'nameJa', 'description', 'specialty']

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const prune = args.includes('--prune')

const shops = JSON.parse(readFileSync('src/data/ramen.json', 'utf8'))

// ---------- 1. 데이터 검사 ----------
const errors = []
const warnings = []
const unfilled = []
const seen = new Set()
const countByWard = Object.fromEntries(Object.keys(WARDS).map((id) => [id, 0]))

shops.forEach((shop, index) => {
  const where = `${index + 1}번째 가게(${shop.id ?? shop.nameKo ?? '이름 없음'})`
  for (const field of TEXT_FIELDS) {
    if (typeof shop[field] !== 'string' || shop[field].trim() === '') errors.push(`${where}: "${field}" 값이 비어 있습니다.`)
  }
  if (typeof shop.id === 'string' && shop.id.includes('/')) errors.push(`${where}: id 에 "/" 를 쓸 수 없습니다.`)
  if (seen.has(shop.id)) errors.push(`${where}: id 가 다른 가게와 겹칩니다.`)
  seen.add(shop.id)
  if (typeof shop.rating !== 'number' || shop.rating < 0 || shop.rating > 5) errors.push(`${where}: rating 은 0~5 사이 숫자여야 합니다.`)
  if (!Number.isInteger(shop.reviewCount) || shop.reviewCount < 0) errors.push(`${where}: reviewCount 는 0 이상의 정수여야 합니다.`)
  if (![0, 1, 2, 3].includes(shop.spice)) errors.push(`${where}: spice 는 0, 1, 2, 3 중 하나여야 합니다.`)
  if (!BROTHS.includes(shop.broth)) errors.push(`${where}: broth 는 ${BROTHS.join(', ')} 중 하나여야 합니다.`)
  if (shop.rating === 0 || shop.reviewCount === 0) unfilled.push(shop.nameKo)
  if (typeof shop.thumbnail !== 'string') errors.push(`${where}: thumbnail 은 문자열이어야 합니다. (사진이 없으면 "" 로 두세요)`)
  if (shop.ward in WARDS) countByWard[shop.ward] += 1
  else warnings.push(`${where}: ward "${shop.ward}" 는 10개 구에 없어서 지도에서 볼 수 없습니다.`)
})

console.log(`\n가게 ${shops.length}곳을 읽었습니다.\n`)
console.table(
  Object.entries(WARDS).map(([id, name]) => ({
    구: name,
    ward: id,
    가게수: countByWard[id],
    비고: countByWard[id] > RANK_LIMIT ? `상위 ${RANK_LIMIT}곳만 화면에 표시` : countByWard[id] === 0 ? '가게 없음' : '',
  })),
)

if (unfilled.length > 0) {
  console.log(`\n[미입력] 평점·리뷰 수가 0 으로 남아 있는 가게가 ${unfilled.length}곳 있습니다. 구글 지도 값으로 채워 주세요.`)
  console.log(' ' + unfilled.join(', '))
}
if (warnings.length > 0) {
  console.log('\n[주의]')
  warnings.forEach((message) => console.log(' - ' + message))
}
if (errors.length > 0) {
  console.log('\n[오류] 아래 항목을 고친 뒤 다시 실행해 주세요.')
  errors.forEach((message) => console.log(' - ' + message))
  process.exit(1)
}
if (checkOnly) {
  console.log('\n검사만 했습니다. Firestore 에는 올리지 않았습니다.')
  process.exit(0)
}

// ---------- 2. Firestore 업로드 ----------
const { initializeApp } = await import('firebase/app')
const { getFirestore, collection, doc, getDocs, writeBatch } = await import('firebase/firestore')

// 설정 값은 src/firebase.ts 에 적힌 것을 그대로 읽어 온다 (두 곳에 따로 적지 않기 위해)
const configSource = readFileSync('src/firebase.ts', 'utf8').match(/const firebaseConfig\s*=\s*(\{[\s\S]*?\})\s*;?/)
if (!configSource) {
  console.error('src/firebase.ts 에서 firebaseConfig 를 찾지 못했습니다.')
  process.exit(1)
}
const firebaseConfig = new Function(`return ${configSource[1]}`)()

const db = getFirestore(initializeApp(firebaseConfig))

try {
  // 한 번에 500건까지만 쓸 수 있어서 400건씩 나눠서 올린다
  for (let start = 0; start < shops.length; start += 400) {
    const batch = writeBatch(db)
    for (const shop of shops.slice(start, start + 400)) {
      // 가격은 더 이상 쓰지 않으므로 Firestore 에는 올리지 않는다
      const { price: _unused, ...data } = shop
      batch.set(doc(db, COLLECTION, shop.id), data)
    }
    await batch.commit()
  }
  console.log(`\n${shops.length}곳을 Firestore "${COLLECTION}" 에 올렸습니다.`)

  if (prune) {
    const snapshot = await getDocs(collection(db, COLLECTION))
    const stale = snapshot.docs.filter((d) => !seen.has(d.id))
    for (let start = 0; start < stale.length; start += 400) {
      const batch = writeBatch(db)
      for (const d of stale.slice(start, start + 400)) batch.delete(d.ref)
      await batch.commit()
    }
    console.log(`ramen.json 에 없는 문서 ${stale.length}건을 삭제했습니다.` + (stale.length ? ` (${stale.map((d) => d.id).join(', ')})` : ''))
  }
  process.exit(0)
} catch (error) {
  console.error('\n업로드에 실패했습니다:', error.code ?? '', error.message)
  if (error.code === 'permission-denied') console.error('Firestore 규칙에서 쓰기가 막혀 있습니다. Firebase 콘솔 > Firestore Database > 규칙을 확인해 주세요.')
  process.exit(1)
}
