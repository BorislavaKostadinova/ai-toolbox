"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function getCookie(name: string) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

export default function LoginPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("owner@example.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
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

        if (response.ok) {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const csrfResponse = await fetch(
        "http://localhost:8201/sanctum/csrf-cookie",
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!csrfResponse.ok) {
        throw new Error("Could not initialize CSRF protection");
      }

      const xsrfToken = getCookie("XSRF-TOKEN");

      if (!xsrfToken) {
        throw new Error("XSRF token was not received");
      }

      const response = await fetch(
        "http://localhost:8201/login",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": xsrfToken,
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 422) {
          setError(
            data?.message ?? "Невалиден email или парола."
          );
        } else if (response.status === 429) {
          setError(
            data?.message ??
              "Твърде много опити. Опитай по-късно."
          );
        } else {
          setError(
            data?.message ??
              `Входът е неуспешен (${response.status}).`
          );
        }

        return;
      }

      if (data?.requires_two_factor === true) {
        router.replace("/verify-2fa");
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      console.error(error);
      setError("Неуспешна връзка с backend-а.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-600">
          Проверка на сесията...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-blue-700">
            AI ToolBox
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Влез в своя профил
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Парола
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {loading ? "Влизане..." : "Вход"}
          </button>
        </form>
      </div>
    </main>
  );
}