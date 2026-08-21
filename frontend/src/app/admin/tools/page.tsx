"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: number;
  name: string;
};

type Tool = {
  id: number;
  name: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  categories: Option[];
  roles: Option[];
  tags: Option[];
  user?: {
    id: number;
    name: string;
    email: string;
  };
  reviewer?: {
    id: number;
    name: string;
  } | null;
};

type Counts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

type AdminResponse = {
  tools: {
    data: Tool[];
  };
  counts: Counts;
};

function getCookie(name: string) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

async function getFreshCsrfToken(): Promise<string> {
  const response = await fetch(
    "http://localhost:8201/sanctum/csrf-cookie",
    {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`CSRF initialization failed (${response.status})`);
  }

  const token = getCookie("XSRF-TOKEN");

  if (!token) {
    throw new Error("XSRF-TOKEN cookie not found");
  }

  return token;
}

export default function AdminToolsPage() {
  const router = useRouter();

  const [tools, setTools] = useState<Tool[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);

  const [counts, setCounts] = useState<Counts>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadOptions() {
    try {
      const [categoriesResponse, rolesResponse] = await Promise.all([
        fetch("http://localhost:8201/api/categories", {
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
        fetch("http://localhost:8201/api/roles", {
          credentials: "include",
          headers: { Accept: "application/json" },
        }),
      ]);

      if (
        categoriesResponse.status === 401 ||
        rolesResponse.status === 401
      ) {
        router.replace("/login");
        return;
      }

      if (categoriesResponse.ok) {
        setCategories(await categoriesResponse.json());
      }

      if (rolesResponse.ok) {
        setRoles(await rolesResponse.json());
      }
    } catch (err) {
      console.error("Failed to load admin filter options:", err);
    }
  }

  async function loadTools() {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();

    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (roleFilter) params.set("role", roleFilter);
    if (nameFilter) params.set("name", nameFilter);

    try {
      const response = await fetch(
        `http://localhost:8201/api/admin/tools?${params.toString()}`,
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

      if (response.status === 403) {
        setError("Нямаш права за достъп до администраторския панел.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? `HTTP ${response.status}`);
      }

      const data: AdminResponse = await response.json();

      setTools(data.tools?.data ?? []);
      setCounts(
        data.counts ?? {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        }
      );
    } catch (err) {
      console.error(err);
      setError("Неуспешно зареждане на административния списък.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
    loadTools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approveTool(toolId: number) {
    setError("");
    setSuccess("");

    try {
      const xsrfToken = await getFreshCsrfToken();

      const response = await fetch(
        `http://localhost:8201/api/admin/tools/${toolId}/approve`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-XSRF-TOKEN": xsrfToken,
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ??
            `Неуспешно одобрение (${response.status}).`
        );
        return;
      }

      setSuccess("Инструментът беше одобрен успешно.");
      await loadTools();
    } catch (err) {
      console.error(err);
      setError("Неуспешна връзка с backend-а.");
    }
  }

  async function rejectTool(toolId: number) {
    const reason = window.prompt("Въведи причина за отказ:");

    if (!reason) {
      return;
    }

    if (reason.trim().length < 5) {
      setError("Причината трябва да съдържа поне 5 символа.");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const xsrfToken = await getFreshCsrfToken();

      const response = await fetch(
        `http://localhost:8201/api/admin/tools/${toolId}/reject`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": xsrfToken,
          },
          body: JSON.stringify({ reason }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ??
            `Неуспешен отказ (${response.status}).`
        );
        return;
      }

      setSuccess("Инструментът беше отказан.");
      await loadTools();
    } catch (err) {
      console.error(err);
      setError("Неуспешна връзка с backend-а.");
    }
  }

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    loadTools();
  }

  function clearFilters() {
    setStatusFilter("");
    setCategoryFilter("");
    setRoleFilter("");
    setNameFilter("");

    setTimeout(() => {
      loadTools();
    }, 0);
  }

  return (
    <AppShell title="Администрация на AI инструменти">
      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Всички" value={counts.total} />
          <StatCard label="Чакащи" value={counts.pending} />
          <StatCard label="Одобрени" value={counts.approved} />
          <StatCard label="Отказани" value={counts.rejected} />
        </section>

        <form
          onSubmit={applyFilters}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">
            Филтри
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="text"
              placeholder="Име на инструмент..."
              value={nameFilter}
              onChange={(event) =>
                setNameFilter(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5"
            >
              <option value="">Всички статуси</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5"
            >
              <option value="">Всички категории</option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value)
              }
              className="rounded-lg border border-slate-300 px-3 py-2.5"
            >
              <option value="">Всички роли</option>

              {roles.map((role) => (
                <option
                  key={role.id}
                  value={role.id}
                >
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Филтрирай
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold"
            >
              Изчисти
            </button>
          </div>
        </form>

        {success && (
          <div
            role="status"
            className="rounded-lg bg-emerald-50 p-4 text-emerald-700"
          >
            {success}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {loading && (
          <p className="text-slate-500">
            Зареждане...
          </p>
        )}

        {!loading && tools.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="font-semibold">
              Няма намерени инструменти
            </h2>
          </div>
        )}

        <div className="space-y-4">
          {tools.map((tool) => (
            <article
              key={tool.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {tool.name}
                    </h2>

                    <StatusBadge status={tool.status} />
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {tool.description}
                  </p>

                  {tool.user && (
                    <p className="mt-4 text-sm text-slate-500">
                      Добавен от{" "}
                      <strong className="text-slate-700">
                        {tool.user.name}
                      </strong>
                      {" · "}
                      {tool.user.email}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {tool.categories.map((category) => (
                      <span
                        key={category.id}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
                      >
                        {category.name}
                      </span>
                    ))}

                    {tool.roles.map((role) => (
                      <span
                        key={role.id}
                        className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700"
                      >
                        {role.name}
                      </span>
                    ))}
                  </div>

                  {tool.rejection_reason && (
                    <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      <strong>Причина за отказ:</strong>{" "}
                      {tool.rejection_reason}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 lg:w-64 lg:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/tools/${tool.id}`)
                    }
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
                  >
                    Преглед
                  </button>

                  {tool.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() =>
                        approveTool(tool.id)
                      }
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Одобри
                    </button>
                  )}

                  {tool.status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() =>
                        rejectTool(tool.id)
                      }
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Откажи
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Tool["status"];
}) {
  const styles = {
    pending: "bg-amber-50 text-amber-800",
    approved: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${styles[status]}`}
    >
      {status}
    </span>
  );
}
