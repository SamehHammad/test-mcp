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
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3 font-medium">
                  <span className="flex items-center gap-3">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                    )}
                    {p.name}
                  </span>
                </td>
                <td className="p-3">{p.category?.name ?? "—"}</td>
                <td className="p-3 text-neutral-600">{p.description}</td>
                <td className="p-3 text-right font-semibold">{money(p.priceCents, p.currency)}</td>
                <td className={`p-3 text-right ${p.stock > 0 ? "text-neutral-600" : "text-red-700"}`}>
                  {p.stock > 0 ? p.stock : "Out of stock"}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-neutral-500">
                  No active products.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
