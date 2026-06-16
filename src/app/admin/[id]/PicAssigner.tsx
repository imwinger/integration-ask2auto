"use client";

import { useState, useCallback } from "react";
import type { PicTag } from "@/lib/types";

export default function PicAssigner({
  submissionId,
  allPics,
  initialSalePicIds,
  initialProductPicIds,
}: {
  submissionId: string;
  allPics: PicTag[];
  initialSalePicIds: string[];
  initialProductPicIds: string[];
}) {
  const [salePicIds, setSalePicIds] = useState<Set<string>>(new Set(initialSalePicIds));
  const [productPicIds, setProductPicIds] = useState<Set<string>>(new Set(initialProductPicIds));
  const [saving, setSaving] = useState(false);

  const salePics = allPics.filter((p) => p.type === "sale");
  const productPics = allPics.filter((p) => p.type === "product");

  const save = useCallback(
    async (newSale: Set<string>, newProduct: Set<string>) => {
      setSaving(true);
      await fetch(`/api/admin/submissions/${submissionId}/pics`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salePicIds: [...newSale], productPicIds: [...newProduct] }),
      });
      setSaving(false);
    },
    [submissionId]
  );

  const toggleSale = (id: string) => {
    const next = new Set(salePicIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSalePicIds(next);
    save(next, productPicIds);
  };

  const toggleProduct = (id: string) => {
    const next = new Set(productPicIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setProductPicIds(next);
    save(salePicIds, next);
  };

  if (!salePics.length && !productPics.length) {
    return (
      <p className="text-sm text-md-on-surface-var">
        Chưa có PIC nào. Vào <span className="font-medium">Quản lý PIC</span> trên Kanban để tạo.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {salePics.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-md-on-surface-var">Sale PIC</p>
          <div className="flex flex-wrap gap-1.5">
            {salePics.map((p) => {
              const active = salePicIds.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleSale(p.id)}
                  disabled={saving}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-[#D6E3FF] text-[#1B3A75] ring-2 ring-[#3F5AA9]"
                      : "bg-md-surface-ctr text-md-on-surface-var hover:bg-[#D6E3FF]/50 hover:text-[#3F5AA9]"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {productPics.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-md-on-surface-var">Product PIC</p>
          <div className="flex flex-wrap gap-1.5">
            {productPics.map((p) => {
              const active = productPicIds.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  disabled={saving}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-[#FFDBC8] text-[#7A3411] ring-2 ring-md-primary"
                      : "bg-md-surface-ctr text-md-on-surface-var hover:bg-[#FFDBC8]/50 hover:text-md-primary"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
