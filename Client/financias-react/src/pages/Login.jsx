import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await api.post("/usuario/login", {
        email,
        password,
      });

      if (response.status !== 200) {
        setMessage("Erro ao realizar login.");
        return;
      }

      if (response.data?.success) {
        setMessage("Login realizado com sucesso.");
        onLogin?.();
        navigate("/dashboard");
      } else {
        setMessage(response.data?.message || "Email ou senha inválidos.");
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || "Erro ao conectar com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card page-surface fade-slide-in">
        <p className="section-tag">MediaDex</p>
        <h1 className="section-title">Entrar na sua conta</h1>
        <p className="section-subtitle">
          Acesse seu painel para acompanhar capítulos, obras e calendário.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="ui-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ui-input"
              required
            />
          </div>

          <div>
            <label className="ui-label" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ui-input"
              required
            />
          </div>

          <button type="submit" className="ui-button w-full" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-lg border border-slate-500/30 bg-slate-900/45 px-3 py-2 text-sm text-slate-200">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Ainda não tem conta?{" "}
          <button onClick={() => navigate("/register")} className="ui-link" type="button">
            Criar agora
          </button>
        </p>
      </div>
    </div>
  );
}
