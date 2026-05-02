/**
 * Demo seed script
 * Usage: npx tsx scripts/seed.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !serviceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function createDemoUser(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error && !error.message.includes('already registered')) {
    throw new Error(`Failed to create user ${email}: ${error.message}`)
  }
  let userId = data?.user?.id
  if (!userId) {
    // User already exists — look up id
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const existing = users.find(u => u.email === email)
    userId = existing?.id
  }
  if (userId) {
    // 본 앱 전용 사용자 테이블에도 등록 (mbk_users). 없으면 RLS 로 본 앱 데이터 접근 불가.
    await supabase.from('mbk_users').upsert({ id: userId, email }, { onConflict: 'id' })
  }
  return userId
}

async function seed() {
  console.log('🌱 Starting seed...')

  // Create demo accounts
  const hairUserId = await createDemoUser('demo-hair@moguwai.com', 'demo1234!')
  const kitchenUserId = await createDemoUser('demo-kitchen@moguwai.com', 'demo1234!')

  if (!hairUserId || !kitchenUserId) {
    throw new Error('Failed to get user IDs')
  }

  console.log('✅ Demo users created')

  // Hair shop
  const { data: hairShop, error: hairError } = await supabase
    .from('mbk_businesses')
    .upsert({
      owner_id: hairUserId,
      name: '모과이 헤어',
      slug: 'moguwai-hair',
      category: 'hair',
      description: '트렌디한 헤어 스타일을 제안합니다. 예약 필수.',
      phone: '010-1234-5678',
      address: '서울시 마포구 홍대입구역 2번 출구',
      open_time: '10:00',
      close_time: '20:00',
      slot_duration: 60,
    }, { onConflict: 'slug' })
    .select()
    .single()

  if (hairError) throw new Error('Hair shop upsert failed: ' + hairError.message)
  console.log('✅ Hair shop created:', hairShop.slug)

  // Staff for hair shop
  const staffNames = ['김민준 실장', '이서연 디자이너', '박지훈 디자이너']
  const staffIds: string[] = []

  for (const name of staffNames) {
    const { data: s } = await supabase
      .from('mbk_staff')
      .upsert({ business_id: hairShop.id, name }, { onConflict: 'id' })
      .select()
      .single()
    if (s) staffIds.push(s.id)
  }

  console.log('✅ Hair shop staff created')

  // Reservations for hair shop
  const today = new Date()
  const reservations = []
  const customers = [
    ['홍길동', '010-9999-0001'],
    ['김철수', '010-9999-0002'],
    ['이영희', '010-9999-0003'],
    ['박민수', '010-9999-0004'],
    ['최지은', '010-9999-0005'],
    ['정다운', '010-9999-0006'],
    ['강하늘', '010-9999-0007'],
    ['윤서준', '010-9999-0008'],
    ['임나연', '010-9999-0009'],
    ['오동현', '010-9999-0010'],
  ]

  const statuses = ['confirmed', 'confirmed', 'pending', 'pending', 'pending', 'pending', 'pending', 'completed', 'pending', 'cancelled']
  const dayOffsets = [0, 0, 0, 1, 2, 3, 4, -1, 5, 6]
  const hours = [10, 11, 13, 14, 10, 11, 13, 15, 10, 14]

  for (let i = 0; i < 10; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + dayOffsets[i])
    d.setHours(hours[i], 0, 0, 0)
    reservations.push({
      business_id: hairShop.id,
      staff_id: staffIds[i % staffIds.length],
      reservation_number: `RES-DEMO${String(i + 1).padStart(4, '0')}`,
      customer_name: customers[i][0],
      customer_phone: customers[i][1],
      reserved_at: d.toISOString(),
      status: statuses[i],
    })
  }

  await supabase.from('mbk_reservations').upsert(reservations, { onConflict: 'reservation_number' })
  console.log('✅ Hair shop reservations created')

  // Restaurant
  const { data: kitchen, error: kitchenError } = await supabase
    .from('mbk_businesses')
    .upsert({
      owner_id: kitchenUserId,
      name: '모과이 키친',
      slug: 'moguwai-kitchen',
      category: 'restaurant',
      description: '제철 재료로 만드는 정통 한식 코스. 예약제 운영.',
      phone: '010-8765-4321',
      address: '서울시 종로구 인사동길 12',
      open_time: '11:00',
      close_time: '21:00',
      slot_duration: 30,
    }, { onConflict: 'slug' })
    .select()
    .single()

  if (kitchenError) throw new Error('Kitchen upsert failed: ' + kitchenError.message)
  console.log('✅ Kitchen created:', kitchen.slug)

  const kitchenCustomers = [
    ['한지민', '010-8888-0001'],
    ['서강준', '010-8888-0002'],
    ['박보검', '010-8888-0003'],
    ['김태리', '010-8888-0004'],
    ['이종석', '010-8888-0005'],
    ['수지', '010-8888-0006'],
    ['공유', '010-8888-0007'],
    ['아이유', '010-8888-0008'],
  ]
  const kitchenHours = [11, 12, 13, 18, 11.5, 12, 19, 18.5]
  const kitchenDays = [0, 0, 0, 0, 1, 2, 3, 5]
  const kitchenStatuses = ['confirmed', 'confirmed', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending']

  const kitchenReservations = kitchenCustomers.map((c, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() + kitchenDays[i])
    const h = Math.floor(kitchenHours[i])
    const m = (kitchenHours[i] % 1) === 0.5 ? 30 : 0
    d.setHours(h, m, 0, 0)
    return {
      business_id: kitchen.id,
      staff_id: null,
      reservation_number: `RES-FOOD${String(i + 1).padStart(4, '0')}`,
      customer_name: c[0],
      customer_phone: c[1],
      reserved_at: d.toISOString(),
      status: kitchenStatuses[i],
    }
  })

  await supabase.from('mbk_reservations').upsert(kitchenReservations, { onConflict: 'reservation_number' })
  console.log('✅ Kitchen reservations created')

  console.log('\n🎉 Seed complete!')
  console.log('\n📋 Demo accounts:')
  console.log('  Hair shop: demo-hair@moguwai.com / demo1234!')
  console.log('  Kitchen:   demo-kitchen@moguwai.com / demo1234!')
  console.log('\n🔗 Demo booking pages:')
  console.log('  /moguwai-hair')
  console.log('  /moguwai-kitchen')
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
