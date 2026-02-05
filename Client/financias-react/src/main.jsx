import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import api from "../src/utils/api";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import AnimeTracker from "./pages/AnimeTracker";
import {TabelaDex } from "./pages/TabelaDex";
import CalendarioDex from "./pages/CalendarioDex";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

   useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.get("/usuario/me", { withCredentials: true });
        if (res.data?.success) {
          setIsLoggedIn(true);
          setLoading(false);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) return null;

  return (
    <BrowserRouter>
      <ToastContainer position="top-right" theme="dark" />
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? <Navigate to="/tabeladex" /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/home" />
            ) : (
              <Login onLogin={() => setIsLoggedIn(true)} />
            )
          }
        />

        <Route
          path="/register"
          element={
            isLoggedIn ? <Navigate to="/home" /> : <Register />
          }
        />

        {/* Rota protegida com layout */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <AuthenticatedLayout />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route path="dashboard" element={<AnimeTracker />} />
          <Route path="tabeladex" element={<TabelaDex />} />
          <Route path="calendariodex" element={<CalendarioDex />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
