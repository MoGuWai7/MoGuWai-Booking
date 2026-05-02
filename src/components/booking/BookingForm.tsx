'use client'

interface BookingFormProps {
  name: string
  phone: string
  onChangeName: (v: string) => void
  onChangePhone: (v: string) => void
  errors?: { name?: string; phone?: string }
}

export default function BookingForm({ name, phone, onChangeName, onChangePhone, errors }: BookingFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
          이름 <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <input
          value={name}
          onChange={e => onChangeName(e.target.value)}
          className="field"
          placeholder="홍길동"
          autoComplete="name"
        />
        {errors?.name && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>{errors.name}</p>
        )}
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ink-2)' }}>
          연락처 <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <input
          value={phone}
          onChange={e => onChangePhone(e.target.value)}
          className="field"
          placeholder="010-0000-0000"
          inputMode="tel"
          autoComplete="tel"
        />
        {errors?.phone && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>{errors.phone}</p>
        )}
      </div>
    </div>
  )
}
