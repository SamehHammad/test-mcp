import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { listCategories } from "@/services/category-service";
import { ServiceError } from "@/services/errors";
import { getProduct } from "@/services/product-service";

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const product = await getProduct({ id }).catch((e) => {
    if (e instanceof ServiceError && e.code === "NOT_FOUND") notFound();
    throw e;
  });
  const categories = await listCategories();
  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Edit product</h1>
      <ProductForm product={product} categories={categories} />
    </>
  );
}
