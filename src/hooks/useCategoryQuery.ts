import { useRouter } from "next/router";

export type PageCategory = "char" | "eidos";

export default function useCategoryQuery() {
  const { query } = useRouter();
  const category: PageCategory = query.cat === "eidos" ? "eidos" : "char";

  return category;
}
