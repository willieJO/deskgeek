import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("Carregando...");

    try {
      const response = await api.post("/usuario/login", {
        email,
        password,
      });

      const data = await response;

      if (!response.status === 200) {
        setMessage(data.message || "Erro no login");
        return;
      }
      debugger
      if (data.data.success) {
        setMessage("Login realizado com sucesso!");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        setMessage(data.data.message || "Email ou senha inválidos");
      }
    } catch (error) {
      setMessage("Erro ao conectar com o servidor");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212]">
      <div className="bg-[#1e1e1e] text-white shadow-2xl p-10 rounded-xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold mb-8 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Usuário"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-5 bg-[#2c2c2c] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-6 bg-[#2c2c2c] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 transition-colors font-semibold py-3 rounded-lg"
          >
            Entrar
          </button>
        </form>

        {/* Mensagem de erro ou sucesso */}
        {message && (
          <p className="mt-4 text-center text-sm text-white">{message}</p>
        )}

        {/* Botão para ir para o registro */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Ainda não tem uma conta?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-purple-400 hover:underline font-semibold"
          >
            Registre-se
          </button>
        </p>
      </div>
    </div>
  );
}
