"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  ReactFlowInstance,
  getRectOfNodes,
  getTransformForBounds,
} from "reactflow";
import "reactflow/dist/style.css";
import PersonNode from "@/components/tree/PersonNode";

type Person = {
  id: string;
  first_name: string;
  last_name: string;
  ethnicity?: string | null;
  avatar_url?: string | null;
};

type Relationship = {
  id: string;
  from_person_id: string;
  to_person_id: string;
  relation_type: "FATHER" | "MOTHER" | "CHILD";
};

const nodeTypes = { person: PersonNode } as const;

const H_SPACING = 280; // فاصله افقی
const V_SPACING = 240; // فاصله عمودی (نسل‌ها)

function normalizeToParentChild(r: Relationship) {
  // هدف: همیشه edge از والد -> فرزند باشد
  // CHILD: from = parent, to = child
  // FATHER/MOTHER: to = parent, from = child
  if (r.relation_type === "CHILD") {
    return { parentId: r.from_person_id, childId: r.to_person_id };
  }
  return { parentId: r.to_person_id, childId: r.from_person_id };
}

export default function TreePage() {
  const [root, setRoot] = useState<Person | null>(null);
  const [rels, setRels] = useState<Relationship[]>([]);
  const [personsMap, setPersonsMap] = useState<Record<string, Person>>({});
  const [loading, setLoading] = useState(true);

  const rfRef = useRef<HTMLDivElement | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/tree/root");
      const json = await res.json();
      if (res.ok) {
        setRoot(json.root);
        const map: Record<string, Person> = {};
        map[json.root.id] = json.root;
        for (const p of json.relatedPersons ?? []) map[p.id] = p;
        setPersonsMap(map);
        setRels(json.relationships ?? []);
      }
      setLoading(false);
    })();
  }, []);

  const nodeTypesMemo = useMemo(() => nodeTypes, []);

  const { nodes, edges } = useMemo(() => {
    if (!root) return { nodes: [], edges: [] };

    // 1) adjacency بر اساس parent -> child
    const parentsOf: Record<string, string[]> = {};
    const childrenOf: Record<string, string[]> = {};
    const allEdges: { id: string; parentId: string; childId: string }[] = [];

    for (const r of rels) {
      const { parentId, childId } = normalizeToParentChild(r);
      allEdges.push({ id: r.id, parentId, childId });

      if (!parentsOf[childId]) parentsOf[childId] = [];
      if (!childrenOf[parentId]) childrenOf[parentId] = [];

      parentsOf[childId].push(parentId);
      childrenOf[parentId].push(childId);
    }

    // 2) فقط کامپوننت متصل به روت را نمایش بدهیم
    const visible = new Set<string>();
    const q: string[] = [root.id];
    visible.add(root.id);

    while (q.length) {
      const cur = q.shift()!;
      const ps = parentsOf[cur] ?? [];
      const cs = childrenOf[cur] ?? [];
      for (const p of ps) {
        if (!visible.has(p)) {
          visible.add(p);
          q.push(p);
        }
      }
      for (const c of cs) {
        if (!visible.has(c)) {
          visible.add(c);
          q.push(c);
        }
      }
    }

    // 3) level assignment: روت = 0 | والدین = -1 | فرزندان = +1
    const levelOf = new Map<string, number>();
    levelOf.set(root.id, 0);
    const qq: string[] = [root.id];

    while (qq.length) {
      const cur = qq.shift()!;
      const lvl = levelOf.get(cur)!;

      for (const p of parentsOf[cur] ?? []) {
        if (!visible.has(p)) continue;
        if (!levelOf.has(p)) {
          levelOf.set(p, lvl - 1);
          qq.push(p);
        }
      }
      for (const c of childrenOf[cur] ?? []) {
        if (!visible.has(c)) continue;
        if (!levelOf.has(c)) {
          levelOf.set(c, lvl + 1);
          qq.push(c);
        }
      }
    }

    // 4) گروه‌بندی بر اساس level
    const byLevel = new Map<number, string[]>();
    for (const id of visible) {
      const lvl = levelOf.get(id) ?? 0;
      if (!byLevel.has(lvl)) byLevel.set(lvl, []);
      byLevel.get(lvl)!.push(id);
    }

    const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
    const minLevel = levels[0] ?? 0;
    const maxLevel = levels[levels.length - 1] ?? 0;

    // 5) Ordering داخل هر level برای کاهش تداخل (heuristic ساده)
    const orderIndexByLevel = new Map<number, Map<string, number>>();

    const setOrder = (lvl: number, ids: string[]) => {
      const m = new Map<string, number>();
      ids.forEach((id, i) => m.set(id, i));
      orderIndexByLevel.set(lvl, m);
      byLevel.set(lvl, ids);
    };

    setOrder(0, [root.id]);

    // پایین (فرزندان)
    for (let lvl = 1; lvl <= maxLevel; lvl++) {
      const ids = (byLevel.get(lvl) ?? []).slice();
      const prevIdx = orderIndexByLevel.get(lvl - 1);

      ids.sort((a, b) => {
        const aParents = parentsOf[a] ?? [];
        const bParents = parentsOf[b] ?? [];

        const aAnchor =
          aParents.length && prevIdx
            ? aParents.reduce((s, p) => s + (prevIdx.get(p) ?? 0), 0) /
              aParents.length
            : Number.POSITIVE_INFINITY;

        const bAnchor =
          bParents.length && prevIdx
            ? bParents.reduce((s, p) => s + (prevIdx.get(p) ?? 0), 0) /
              bParents.length
            : Number.POSITIVE_INFINITY;

        if (aAnchor !== bAnchor) return aAnchor - bAnchor;
        return a.localeCompare(b);
      });

      setOrder(lvl, ids);
    }

    // بالا (اجداد)
    for (let lvl = -1; lvl >= minLevel; lvl--) {
      const ids = (byLevel.get(lvl) ?? []).slice();
      const nextIdx = orderIndexByLevel.get(lvl + 1);

      ids.sort((a, b) => {
        const aChildren = childrenOf[a] ?? [];
        const bChildren = childrenOf[b] ?? [];

        const aAnchor =
          aChildren.length && nextIdx
            ? aChildren.reduce((s, c) => s + (nextIdx.get(c) ?? 0), 0) /
              aChildren.length
            : Number.POSITIVE_INFINITY;

        const bAnchor =
          bChildren.length && nextIdx
            ? bChildren.reduce((s, c) => s + (nextIdx.get(c) ?? 0), 0) /
              bChildren.length
            : Number.POSITIVE_INFINITY;

        if (aAnchor !== bAnchor) return aAnchor - bAnchor;
        return a.localeCompare(b);
      });

      setOrder(lvl, ids);
    }

    // 6) ساخت Nodes با position های عمودی
    const nodes: Node[] = [];
    for (const lvl of levels) {
      const ids = byLevel.get(lvl) ?? [];
      const n = ids.length;
      for (let i = 0; i < n; i++) {
        const id = ids[i];
        const person = personsMap[id];
        if (!person) continue;

        const x = (i - (n - 1) / 2) * H_SPACING;
        const y = lvl * V_SPACING;

        nodes.push({
          id,
          type: "person",
          position: { x, y },
          data: {
            person,
            onOpen: (pid: string) => (window.location.href = `/person/${pid}`),
          },
        });
      }
    }

    // 7) edges فقط برای نودهای visible
    const edges: Edge[] = [];
    for (const e of allEdges) {
      if (!visible.has(e.parentId) || !visible.has(e.childId)) continue;
      edges.push({
        id: e.id,
        source: e.parentId,
        target: e.childId,
        type: "smoothstep",
      });
    }

    return { nodes, edges };
  }, [root, rels, personsMap]);

  // FitView بعد از آماده شدن
  useEffect(() => {
    if (!rfInstance) return;
    if (!nodes.length) return;
    const t = setTimeout(() => {
      rfInstance.fitView({ padding: 0.2, duration: 300 });
    }, 50);
    return () => clearTimeout(t);
  }, [rfInstance, nodes.length]);

  const exportJpg = useCallback(async () => {
    if (!rfRef.current) return;
    if (!nodes.length) return;

    const { toJpeg } = await import("html-to-image");
    const viewport = rfRef.current.querySelector(
      ".react-flow__viewport"
    ) as HTMLElement | null;
    if (!viewport) return;

    const bounds = getRectOfNodes(nodes);
    const padding = 80;
    const width = Math.max(800, Math.ceil(bounds.width + padding * 2));
    const height = Math.max(600, Math.ceil(bounds.height + padding * 2));

    const [tx, ty, tscale] = getTransformForBounds(bounds, width, height, 0.5, 2);

    const dataUrl = await toJpeg(viewport, {
      backgroundColor: "#ffffff",
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${tx}px, ${ty}px) scale(${tscale})`,
      },
    });

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "family-tree.jpg";
    a.click();
  }, [nodes]);

  const exportPdf = useCallback(async () => {
    if (!rfRef.current) return;
    if (!nodes.length) return;

    const { toPng } = await import("html-to-image");
    const jsPDFMod = await import("jspdf");
    const jsPDF = jsPDFMod.default;

    const viewport = rfRef.current.querySelector(
      ".react-flow__viewport"
    ) as HTMLElement | null;
    if (!viewport) return;

    const bounds = getRectOfNodes(nodes);
    const padding = 80;
    const width = Math.max(800, Math.ceil(bounds.width + padding * 2));
    const height = Math.max(600, Math.ceil(bounds.height + padding * 2));

    const [tx, ty, tscale] = getTransformForBounds(bounds, width, height, 0.5, 2);

    const dataUrl = await toPng(viewport, {
      backgroundColor: "#ffffff",
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${tx}px, ${ty}px) scale(${tscale})`,
      },
    });

    const orientation = width >= height ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "pt",
      format: [width, height],
    });

    pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
    pdf.save("family-tree.pdf");
  }, [nodes]);

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-600">
        در حال بارگذاری شجره‌نامه…
      </div>
    );
  }

  if (!root) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-lg font-semibold">شجره‌نامه شما هنوز ساخته نشده</div>
          <div className="mt-2 text-sm text-gray-600">
            ابتدا یک پروفایل (شخص اصلی) ایجاد کنید.
          </div>
          <a
            className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            href="/profile"
          >
            رفتن به پروفایل
          </a>
        </div>
      </div>
    );
  }

  const hasAny = rels.length > 0;

  // ✅ فقط همین دو مقدار برای سازگاری با Header/Footer:
  const HEADER_H = 72;
  const FOOTER_H = 76;

  return (
    <div
      ref={rfRef}
      className="relative w-full"
      style={{ height: `calc(100dvh - ${HEADER_H}px - ${FOOTER_H}px)` }}
    >
      {/* نوار ابزار بالا */}
      <div className="absolute left-4 top-4 z-50 flex items-center gap-2 rounded-xl border bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
        <button
          className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-gray-50"
          onClick={() => rfInstance?.fitView({ padding: 0.2, duration: 300 })}
        >
          Fit
        </button>
        <button
          className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-gray-50"
          onClick={exportJpg}
        >
          دانلود JPG
        </button>
        <button
          className="rounded-lg border bg-white px-3 py-2 text-xs hover:bg-gray-50"
          onClick={exportPdf}
        >
          دانلود PDF
        </button>
      </div>

      {!hasAny && (
        <div className="absolute right-4 top-4 z-50 w-[320px] rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold">شجره‌نامه شما هنوز کامل نیست</div>
          <div className="mt-1 text-xs text-gray-600">
            از همینجا پدر/مادر/فرزند را اضافه کنید.
          </div>
          <div className="mt-3 flex gap-2">
            <a
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white"
              href={`/person/new?rel=father&target=${root.id}`}
            >
              افزودن پدر
            </a>
            <a
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white"
              href={`/person/new?rel=mother&target=${root.id}`}
            >
              افزودن مادر
            </a>
            <a
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white"
              href={`/person/new?rel=child&target=${root.id}`}
            >
              افزودن فرزند
            </a>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypesMemo}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        onInit={setRfInstance}
        style={{ width: "100%", height: "100%" }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}