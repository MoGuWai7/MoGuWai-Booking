import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomerCard from '@/components/dashboard/CustomerCard'
import type { Customer } from '@/types/database'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('mbk_businesses')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!business) redirect('/onboarding')

  const { data: customers } = await supabase
    .from('mbk_customers')
    .select('*')
    .eq('business_id', business.id)
    .order('visit_count', { ascending: false })

  const list = (customers ?? []) as Customer[]
  const total = list.length
  const vip = list.filter(c => c.visit_count >= 3).length

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-8 py-10">
      <div className="mb-8">
        <div className="eyebrow mb-2">관계</div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="display text-4xl md:text-5xl" style={{ color: 'var(--ink)' }}>고객 명부</h1>
          <div className="flex gap-5 pb-1">
            <div>
              <div className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>{total}</div>
              <div className="text-xs" style={{ color: 'var(--ink-3)' }}>전체</div>
            </div>
            <div>
              <div className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>{vip}</div>
              <div className="text-xs" style={{ color: 'var(--ink-3)' }}>VIP</div>
            </div>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="font-serif text-2xl mb-2" style={{ color: 'var(--ink)' }}>아직 비어 있어요.</div>
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>
            첫 예약이 들어오면 자동으로 명부에 추가됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map(customer => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      )}
    </div>
  )
}
