"use client";

import AppShell from "@/components/AppShell";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: number;
  name: string;
};

function getCookie(name: string) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : null;
}

export default function NewToolPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [documentationUrl, setDocumentationUrl] = useState("");
  const [description, setDescription] = useState("");
  const [usage, setUsage] = useState("");
  const [examples, setExamples] = useState("");
  const [difficulty, setDifficulty] = useState("");

  const [categories, setCategories] = useState<Option[]>([]);
  const [roles, setRoles] = useState<Option[]>([]);
  const [tags, setTags] = useState<Option[]>([]);

  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const [image, setImage] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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

        if (!categoriesRes.ok || !rolesRes.ok || !tagsRes.ok) {
          throw new Error("Failed to load options");
        }

        setCategories(await categoriesRes.json());
        setRoles(await rolesRes.json());
        setTags(await tagsRes.json());
      } catch (err) {
        console.error(err);
        setError("Неуспешно зареждане на категории, роли или тагове.");
      }
    }

    loadOptions();
  }, [router]);

  function toggleSelection(
    id: number,
    selected: number[],
    setter: (value: number[]) => void
  ) {
    if (selected.includes(id)) {
      setter(selected.filter((item) => item !== id));
    } else {
      setter([...selected, id]);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (selectedCategories.length === 0) {
      setError("Избери поне една категория.");
      return;
    }

    if (selectedRoles.length === 0) {
      setError("Избери поне една роля.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("url", url);
      formData.append("description", description);

      if (documentationUrl) {
        formData.append("documentation_url", documentationUrl);
      }

      if (usage) {
        formData.append("usage", usage);
      }

      if (examples) {
        formData.append("examples", examples);
      }

      if (difficulty) {
        formData.append("difficulty", difficulty);
      }

      selectedCategories.forEach((id) =>
        formData.append("categories[]", id.toString())
      );

      selectedRoles.forEach((id) =>
        formData.append("roles[]", id.toString())
      );

      selectedTags.forEach((id) =>
        formData.append("tags[]", id.toString())
      );

      if (image) {
        formData.append("image", image);
      }

      const xsrfToken = getCookie("XSRF-TOKEN");

      const response = await fetch("http://localhost:8201/api/tools", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-XSRF-TOKEN": xsrfToken ?? "",
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0];

          if (Array.isArray(firstError)) {
            setError(String(firstError[0]));
          } else {
            setError("Невалидни данни.");
          }
        } else {
          setError(data?.message ?? "Неуспешно добавяне на инструмент.");
        }

        return;
      }

      router.push("/tools?submitted=1");
    } catch (err) {
      console.error(err);
      setError("Грешка при връзката с backend-а.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Добави AI инструмент">
      <div className="mx-auto max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <section>
            <h2 className="text-lg font-semibold">Основна информация</h2>

            <div className="mt-5 grid gap-5">
              <FormField label="Име *">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </FormField>

              <FormField label="Линк *">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </FormField>

              <FormField label="Официална документация">
                <input
                  type="url"
                  value={documentationUrl}
                  onChange={(e) => setDocumentationUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </FormField>

              <FormField label="Описание *">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </FormField>

              <FormField label="Как се използва">
                <textarea
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </FormField>

              <FormField label="Реални примери">
                <textarea
                  value={examples}
                  onChange={(e) => setExamples(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </FormField>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Класификация</h2>

            <div className="mt-5 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Ниво</label>

                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5"
                >
                  <option value="">Избери</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <CheckboxGroup
                title="Категории *"
                options={categories}
                selected={selectedCategories}
                onToggle={(id) =>
                  toggleSelection(
                    id,
                    selectedCategories,
                    setSelectedCategories
                  )
                }
              />

              <CheckboxGroup
                title="Препоръчителни роли *"
                options={roles}
                selected={selectedRoles}
                onToggle={(id) =>
                  toggleSelection(id, selectedRoles, setSelectedRoles)
                }
              />

              <CheckboxGroup
                title="Тагове"
                options={tags}
                selected={selectedTags}
                onToggle={(id) =>
                  toggleSelection(id, selectedTags, setSelectedTags)
                }
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">Screenshot</h2>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="mt-4 block w-full rounded-lg border border-slate-300 p-3 text-sm"
            />
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/tools")}
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold"
            >
              Отказ
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              {saving ? "Записване..." : "Запази инструмента"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function CheckboxGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Option[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium">{title}</legend>

      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={() => onToggle(option.id)}
              className="h-4 w-4"
            />

            <span className="text-sm">{option.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
