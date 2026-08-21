"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Option = {
  id: number;
  name: string;
};

type Tool = {
  id: number;
  name: string;
  url: string;
  documentation_url?: string | null;
  description: string;
  usage?: string | null;
  examples?: string | null;
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

function getCookie(name: string) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

export default function ToolDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id;

  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTool() {
      try {
        const response = await fetch(
          `http://localhost:8201/api/tools/${id}`,
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

        if (response.status === 404) {
          setError("Инструментът не е намерен.");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load tool");
        }

        const data = await response.json();
        setTool(data);
      } catch (error) {
        console.error(error);
        setError("Неуспешно зареждане на инструмента.");
      } finally {
        setLoading(false);
      }
    }

    loadTool();
  }, [id, router]);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Сигурни ли сте, че искате да изтриете този инструмент?"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const xsrfToken = getCookie("XSRF-TOKEN");

      const response = await fetch(
        `http://localhost:8201/api/tools/${id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-XSRF-TOKEN": xsrfToken ?? "",
          },
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Could not delete tool");
      }

      router.push("/tools");
    } catch (error) {
      console.error(error);
      setError("Неуспешно изтриване на инструмента.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="AI инструмент">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
          Зареждане...
        </div>
      </AppShell>
    );
  }

  if (error && !tool) {
    return (
      <AppShell title="AI инструмент">
        <div
          role="alert"
          className="rounded-xl bg-red-50 p-5 text-red-700"
        >
          {error}
        </div>

        <button
          type="button"
          onClick={() => router.push("/tools")}
          className="mt-5 rounded-lg border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50"
        >
          ← Назад към инструментите
        </button>
      </AppShell>
    );
  }

  if (!tool) {
    return null;
  }

  return (
    <AppShell title={tool.name}>
      <div className="mx-auto max-w-4xl">
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {tool.name}
                </h2>

                {tool.difficulty && (
                  <span className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold capitalize text-amber-800">
                    {tool.difficulty}
                  </span>
                )}
              </div>

              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Отвори инструмента ↗
              </a>
            </div>

            <p className="mt-6 whitespace-pre-line leading-7 text-slate-600">
              {tool.description}
            </p>
          </div>

          {tool.image && (
            <div className="border-b border-slate-200 bg-slate-50 p-6 sm:p-8">
              <img
                src={`http://localhost:8201/storage/${tool.image}`}
                alt={`Screenshot на ${tool.name}`}
                className="max-h-[500px] w-full rounded-xl border border-slate-200 object-contain"
              />
            </div>
          )}

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Категории
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {tool.categories.length > 0 ? (
                  tool.categories.map((category) => (
                    <span
                      key={category.id}
                      className="rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
                    >
                      {category.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    Няма категории
                  </span>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Препоръчителни роли
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {tool.roles.length > 0 ? (
                  tool.roles.map((role) => (
                    <span
                      key={role.id}
                      className="rounded-full bg-purple-50 px-3 py-1.5 text-sm text-purple-700"
                    >
                      {role.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    Няма роли
                  </span>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Тагове
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">
                {tool.tags.length > 0 ? (
                  tool.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    Няма тагове
                  </span>
                )}
              </div>
            </section>

            {tool.user && (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Добавен от
                </h3>

                <p className="mt-3 font-medium text-slate-800">
                  {tool.user.name}
                </p>
              </section>
            )}
          </div>

          {(tool.usage || tool.examples || tool.documentation_url) && (
            <div className="space-y-8 border-t border-slate-200 p-6 sm:p-8">
              {tool.usage && (
                <section>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Как се използва
                  </h3>

                  <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                    {tool.usage}
                  </p>
                </section>
              )}

              {tool.examples && (
                <section>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Реални примери
                  </h3>

                  <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                    {tool.examples}
                  </p>
                </section>
              )}

              {tool.documentation_url && (
                <section>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Официална документация
                  </h3>

                  <a
                    href={tool.documentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block font-medium text-blue-600 hover:underline"
                  >
                    {tool.documentation_url} ↗
                  </a>
                </section>
              )}
            </div>
          )}
        </article>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/tools")}
            className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50"
          >
            ← Назад
          </button>

          <button
            type="button"
            onClick={() => router.push(`/tools/${tool.id}/edit`)}
            className="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-800"
          >
            Редакция
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-5 py-2.5 font-semibold text-red-700 hover:bg-red-50"
          >
            {deleting ? "Изтриване..." : "Изтрий"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}