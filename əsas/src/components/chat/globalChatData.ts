import { GlobalCategory, GlobalSubcategory, ChatMessage, SubcategoryId } from './types';

export const GLOBAL_CATEGORIES: GlobalCategory[] = [
  {
    id: 'mobile',
    name: 'Mobile',
    subtitle: 'iPhone & Android',
    iconName: 'Smartphone',
    subcategories: [
      {
        id: 'iphone',
        name: 'iPhone',
        categoryId: 'mobile',
        memberCount: '4,850',
        onlineCount: '620',
        description: 'iOS ekosistemi, yeniliklər, tətbiqlər və Apple cihaz müzakirələri',
        iconName: 'Apple',
        accentColor: '#3b82f6',
      },
      {
        id: 'android',
        name: 'Android',
        categoryId: 'mobile',
        memberCount: '6,420',
        onlineCount: '890',
        description: 'Android sistemi, One UI, Pixel, optimizasiya və tətbiqlər',
        iconName: 'Smartphone',
        accentColor: '#10b981',
      },
    ],
  },
  {
    id: 'desktop',
    name: 'Desktop',
    subtitle: 'Windows, macOS & Linux',
    iconName: 'Monitor',
    subcategories: [
      {
        id: 'windows',
        name: 'Windows',
        categoryId: 'desktop',
        memberCount: '3,920',
        onlineCount: '410',
        description: 'Windows 11/10 proqramlar, optimizasiya, oyun və texniki dəstək',
        iconName: 'Monitor',
        accentColor: '#0ea5e9',
      },
      {
        id: 'macos',
        name: 'macOS',
        categoryId: 'desktop',
        memberCount: '3,150',
        onlineCount: '350',
        description: 'MacBook, iMac, Apple Silicon, proqramlaşdırma və iş mühiti',
        iconName: 'Laptop',
        accentColor: '#8b5cf6',
      },
      {
        id: 'linux',
        name: 'Linux',
        categoryId: 'desktop',
        memberCount: '2,480',
        onlineCount: '280',
        description: 'Distrolar, terminal əmrləri, serverlər, Docker və açıq mənbə',
        iconName: 'Terminal',
        accentColor: '#f59e0b',
      },
    ],
  },
];

export const INITIAL_SUBCATEGORY_MESSAGES: Record<SubcategoryId, ChatMessage[]> = {
  iphone: [],
  android: [],
  windows: [],
  macos: [],
  linux: [],
};
