import { ProductForm } from "@/components/product-form";
import { requireAdmin } from "@/lib/session";
import { listCategories } from "@/services/category-service";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">New product</h1>
      <ProductForm categories={categories} />
    </>
  );
}
