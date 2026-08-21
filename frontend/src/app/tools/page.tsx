"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Option = {
  id: number;
  name: string;
};

type Tool = {
  id: number;
  name: string;
  url: string;
  description: string;
  difficulty?: string | null;
  image?: string | null;
  categories: Option[];
  roles: Option[];
  tags: Option[];
  user?: {
    id: number;
    name: string;
  };
};

type ApiResponse = {
  data: Tool[];
};

export default function ToolsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);
  const [tags, setTags] = useState<Option[]>([]);

  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const submitted = searchParams.get("submitted") === "1";

  async function loadOptions() {
    try {
      const [categoriesRes, rolesRes, tagsRes] = await Promise.all([
        fetch("http://localhost:8201/api/categories", {
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
        fetch("http://localhost:8201/api/roles", {
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
        fetch("http://localhost:8201/api/tags", {
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
      ]);

      if (
        categoriesRes.status === 401 ||
        rolesRes.status === 401 ||
        tagsRes.status === 401
      ) {
        router.replace("/login");
        return;
      }

      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (tagsRes.ok) setTags(await tagsRes.json());
    } catch (err) {
      console.error("Failed to load filter options:", err);
    }
  }

  async function loadTools() {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    if (nameFilter) params.set("name", nameFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (roleFilter) params.set("role", roleFilter);
    if (tagFilter) params.set("tag", tagFilter);

    try {
      const response = await fetch(
        `http://localhost:8201/api/tools?${params.toString()}`,
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load tools");
      }

      const data: ApiResponse = await response.json();
      setTools(data.data ?? []);
    } catch (err) {
      console.error(err);
      setError("Неуспешно зареждане на инструментите.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
    loadTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterSubmit(event: React.FormEvent) {
    event.preventDefault();
    loadTools();
  }

  function clearFilters() {
    setNameFilter("");
    setCategoryFilter("");
    setRoleFilter("");
    setTagFilter("");

    setTimeout(() => {
      loadTools();
    }, 0);
  }

  return (
    <AppShell title="AI инструменти">
      {submitted && (
        <div
          role="status"
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800"
        >
          Инструментът е изпратен успешно и очаква одобрение от администратор.
          След одобрение ще се появи в този списък.
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-600">
          Разглеждай, филтрирай и управлявай одобрените AI инструменти.
        </p>

        <button
          onClick={() => router.push("/tools/new")}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          + Добави инструмент
        </button>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 font-semibold text-slate-900">Филтри</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <input
            aria-label="Търси по име"
            placeholder="Търси по име..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5"
          />

          <select
            aria-label="Филтър по категория"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5"
          >
            <option value="">Всички категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Филтър по роля"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5"
          >
            <option value="">Всички роли</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Филтър по таг"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5"
          >
            <option value="">Всички тагове</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Филтрирай
          </button>

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
          >
            Изчисти
          </button>
        </div>
      </form>

      {loading && <p className="text-slate-500">Зареждане...</p>}

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && tools.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h3 className="font-semibold">Няма намерени инструменти</h3>
          <p className="mt-2 text-sm text-slate-500">
            Промени филтрите или добави нов AI tool.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <article
            key={tool.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{tool.name}</h2>

              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                {tool.description}
              </p>

              {tool.difficulty && (
                <span className="mt-4 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                  {tool.difficulty}
                </span>
              )}

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Categories
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {tool.categories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase text-slate-400">
                  Roles
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {tool.roles.map((role) => (
                    <span
                      key={role.id}
                      className="rounded-full bg-purple-50 px-2.5 py-1 text-xs text-purple-700"
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => router.push(`/tools/${tool.id}`)}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Преглед
              </button>

              <button
                onClick={() => router.push(`/tools/${tool.id}/edit`)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold"
              >
                Редакция
              </button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
