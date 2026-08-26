import { LayoutDashboard, MessageSquareText, Leaf, BarChart3, Settings, CircleHelp } from 'lucide-react';

export const modules = [
  { id: 'pms', label: 'Manager PMS', icon: LayoutDashboard },
  { id: 'cs', label: 'Customer Service', icon: MessageSquareText },
  { id: 'greenhouse', label: 'PJ Greenhouse', icon: Leaf },
  { id: 'finance', label: 'Akuntansi & Marketing', icon: BarChart3 },
];

export const navGroups = [
  { label: 'WORKSPACE', items: modules },
  { label: 'LAINNYA', items: [{ id: 'settings', label: 'Pengaturan', icon: Settings }, { id: 'help', label: 'Pusat Bantuan', icon: CircleHelp }] },
];