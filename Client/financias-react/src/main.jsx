import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import ButtonSpinner from "./components/ButtonSpinner";
import "./index.css";
import AnimeTracker from "./pages/AnimeTracker";
import CalendarioDex from "./pages/CalendarioDex";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { TabelaDex } from "./pages/TabelaDex";
import api from "./utils/api";

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

  if (loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card page-surface fade-slide-in text-center">
          <p className="section-tag mx-auto">MediaDex</p>
          <h1 className="section-title text-2xl">Preparando sua sessão</h1>
          <p className="section-subtitle mt-3">Verificando autenticação...</p>
          <div className="mt-6 flex justify-center text-cyan-200">
            <ButtonSpinner className="ui-inline-spinner-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        toastStyle={{
          background: "rgba(6, 14, 28, 0.95)",
          color: "#e5f3ff",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          borderRadius: "12px",
        }}
      />

      <Routes>
        <Route
          path="/"
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />

        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login onLogin={() => setIsLoggedIn(true)} />
            )
          }
        />

        <Route
          path="/register"
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <Register />}
        />

        <Route
          path="/"
          element={
            isLoggedIn ? (
              <AuthenticatedLayout onLogout={() => setIsLoggedIn(false)} />
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
