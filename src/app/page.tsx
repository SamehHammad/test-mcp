import Link from "next/link";
import { removeProduct } from "@/app/admin/actions";
import { ConfirmDelete } from "@/components/confirm-delete";
import { btnCls, btnGhostCls, money } from "@/components/ui";
import { listActiveProductsCached } from "@/services/product-service";

export default async function Home() {
  const products = await listActiveProductsCached();
  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Catalogue</h1>
        <div className="flex gap-2">
          <Link href="/admin/categories" className={btnGhostCls}>
            Categories
          </Link>
          <Link href="/admin/products/new" className={btnCls}>
            + Add product
          </Link>
        </div>
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
              <th className="p-3 text-right">Actions</th>
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
                <td className="p-3">
                  <span className="flex items-center justify-end gap-3">
                    <Link href={`/admin/products/${p.id}`} className={btnGhostCls}>
                      Edit
                    </Link>
                    <ConfirmDelete name={p.name} action={removeProduct.bind(null, p.id, p.name)} />
                  </span>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-neutral-500">
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
