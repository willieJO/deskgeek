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
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (senha !== confirmSenha) {
      setMessage("As senhas não coincidem.");
      return;
    }

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
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#121212]">
      <div className="bg-[#1e1e1e] text-white shadow-2xl p-10 rounded-xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold mb-8 text-center">Registro</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 mb-5 bg-[#2c2c2c] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-5 bg-[#2c2c2c] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />

          <div className="relative mb-5">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-3 bg-[#2c2c2c] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <div
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <div className="relative mb-6">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmar Senha"
              value={confirmSenha}
              onChange={(e) => setConfirmSenha(e.target.value)}
              className="w-full p-3 bg-[#2c2c2c] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <div
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 transition-colors font-semibold py-3 rounded-lg"
          >
            Registrar
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-white">{message}</p>
        )}

        {/* Botão para voltar ao login */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Já tem uma conta?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-purple-400 hover:underline font-semibold"
          >
            Voltar para o login
          </button>
        </p>
      </div>
    </div>
  );
}
