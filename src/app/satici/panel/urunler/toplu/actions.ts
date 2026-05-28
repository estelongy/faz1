'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { EsteStoreCategory } from '@/lib/estestore'

export interface BulkProductRow {
  rowNumber: number  // CSV'deki gerçek satır numarası (header dahil — 2'den başlar)
  name: string
  uts_no: string
  category: EsteStoreCategory
  subcategory: string | null
  description: string | null
  price: number | null
  stock: number | null
  ingredients: string[] | null
  images: string[] | null
  errors: string[]
}

export interface BulkUploadResult {
  inserted: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseNumber(v: string): number | null {
  if (!v || !v.trim()) return null
  const s = v.trim().replace(/\./g, '').replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function parseImages(v: string | undefined): string[] | null {
  if (!v) return null
  const urls = v.split(/[|\n,;]+/).map(s => s.trim()).filter(s => s.startsWith('http'))
  return urls.length > 0 ? urls : null
}

function parseIngredients(v: string | undefined): string[] | null {
  if (!v) return null
  const arr = v.split(/[|,]/).map(s => s.trim()).filter(Boolean)
  return arr.length > 0 ? arr : null
}

/**
 * CSV satırlarını valide eder ve preview döner. Hiçbir veriyi yazmaz.
 */
export async function validateBulkRowsAction(
  rows: Record<string, string>[],
): Promise<{ ok: boolean; error?: string; preview?: BulkProductRow[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'vendor') return { ok: false, error: 'İş Ortağı yetkisi gerekli.' }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') {
    return { ok: false, error: 'Onaylı satıcı hesabı gerekli.' }
  }

  if (!rows || rows.length === 0) return { ok: false, error: 'CSV boş.' }
  if (rows.length > 500) return { ok: false, error: 'Tek seferde maksimum 500 ürün yüklenebilir.' }

  const preview: BulkProductRow[] = rows.map((r, idx) => {
    const errors: string[] = []
    const rowNumber = idx + 2

    const name = (r.name ?? r['ürün adı'] ?? r['urun adi'] ?? '').trim()
    if (!name) errors.push('Ürün adı zorunlu')

    const uts_no = (r.uts_no ?? r['uts no'] ?? r['üts no'] ?? '').trim()
    if (!uts_no) errors.push('ÜTS numarası zorunlu')
    else if (uts_no.length < 5) errors.push('ÜTS en az 5 karakter olmalı')

    const catRaw = (r.category ?? r.kategori ?? '').trim().toLowerCase().replace(/[\s-]/g, '_')
    let category: EsteStoreCategory = 'kozmetik'
    if (catRaw === 'kozmetik' || catRaw === 'sarf_medikal') {
      category = catRaw as EsteStoreCategory
    } else {
      errors.push(`Kategori "${r.category ?? ''}" geçersiz — kozmetik veya sarf_medikal olmalı`)
    }

    const subcategory = (r.subcategory ?? r['alt kategori'] ?? '').trim() || null
    const description = (r.description ?? r['açıklama'] ?? r.aciklama ?? '').trim() || null

    const price = parseNumber(r.price ?? r.fiyat ?? '')
    if (price === null) errors.push('Geçerli fiyat zorunlu')
    else if (price <= 0) errors.push('Fiyat 0\'dan büyük olmalı')

    const stockRaw = r.stock ?? r.stok ?? ''
    const stock = stockRaw ? parseNumber(stockRaw) : null

    const ingredients = parseIngredients(r.ingredients ?? r['icerik'] ?? r['içerik'])
    const images = parseImages(r.images ?? r['gorseller'] ?? r['görseller'])

    return {
      rowNumber, name, uts_no, category, subcategory, description,
      price, stock, ingredients, images, errors,
    }
  })

  return { ok: true, preview }
}

/**
 * Validated satırları DB'ye yazar. Sadece hata içermeyen satırları işler.
 */
export async function bulkInsertProductsAction(
  validRows: BulkProductRow[],
): Promise<{ ok: boolean; error?: string; result?: BulkUploadResult }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'vendor') return { ok: false, error: 'İş Ortağı yetkisi gerekli.' }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') {
    return { ok: false, error: 'Onaylı satıcı hesabı gerekli.' }
  }

  const eligible = validRows.filter(r => r.errors.length === 0)
  if (eligible.length === 0) return { ok: false, error: 'Yüklenebilir satır yok.' }

  const errors: Array<{ row: number; message: string }> = []
  let inserted = 0

  // Tek tek insert — toplu insert için unique slug suffix gerekiyor
  for (const r of eligible) {
    const baseSlug = slugify(r.name)
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    const cover = r.images?.[0] ?? null

    const { error: insErr } = await supabase.from('products').insert({
      vendor_id:       vendor.id,
      name:            r.name,
      uts_no:          r.uts_no,
      slug,
      category:        r.category,
      subcategory:     r.subcategory,
      treatment_type:  'product',
      description:     r.description,
      price:           r.price,
      stock:           r.stock,
      ingredients:     r.ingredients,
      images:          r.images,
      cover_image_url: cover,
      pricing_tiers:   [],
      is_active:       false,
      approval_status: 'pending',
    })

    if (insErr) {
      errors.push({ row: r.rowNumber, message: insErr.message })
    } else {
      inserted++
    }
  }

  const skipped = validRows.length - inserted

  revalidatePath('/satici/panel')
  revalidatePath('/satici/panel/urunler/toplu')

  return {
    ok: true,
    result: { inserted, skipped, errors },
  }
}
