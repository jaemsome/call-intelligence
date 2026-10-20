import { Home, ListChecks, Users, Lightbulb, BarChart3, PhoneCall, HeartPulse, Zap, type LucideIcon } from 'lucide-react'

export type NavItem = { label: string; href: string; icon: LucideIcon; live: boolean }

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '#', icon: Home, live: false },
  { label: 'Tasks', href: '#', icon: ListChecks, live: false },
  { label: 'Team', href: '#', icon: Users, live: false },
  { label: 'Assistant', href: '#', icon: Lightbulb, live: false },
  { label: 'Financials', href: '#', icon: BarChart3, live: false },
  { label: 'Call Intelligence', href: '/calls', icon: PhoneCall, live: true },
  { label: 'Customer Health', href: '#', icon: HeartPulse, live: false },
  { label: 'Updates', href: '#', icon: Zap, live: false },
]
