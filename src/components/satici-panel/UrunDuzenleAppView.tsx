import UrunDuzenleForm from '@/app/satici/panel/urunler/[id]/duzenle/UrunDuzenleForm'

type ProductInit = Parameters<typeof UrunDuzenleForm>[0]['product']

interface Props {
  vendorId: string
  product: ProductInit
}

export default function UrunDuzenleAppView({ vendorId, product }: Props) {
  return (
    <div
      className="-m-4 lg:-m-8 min-h-screen bg-slate-950 text-white"
      style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-4 pb-3">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-400/80">Ürün Düzenle</p>
        <p className="mt-1 text-base font-semibold text-white truncate">{product.name}</p>
      </header>

      <div className="mx-5 mt-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
        İçerik değişikliği yaparsan ürün tekrar admin onayına düşer ve geçici pasif olur.
      </div>

      <section className="px-5 mt-4">
        <UrunDuzenleForm vendorId={vendorId} product={product} />
      </section>
    </div>
  )
}
