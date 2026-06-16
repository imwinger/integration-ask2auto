import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import KanbanBoard from "./KanbanBoard";
import type { PicTag, SubmissionCard } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  const [subs, pics] = await Promise.all([
    prisma.submission.findMany({
      include: { salePics: true, productPics: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pic.findMany({ orderBy: { name: "asc" } }),
  ]);

  const cards: SubmissionCard[] = subs.map((s) => ({
    id: s.id,
    createdAt: s.createdAt.toISOString(),
    status: s.status,
    orgName: s.orgName,
    needsIntegration: s.needsIntegration,
    fileCount: s.fileCount,
    salePics: s.salePics.map((p) => ({ id: p.id, name: p.name, type: p.type as "sale" | "product" })),
    productPics: s.productPics.map((p) => ({ id: p.id, name: p.name, type: p.type as "sale" | "product" })),
  }));

  const picTags: PicTag[] = pics.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type as "sale" | "product",
  }));

  return <KanbanBoard initialSubmissions={cards} initialPics={picTags} />;
}
