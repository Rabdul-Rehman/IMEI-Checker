"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  async function login(e) {

    e.preventDefault();

    setLoading(true);

    setError("");

    try {

      const response = await fetch(
        "http://localhost:8000/api/v1/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

    const data = await response.json();

        console.log("LOGIN RESPONSE:", data);

        if (!data.success) {
        setError(data.error);
        setLoading(false);
        return;
        }

        console.log("TOKEN:", data.token);

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        console.log("Saved token:", localStorage.getItem("token"));

        alert("Login Successful!");

        router.push("/");
      // Save JWT
      localStorage.setItem("token", data.token);

      localStorage.setItem("user", JSON.stringify(data.user));

      alert("Login Successful!");

      router.push("/");

    } catch (err) {

      setError("Something went wrong.");

    }

    setLoading(false);

  }

  return (

    <div
      style={{
        width: 400,
        margin: "100px auto",
        padding: 30,
        border: "1px solid #ddd",
        borderRadius: 10,
      }}
    >

      <h2>Login</h2>

      <form onSubmit={login}>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={{
            width:"100%",
            padding:10,
            marginBottom:15
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          style={{
            width:"100%",
            padding:10,
            marginBottom:20
          }}
        />

        <button
          style={{
            width:"100%",
            padding:12
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

      <p style={{color:"red"}}>
        {error}
      </p>

    </div>

  );

}