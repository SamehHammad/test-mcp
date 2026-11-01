import Link from "next/link";
import { money } from "@/components/ui";
import { listActiveProductsCached } from "@/services/product-service";

export default async function Home() {
  const products = await listActiveProductsCached();
  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Catalogue</h1>
        <Link href="/admin/products" className="text-sm text-neutral-600 hover:underline">
          Admin
        </Link>
      </header>
      {products.length === 0 && <p className="text-neutral-600">No active products.</p>}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <li key={p.id} className="rounded-lg border p-4">
            {p.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.name} className="mb-3 h-40 w-full rounded object-cover" />
            )}
            <p className="text-xs text-neutral-500">{p.category?.name ?? "Uncategorised"}</p>
            <h2 className="font-medium">{p.name}</h2>
            <p className="mb-2 line-clamp-2 text-sm text-neutral-600">{p.description}</p>
            <p className="flex justify-between text-sm">
              <span className="font-semibold">{money(p.priceCents, p.currency)}</span>
              <span className={p.stock > 0 ? "text-neutral-500" : "text-red-700"}>
                {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
