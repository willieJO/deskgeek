import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import ButtonSpinner from "../components/ButtonSpinner";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

export default function Register() {
  const [usuario, setUsuario] = useState("");
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
    if (!usuario.trim()) {
      setMessage("Informe um usuário válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const usuarioNormalizado = usuario.trim();
      const emailNormalizado = email.trim();

      const response = await api.post("/usuario/register", {
        usuario: usuarioNormalizado,
        email: emailNormalizado,
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
        const payload = error.response.data;
        let mensagem = "Erro ao cadastrar usuário.";

        if (Array.isArray(payload)) {
          const erroUsuario = payload.find(
            (item) => String(item?.field || "").toLowerCase() === "usuario"
          );
          mensagem = erroUsuario?.message || payload[0]?.message || mensagem;
        } else {
          mensagem = payload?.message || mensagem;
        }

        toast.error(mensagem);
        setMessage(mensagem);
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
            <label className="ui-label" htmlFor="usuario">
              Usuário
            </label>
            <input
              id="usuario"
              type="text"
              placeholder="Seu usuário"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
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

          <div>
            <label className="ui-label" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Crie uma senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="ui-input pr-12"
                required
              />
              <button
                type="button"
                className="ui-icon-button absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar ou ocultar senha"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="ui-label" htmlFor="confirm-password">
              Confirmar senha
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Repita sua senha"
                value={confirmSenha}
                onChange={(e) => setConfirmSenha(e.target.value)}
                className="ui-input pr-12"
                required
              />
              <button
                type="button"
                className="ui-icon-button absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar ou ocultar confirmação de senha"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="ui-button w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <ButtonSpinner />
                Registrando...
              </>
            ) : (
              "Registrar"
            )}
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
