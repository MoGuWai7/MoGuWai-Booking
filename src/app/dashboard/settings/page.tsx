import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsTabs from './SettingsTabs'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: business } = await supabase
    .from('mbk_businesses')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!business) redirect('/onboarding')

  const [{ data: staff }, { data: blockedDates }] = await Promise.all([
    supabase.from('mbk_staff').select('*').eq('business_id', business.id).order('created_at'),
    supabase.from('mbk_blocked_dates').select('*').eq('business_id', business.id).order('blocked_date'),
  ])

  return (
    <div className="max-w-3xl mx-auto px-5 lg:px-8 py-10">
      <div className="mb-8">
        <div className="eyebrow mb-2">설정</div>
        <h1 className="display text-4xl md:text-5xl" style={{ color: 'var(--ink)' }}>가게 설정</h1>
      </div>
      <SettingsTabs
        business={business}
        staff={staff ?? []}
        blockedDates={blockedDates ?? []}
      />
    </div>
  )
}
