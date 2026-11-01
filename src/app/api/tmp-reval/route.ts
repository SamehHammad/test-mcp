import { revalidateCatalog } from "@/services/revalidate";
export async function POST() {
  revalidateCatalog();
  return Response.json({ ok: true });
}
