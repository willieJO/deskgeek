import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (senha !== confirmSenha) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/usuario/register", {
        nome: name,
        email,
        senha,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Usuário cadastrado com sucesso!");
        setMessage("");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setMessage("Erro ao cadastrar usuário.");
      }
    } catch (error) {
      if (error.response == null) {
        toast.error("Erro interno, consulte o suporte.");
      } else {
        toast.error(error.response.data[0].message);
        setMessage(error.response.data[0].message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card page-surface fade-slide-in">
        <p className="section-tag">Nova conta</p>
        <h1 className="section-title">Criar perfil</h1>
        <p className="section-subtitle">
          Registre-se para salvar progresso e acompanhar lançamentos em um só lugar.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="ui-label" htmlFor="name">
              Nome
            </label>
            <input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ui-input"
              required
            />
          </div>

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

          <div className="relative">
            <label className="ui-label" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Crie uma senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="ui-input pr-11"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-[2.18rem] text-slate-400 transition hover:text-cyan-200"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Mostrar ou ocultar senha"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <label className="ui-label" htmlFor="confirm-password">
              Confirmar senha
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Repita sua senha"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
              className="ui-input pr-11"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-[2.18rem] text-slate-400 transition hover:text-cyan-200"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Mostrar ou ocultar confirmação de senha"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="ui-button w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar"}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-lg border border-rose-400/30 bg-rose-900/20 px-3 py-2 text-sm text-rose-100">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Já tem uma conta?{" "}
          <button onClick={() => navigate("/login")} className="ui-link" type="button">
            Voltar para login
          </button>
        </p>
      </div>
    </div>
  );
}
