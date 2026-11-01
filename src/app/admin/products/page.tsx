import Link from "next/link";
import { ConfirmDelete } from "@/components/confirm-delete";
import { btnCls, btnGhostCls, inputCls, money, StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/session";
import { statusSchema } from "@/schemas/product";
import { listProducts } from "@/services/product-service";
import { removeProduct } from "../actions";

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q);
  const status = statusSchema.safeParse(one(sp.status)).data;
  const page = Math.max(1, parseInt(one(sp.page) || "1", 10) || 1);
  const result = await listProducts({ q: q || undefined, status, page, pageSize: 10 });

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `/admin/products?${params}`;
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Products ({result.total})</h1>
        <Link href="/admin/products/new" className={btnCls}>
          New product
        </Link>
      </div>
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search…" className={`${inputCls} !w-64`} />
        <select name="status" defaultValue={status ?? ""} className={`${inputCls} !w-40`}>
          <option value="">All statuses</option>
          <option>ACTIVE</option>
          <option>DRAFT</option>
          <option>ARCHIVED</option>
        </select>
        <button className={btnGhostCls}>Filter</button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Price</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Status</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {result.items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-medium">{p.name}</td>
                <td className="p-2">{p.category?.name ?? "—"}</td>
                <td className="p-2">{money(p.priceCents, p.currency)}</td>
                <td className="p-2">{p.stock}</td>
                <td className="p-2">
                  <StatusBadge status={p.status} />
                </td>
                <td className="flex justify-end gap-3 p-2">
                  <Link href={`/admin/products/${p.id}`} className="hover:underline">
                    Edit
                  </Link>
                  <ConfirmDelete name={p.name} action={removeProduct.bind(null, p.id, p.name)} />
                </td>
              </tr>
            ))}
            {result.items.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-neutral-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm">
        {page > 1 && <Link href={href(page - 1)}>← Prev</Link>}
        <span className="text-neutral-500">
          Page {result.page} of {result.totalPages}
        </span>
        {page < result.totalPages && <Link href={href(page + 1)}>Next →</Link>}
      </div>
    </>
  );
}
