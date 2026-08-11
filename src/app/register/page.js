"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {

  const router = useRouter();

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  async function register(e) {

    e.preventDefault();

    setLoading(true);

    setError("");

    try {

      const response = await fetch(
        "http://localhost:8000/api/v1/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        setLoading(false);
        return;
      }

      alert("Registration successful!");

      router.push("/login");

    } catch (err) {

      setError("Something went wrong.");

    }

    setLoading(false);

  }

  return (

    <div style={{
      width:400,
      margin:"100px auto",
      padding:30,
      border:"1px solid #ddd",
      borderRadius:10
    }}>

      <h2>Create Account</h2>

      <form onSubmit={register}>

        <input
          placeholder="Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          style={{width:"100%",padding:10,marginBottom:10}}
        />

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={{width:"100%",padding:10,marginBottom:10}}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          style={{width:"100%",padding:10,marginBottom:20}}
        />

        <button
          style={{
            width:"100%",
            padding:12
          }}
        >
          {loading ? "Creating..." : "Register"}
        </button>

      </form>

      <p style={{color:"red"}}>
        {error}
      </p>

    </div>

  );

}