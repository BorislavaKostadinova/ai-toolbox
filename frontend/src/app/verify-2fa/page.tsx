"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

function getCookie(name: string) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

async function getFreshCsrfToken(): Promise<string> {
  const csrfResponse = await fetch(
    "http://localhost:8201/sanctum/csrf-cookie",
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!csrfResponse.ok) {
    throw new Error(
      `Could not initialize CSRF protection (${csrfResponse.status})`
    );
  }

  const xsrfToken = getCookie("XSRF-TOKEN");

  if (!xsrfToken) {
    throw new Error("XSRF token was not received");
  }

  return xsrfToken;
}

export default function VerifyTwoFactorPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    "Въведи 6-цифрения код, изпратен на твоя email."
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const xsrfToken = await getFreshCsrfToken();

      const response = await fetch(
        "http://localhost:8201/verify-2fa",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-XSRF-TOKEN": xsrfToken,
          },
          body: JSON.stringify({
            code,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      console.log(
        "2FA verification response:",
        response.status,
        data
      );

      if (!response.ok) {
        if (response.status === 419) {
          setError(
            "Сесията за сигурност е изтекла. Опитай отново."
          );
        } else if (response.status === 422) {
          setError(
            data?.message ??
              "Кодът е невалиден или е изтекъл."
          );
        } else if (response.status === 429) {
          setError(
            data?.message ??
              "Твърде много опити. Опитай отново по-късно."
          );
        } else {
          setError(
            data?.message ??
              `Неуспешна проверка (${response.status}).`
          );
        }

        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("2FA verification error:", err);

      setError(
        "Неуспешна връзка с backend-а."
      );
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const xsrfToken = await getFreshCsrfToken();

      const response = await fetch(
        "http://localhost:8201/resend-2fa",
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

      console.log(
        "2FA resend response:",
        response.status,
        data
      );

      if (!response.ok) {
        if (response.status === 419) {
          setError(
            "Сесията за сигурност е изтекла. Влез отново."
          );
        } else if (response.status === 429) {
          setError(
            data?.message ??
              "Изчакай преди да поискаш нов код."
          );
        } else {
          setError(
            data?.message ??
              "Неуспешно изпращане на нов код."
          );
        }

        return;
      }

      setCode("");
      setMessage(
        "Изпратен е нов код за потвърждение."
      );
    } catch (err) {
      console.error("2FA resend error:", err);

      setError(
        "Неуспешна връзка с backend-а."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
            🔐
          </div>

          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Двуфакторна автентикация
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Потвърди входа чрез кода,
            изпратен на твоя email.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="mb-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-700"
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="code"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Код за потвърждение
            </label>

            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              autoFocus
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                )
              }
              placeholder="000000"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-2xl font-semibold tracking-[0.4em]"
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
            disabled={loading || code.length !== 6}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Проверка..."
              : "Потвърди"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-5 text-center">
          <p className="text-sm text-slate-500">
            Не получи код?
          </p>

          <button
            type="button"
            onClick={resendCode}
            disabled={resending}
            className="mt-2 text-sm font-semibold text-blue-600 hover:underline disabled:opacity-60"
          >
            {resending
              ? "Изпращане..."
              : "Изпрати нов код"}
          </button>
        </div>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() =>
              router.replace("/login")
            }
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            ← Обратно към вход
          </button>
        </div>
      </div>
    </main>
  );
}
