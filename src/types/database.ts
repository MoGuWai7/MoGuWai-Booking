/**
 * 파일 역할:
 * - 데이터베이스 모델과 enum 타입 정의 모음입니다.
 * - Supabase 클라이언트가 의도적으로 any로 캐스팅되어 있어, 본 타입들은
 *   서버/클라이언트 코드에서 명시적으로 캐스팅(`data as Business[]` 등)할 때 사용합니다.
 *
 * 주의사항:
 * - DB의 mbk_* 테이블 prefix는 Database 타입의 키에 그대로 반영되어 있어야 합니다.
 *   prefix 변경 시 supabase/schema.sql 과 함께 동기화 필수.
 */
export type Category = 'restaurant' | 'hair' | 'nail' | 'skin' | 'etc'
export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

/**
 * mbk_users — 본 앱(MoGuWai Booking) 전용 사용자 프로필.
 * - id 는 auth.users(id) 와 동일 (1:1).
 * - 다른 앱에서 가입한 계정은 이 테이블에 row 가 없어 RLS 로 본 앱 데이터에 접근할 수 없음.
 */
export interface MbkUser {
  id: string
  email: string | null
  display_name: string | null
  created_at: string
}

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  category: Category
  description: string | null
  phone: string | null
  address: string | null
  open_time: string
  close_time: string
  slot_duration: number
  created_at: string
}

export interface Staff {
  id: string
  business_id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface BlockedDate {
  id: string
  business_id: string
  blocked_date: string
  reason: string | null
  created_at: string
}

export interface Reservation {
  id: string
  business_id: string
  staff_id: string | null
  reservation_number: string
  customer_name: string
  customer_phone: string
  reserved_at: string
  status: ReservationStatus
  created_at: string
}

export interface Customer {
  id: string
  business_id: string
  name: string
  phone: string
  visit_count: number
  last_visited_at: string | null
  created_at: string
}

/**
 * mbk_visitor_logs — 사이트 방문자(페이지뷰) 로그.
 * src/proxy.ts가 INSERT, /visitor-log 페이지가 SELECT.
 * 모든 컬럼이 nullable인 이유는 GeoIP 헤더/UA 미존재 환경(로컬 등)을 허용하기 위함.
 */
export interface VisitorLog {
  id: string
  visited_at: string | null
  path: string | null
  slug: string | null
  country: string | null
  country_code: string | null
  region: string | null
  city: string | null
  device_type: string | null
  os: string | null
  browser: string | null
  ip: string | null
  referrer: string | null
}

export type Database = {
  public: {
    Tables: {
      mbk_users: {
        Row: MbkUser
        Insert: Pick<MbkUser, 'id'> & Partial<Omit<MbkUser, 'id' | 'created_at'>>
        Update: Partial<Omit<MbkUser, 'id'>>
        Relationships: []
      }
      mbk_businesses: {
        Row: Business
        Insert: Omit<Business, 'id' | 'created_at'>
        Update: Partial<Omit<Business, 'id'>>
        Relationships: []
      }
      mbk_staff: {
        Row: Staff
        Insert: Omit<Staff, 'id' | 'created_at'>
        Update: Partial<Omit<Staff, 'id'>>
        Relationships: []
      }
      mbk_blocked_dates: {
        Row: BlockedDate
        Insert: Omit<BlockedDate, 'id' | 'created_at'>
        Update: Partial<Omit<BlockedDate, 'id'>>
        Relationships: []
      }
      mbk_reservations: {
        Row: Reservation
        Insert: Omit<Reservation, 'id' | 'created_at'>
        Update: Partial<Omit<Reservation, 'id'>>
        Relationships: []
      }
      mbk_customers: {
        Row: Customer
        Insert: Omit<Customer, 'id' | 'created_at'>
        Update: Partial<Omit<Customer, 'id'>>
        Relationships: []
      }
      mbk_visitor_logs: {
        Row: VisitorLog
        Insert: Omit<VisitorLog, 'id' | 'visited_at'>
        Update: Partial<Omit<VisitorLog, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_reservation: {
        Args: {
          p_business_id: string
          p_staff_id: string | null
          p_customer_name: string
          p_customer_phone: string
          p_reserved_at: string
        }
        Returns: Reservation
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
