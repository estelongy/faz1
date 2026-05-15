'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { FilterInput } from '@/components/FilterInput'
import { BRANCHES, ALL_TREATMENTS, LOCATIONS, branchMatches, locationMatches } from '@/lib/randevu-filters'
import ClinicCard, { type ClinicRow } from './ClinicCard'

/**
 * /esteklinik arama motoru — RandevuFlow'daki "Klinik Seçin" UX'inin aynısı.
 * Compound: Provider ile sarmalanır, Inputs + Results ayrı yerlerde render olur.
 *
 *   <SearchProvider clinics={...}>
 *     <section className="hero green"><Inputs /></section>
 *     <section className="white"><Results /></section>
 *   </SearchProvider>
 */

interface Ctx {
  uzman: string
  branch: string
  treatment: string
  location: string
  setUzman: (v: string) => void
  setBranch: (v: string) => void
  setTreatment: (v: string) => void
  setLocation: (v: string) => void
  clearAll: () => void
  uzmanSuggestions: string[]
  filtered: ClinicRow[]
  hasFilter: boolean
}

const SearchCtx = createContext<Ctx | null>(null)

function useSearch() {
  const ctx = useContext(SearchCtx)
  if (!ctx) throw new Error('SearchProvider missing')
  return ctx
}

export function KlinikSearchProvider({ clinics, children }: { clinics: ClinicRow[]; children: ReactNode }) {
  const [uzman, setUzman] = useState('')
  const [branch, setBranch] = useState('')
  const [treatment, setTreatment] = useState('')
  const [location, setLocation] = useState('')

  const uzmanSuggestions = useMemo(
    () => clinics.map(c => c.name).sort((a, b) => a.localeCompare(b, 'tr')),
    [clinics]
  )

  const filtered = useMemo(() => {
    return clinics.filter(c => {
      if (uzman && !c.name.toLowerCase().includes(uzman.toLowerCase())) return false
      if (branch && !branchMatches(c.clinic_type, branch)) return false
      if (treatment && !(c.specialties?.some(s => s.toLowerCase().includes(treatment.toLowerCase())))) return false
      if (location && !locationMatches(c.location, location)) return false
      return true
    })
  }, [clinics, uzman, branch, treatment, location])

  const hasFilter = !!(uzman || branch || treatment || location)
  const clearAll = () => {
    setUzman('')
    setBranch('')
    setTreatment('')
    setLocation('')
  }

  return (
    <SearchCtx.Provider value={{
      uzman, branch, treatment, location,
      setUzman, setBranch, setTreatment, setLocation,
      clearAll, uzmanSuggestions, filtered, hasFilter,
    }}>
      {children}
    </SearchCtx.Provider>
  )
}

/** 4'lü autocomplete arama bar — hero içinde render edilir */
export function KlinikSearchInputs() {
  const s = useSearch()

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <FilterInput
          placeholder="Uzman ara... (ör: İzzet Gök)"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          value={s.uzman}
          suggestions={s.uzmanSuggestions}
          onSelect={s.setUzman}
          onClear={() => s.setUzman('')}
          theme="emerald"
        />
        <FilterInput
          placeholder="Branş ara... (ör: Cildiye)"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          value={s.branch}
          suggestions={BRANCHES}
          onSelect={s.setBranch}
          onClear={() => s.setBranch('')}
          theme="emerald"
        />
        <FilterInput
          placeholder="Tedavi ara... (ör: Meme dikleştirme)"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
          value={s.treatment}
          suggestions={ALL_TREATMENTS}
          onSelect={s.setTreatment}
          onClear={() => s.setTreatment('')}
          theme="emerald"
        />
        <FilterInput
          placeholder="Konum ara... (ör: Beylikdüzü)"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          value={s.location}
          suggestions={LOCATIONS}
          onSelect={s.setLocation}
          onClear={() => s.setLocation('')}
          theme="emerald"
        />
      </div>

      {s.hasFilter && (
        <div className="flex items-center justify-between text-sm pt-2.5 mt-1">
          <span className="text-emerald-100/80">{s.filtered.length} klinik bulundu</span>
          <button
            onClick={s.clearAll}
            className="text-emerald-300 hover:text-white transition-colors font-medium"
          >
            Tüm filtreleri temizle
          </button>
        </div>
      )}
    </>
  )
}

/** Sonuç grid — beyaz zemin section'ında render edilir */
export function KlinikSearchResults() {
  const s = useSearch()

  if (s.filtered.length === 0) {
    return (
      <div className="text-center py-16 bg-[#FAFAF7] rounded-2xl border border-slate-200">
        <div className="text-5xl opacity-30 mb-3">🏥</div>
        <p className="text-slate-900 font-semibold">Arama kriterlerine uygun klinik bulunamadı</p>
        <button
          onClick={s.clearAll}
          className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-[#10876B] hover:bg-[#0E7559] text-white text-sm font-semibold transition-colors"
        >
          Filtreleri temizle
        </button>
      </div>
    )
  }

  return (
    <>
      <p className="text-slate-500 text-sm mb-4">{s.filtered.length} klinik</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {s.filtered.map(c => <ClinicCard key={c.id} clinic={c} />)}
      </div>
    </>
  )
}
