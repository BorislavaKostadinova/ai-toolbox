"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AppShellProps = {
  children: ReactNode;
  title?: string;
};

function getCookie(name: string) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

export default function AppShell({
  children,
  title,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(
          "http://localhost:8201/api/user",
          {
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        setUser(await response.json());
      } catch (error) {
        console.error(error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  async function logout() {
    const xsrfToken = getCookie("XSRF-TOKEN");

    const response = await fetch(
      "http://localhost:8201/logout",
      {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-XSRF-TOKEN": xsrfToken ?? "",
        },
      }
    );

    if (response.ok) {
      router.replace("/login");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Зареждане...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigation = [
    {
      label: "Dashboard",
      href: "/dashboard",
      roles: ["owner", "backend", "frontend"],
    },
    {
      label: "AI Tools",
      href: "/tools",
      roles: ["owner", "backend", "frontend"],
    },
    {
      label: "Добави Tool",
      href: "/tools/new",
      roles: ["owner", "backend", "frontend"],
    },
    {
      label: "Профил",
      href: "/profile",
      roles: ["owner", "backend", "frontend"],
    },
    {
      label: "Admin",
      href: "/admin/tools",
      roles: ["owner"],
    },
    {
      label: "Audit Log",
      href: "/admin/activity",
      roles: ["owner"],
    },
  ];

  const visibleNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
        <span className="text-lg font-bold text-blue-700">
          AI ToolBox
        </span>

        <button
          type="button"
          aria-label="Отвори навигацията"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          ☰
        </button>
      </header>

      {mobileOpen && (
        <button
          aria-label="Затвори менюто"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64
          border-r border-slate-200 bg-white
          transition-transform
          md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <span className="text-xl font-bold text-blue-700">
            AI ToolBox
          </span>
        </div>

        <div className="border-b border-slate-100 p-5">
          <p className="font-semibold text-slate-900">
            {user.name}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {user.email}
          </p>

          <span className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
            {user.role}
          </span>
        </div>

        <nav
          aria-label="Основна навигация"
          className="space-y-1 p-4"
        >
          {visibleNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${
                isActive(item.href)
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Изход
          </button>
        </div>
      </aside>

      <div className="md:pl-64">
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {title && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {title}
              </h1>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
