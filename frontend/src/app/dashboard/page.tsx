"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("http://localhost:8201/api/user", {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) =>
        response.ok ? response.json() : null
      )
      .then(setUser);
  }, []);

  return (
    <AppShell title="Dashboard">
      <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-blue-100">
          Добре дошъл
        </p>

        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          {user?.name ?? "Потребител"}
        </h2>

        <p className="mt-2 text-blue-100">
          Твоята роля е <strong>{user?.role}</strong>.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="AI Tools"
          description="Разглеждай и филтрирай наличните AI инструменти."
          href="/tools"
        />

        <DashboardCard
          title="Добави Tool"
          description="Добави нов AI инструмент към системата."
          href="/tools/new"
        />

        <DashboardCard
          title="Профил"
          description="Прегледай информацията за своя профил."
          href="/profile"
        />
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">
          Информация
        </h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">
              User ID
            </dt>
            <dd className="font-medium">
              {user?.id}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">
              Роля
            </dt>
            <dd className="font-medium capitalize">
              {user?.role}
            </dd>
          </div>
        </dl>
      </section>
    </AppShell>
  );
}

function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>

      <span className="mt-5 inline-block text-sm font-semibold text-blue-600">
        Отвори →
      </span>
    </a>
  );
}