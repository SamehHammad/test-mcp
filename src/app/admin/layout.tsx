import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <nav className="mb-6 flex items-center gap-4 border-b pb-3 text-sm">
        <Link href="/admin/products" className="font-medium">
          Products
        </Link>
        <Link href="/admin/categories" className="font-medium">
          Categories
        </Link>
        <Link href="/" className="text-neutral-500">
          Public page
        </Link>
      </nav>
      {children}
    </div>
  );
}
