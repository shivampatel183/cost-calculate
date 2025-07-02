import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./supabaseClient";

import Home from "./pages/home";
import Sheet from "./pages/sheet";
import Profile from "./pages/profile";
import Login from "./pages/login";
import Register from "./pages/register";
import Data from "./pages/data";

const Sidebar = ({ onLogout }) => (
  <div className="fixed top-0 left-0 h-screen w-50 bg-gray-800 text-white flex flex-col p-4 z-50">
    <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
    <a className="mb-4 hover:text-yellow-400" href="/home">
      Home
    </a>
    <a className="mb-4 hover:text-yellow-400" href="/sheet">
      Sheet
    </a>
    <a className="mb-4 hover:text-yellow-400" href="/data">
      Data
    </a>
    <a className="mb-4 hover:text-yellow-400" href="/profile">
      Profile
    </a>
    <button onClick={onLogout} className="mt-auto bg-red-600 px-4 py-2 rounded">
      Logout
    </button>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return null;

  return (
    <Router>
      {user && <Sidebar onLogout={handleLogout} />}
      <div className={user ? "ml-50" : ""}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              !user ? <Login setUser={setUser} /> : <Navigate to="/home" />
            }
          />
          <Route
            path="/signup"
            element={
              !user ? <Register setUser={setUser} /> : <Navigate to="/home" />
            }
          />

          {/* Protected routes */}
          <Route
            path="/home"
            element={user ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/sheet"
            element={user ? <Sheet /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={user ? <Profile user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/data"
            element={user ? <Data /> : <Navigate to="/data" />}
          />
          {/* Default route */}
          <Route
            path="/"
            element={<Navigate to={user ? "/home" : "/login"} />}
          />
        </Routes>
      </div>
    </Router>
  );
}
