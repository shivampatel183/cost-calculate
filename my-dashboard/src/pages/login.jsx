import React, { useState } from "react";
import { supabase } from "../supabaseClient";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(""); // Add display name input

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      const user = data.user;

      // If display name not set in metadata, update it now
      if (!user.user_metadata?.display_name && displayName) {
        await supabase.auth.updateUser({
          data: { display_name: displayName },
        });
        user.user_metadata.display_name = displayName;
      }

      setUser({
        ...user,
        displayName: user.user_metadata?.display_name || "User",
      });
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        <input
          className="w-full border p-2 mb-4"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2 mb-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="w-full border p-2 mb-4"
          type="text"
          placeholder="Your Name (for first-time login)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
