 "use client";

 import AppShell from "@/components/AppShell";
 import { useEffect, useState } from "react";

 type User = {
   id: number;
   name: string;
   email: string;
   role: string;
 };

 export default function ProfilePage() {
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
     <AppShell title="Потребителски профил">
       <div className="mx-auto max-w-3xl">
         <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
           <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8">
             <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-blue-700">
               {user?.name?.charAt(0).toUpperCase()}
             </div>
           </div>

           <div className="p-6 sm:p-8">
             <h2 className="text-2xl font-bold">
               {user?.name}
             </h2>

             <p className="mt-1 text-slate-500">
               {user?.email}
             </p>

             <div className="mt-8 grid gap-5 sm:grid-cols-2">
               <ProfileItem
                 label="User ID"
                 value={String(user?.id ?? "")}
               />

               <ProfileItem
                 label="Роля"
                 value={user?.role ?? ""}
               />

               <ProfileItem
                 label="Email"
                 value={user?.email ?? ""}
               />

               <ProfileItem
                 label="Статус"
                 value="Активен"
               />
             </div>
           </div>
         </section>
       </div>
     </AppShell>
   );
 }

 function ProfileItem({
   label,
   value,
 }: {
   label: string;
   value: string;
 }) {
   return (
     <div className="rounded-lg bg-slate-50 p-4">
       <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
         {label}
       </p>

       <p className="mt-1 font-medium text-slate-900">
         {value}
       </p>
     </div>
   );
 }