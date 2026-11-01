import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
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
        <form action={logout} className="ml-auto">
          <button className="text-neutral-500 hover:underline">Log out</button>
        </form>
      </nav>
      {children}
    </div>
  );
}
