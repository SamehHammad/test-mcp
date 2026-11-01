import { CategoryForm } from "@/components/category-form";
import { CategoryRow } from "@/components/category-row";
import { listCategories } from "@/services/category-service";

export default async function CategoriesPage() {
  const categories = await listCategories();
  return (
    <>
      <h1 className="mb-4 text-xl font-semibold">Categories</h1>
      <div className="mb-6">
        <CategoryForm />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-neutral-500">
          <tr>
            <th className="p-2" colSpan={2}>
              Name / slug
            </th>
            <th className="p-2">Products</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </tbody>
      </table>
    </>
  );
}
