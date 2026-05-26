'use client'

import { useEffect } from 'react'

interface Props {
  productId: string
  slug: string | null
  name: string
  cover: string | null
  price: number
  category: string
  subcategory: string | null
}

const KEY = 'estestore.recentlyViewed.v1'
const MAX_ITEMS = 12

export interface RecentlyViewedItem {
  id: string
  slug: string | null
  name: string
  cover: string | null
  price: number
  category: string
  subcategory: string | null
  viewedAt: number
}

export default function RecentlyViewedTracker({
  productId,
  slug,
  name,
  cover,
  price,
  category,
  subcategory,
}: Props) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(KEY)
      const list: RecentlyViewedItem[] = raw ? JSON.parse(raw) : []
      const filtered = list.filter(i => i.id !== productId)
      const next: RecentlyViewedItem[] = [
        {
          id: productId,
          slug,
          name,
          cover,
          price,
          category,
          subcategory,
          viewedAt: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_ITEMS)
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // localStorage doluysa / private mode'da sessiz geç
    }
  }, [productId, slug, name, cover, price, category, subcategory])

  return null
}
