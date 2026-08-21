"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
};

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8201/api/users")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        return response.json();
      })
      .then((data) => setUsers(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Laravel + Next.js Starter</h1>

      <h2>Users from MySQL</h2>

      {error && <p>{error}</p>}

      {users.map((user) => (
        <div key={user.id}>
          <strong>{user.name}</strong>
          <br />
          {user.email}
        </div>
      ))}
    </main>
  );
}