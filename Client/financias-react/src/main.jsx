import { Suspense, lazy, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthenticatedLayout from "./components/AuthenticatedLayout";
import ButtonSpinner from "./components/ButtonSpinner";
import "./index.css";
import api from "./utils/api";

const AnimeTracker = lazy(() => import("./pages/AnimeTracker"));
const CalendarioDex = lazy(() => import("./pages/CalendarioDex"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const TabelaDex = lazy(() =>
  import("./pages/TabelaDex").then((module) => ({ default: module.TabelaDex }))
);

function RouteLoading() {
  return (
    <div className="auth-shell">
      <div className="auth-card page-surface fade-slide-in text-center">
        <p className="section-tag mx-auto">MediaDex</p>
        <h1 className="section-title text-2xl">Carregando página</h1>
        <p className="section-subtitle mt-3">Preparando componentes...</p>
        <div className="mt-6 flex justify-center text-cyan-200">
          <ButtonSpinner className="ui-inline-spinner-lg" />
        </div>
      </div>
    </div>
  );
}

function LazyRoute({ children }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  async function refreshCurrentUser() {
    try {
      const res = await api.get("/usuario/me", { withCredentials: true });
      if (res.data?.success) {
        const nextUser = {
          id: res.data.id,
          email: res.data.email,
          usuario: res.data.usuario || "",
          fotoPerfilDisponivel: Boolean(res.data.fotoPerfilDisponivel),
          fotoCacheKey: Date.now(),
        };

        setCurrentUser(nextUser);
        setIsLoggedIn(true);
        return nextUser;
      }

      setCurrentUser(null);
      setIsLoggedIn(false);
      return null;
    } catch {
      setCurrentUser(null);
      setIsLoggedIn(false);
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      await refreshCurrentUser();
      if (mounted) {
        setLoading(false);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
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
              <LazyRoute>
                <Login onLogin={refreshCurrentUser} />
              </LazyRoute>
            )
          }
        />

        <Route
          path="/register"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" />
            ) : (
              <LazyRoute>
                <Register />
              </LazyRoute>
            )
          }
        />

        <Route
          path="/"
          element={
            isLoggedIn ? (
              <AuthenticatedLayout
                currentUser={currentUser}
                onLogout={() => {
                  setIsLoggedIn(false);
                  setCurrentUser(null);
                }}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route
            path="dashboard"
            element={
              <LazyRoute>
                <AnimeTracker />
              </LazyRoute>
            }
          />
          <Route
            path="tabeladex"
            element={
              <LazyRoute>
                <TabelaDex />
              </LazyRoute>
            }
          />
          <Route
            path="calendariodex"
            element={
              <LazyRoute>
                <CalendarioDex />
              </LazyRoute>
            }
          />
          <Route
            path="configuracoes"
            element={
              <LazyRoute>
                <Configuracoes currentUser={currentUser} refreshCurrentUser={refreshCurrentUser} />
              </LazyRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
