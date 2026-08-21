"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Activity = {
  id: number;
  action: string;
  subject_type?: string | null;
  subject_id?: number | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type ActivityResponse = {
  data: Activity[];
};

export default function ActivityPage() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadActivity() {
      try {
        const response = await fetch(
          "http://localhost:8201/api/admin/activity",
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
          router.replace("/dashboard");
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => null);

          throw new Error(
            data?.message ?? `HTTP ${response.status}`
          );
        }

        const data: ActivityResponse =
          await response.json();

        setActivities(data.data ?? []);
      } catch (error) {
        console.error(
          "Failed to load activity log:",
          error
        );

        setError(
          "Неуспешно зареждане на audit log."
        );
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, [router]);

  return (
    <AppShell title="Audit Log">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          Тук се проследяват важните действия в системата.
        </div>

        {loading && (
          <p className="text-slate-500">
            Зареждане...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          activities.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Все още няма записана активност.
            </div>
          )}

        <div className="space-y-3">
          {activities.map((activity) => (
            <article
              key={activity.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {formatAction(activity.action)}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {activity.user
                      ? `${activity.user.name} (${activity.user.email})`
                      : "System"}
                  </p>

                  {activity.subject_id && (
                    <p className="mt-2 text-xs text-slate-400">
                      Subject ID:{" "}
                      {activity.subject_id}
                    </p>
                  )}

                  {activity.ip_address && (
                    <p className="mt-1 text-xs text-slate-400">
                      IP: {activity.ip_address}
                    </p>
                  )}
                </div>

                <div className="text-sm text-slate-500">
                  {new Date(
                    activity.created_at
                  ).toLocaleString()}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function formatAction(action: string) {
  const names: Record<string, string> = {
    user_login: "Потребителски вход",
    user_logout: "Потребителски изход",
    tool_created: "Добавен AI инструмент",
    tool_updated: "Редактиран AI инструмент",
    tool_deleted: "Изтрит AI инструмент",
    tool_approved: "Одобрен AI инструмент",
    tool_rejected: "Отказан AI инструмент",
  };

  return names[action] ?? action;
}
