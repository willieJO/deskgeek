import { useState, useEffect } from "react";
import api from "../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 
import { toast } from 'react-toastify';
export default function Home() {
  const [valor, setValor] = useState("0");
  const [tipoGasto, setTipoGasto] = useState("");
  const [dataCobranca, setDataCobranca] = useState(new Date());
  const [cobrancaRecorrente, setCobrancaRecorrente] = useState(false);
  const [todosTipos, setTodosTipos] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const fetchTipos = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await api.get("/Expense/Tipos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTodosTipos(response.data || []);
    } catch (error) {
      toast.error("Erro ao buscar tipos.");
    }
  };

  useEffect(() => {
    fetchTipos();
  }, []);

  const sugestoesFiltradas = todosTipos.filter((tipo) =>
    tipo.toLowerCase().startsWith(tipoGasto.toLowerCase())
  );

  const handleSelectSugestao = (sugestao) => {
    setTipoGasto(sugestao);
    setMostrarSugestoes(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const payload = {
        valor: valor,
        tipoGasto: tipoGasto,
        cobrancaRecorrente: cobrancaRecorrente, 
      };

      if (dataCobranca) {
        payload.dataCobranca = dataCobranca;
      }

      await api.post("/Expense", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      
      setValor("");
      setTipoGasto("");
      setDataCobranca("");
      setCobrancaRecorrente(false); 
      setMostrarSugestoes(false);
      toast.success("Realizado com sucesso.");
      fetchTipos();
    } catch (error) {
      if (error.response == null) {
        toast.error("Erro interno, consulte o suporte.");
      } else {
        toast.error(error.response.data.message);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <main className="flex-1 flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl w-full space-y-4 bg-[#1e1e1e] p-6 rounded-xl shadow-xl border border-gray-700"
        >
          <h1 className="text-3xl font-bold text-white">Bem-vindo!</h1>

          <div>
            <label className="block font-semibold mb-1" htmlFor="valor">
              Valor
            </label>
            <input
              id="valor"
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              placeholder="Digite o valor"
            />
          </div>

          <div className="relative">
            <label className="block font-semibold mb-1" htmlFor="tipoGasto">
              Tipo de Gasto
            </label>
            <input
              id="tipoGasto"
              type="text"
              value={tipoGasto}
              onChange={(e) => {
                setTipoGasto(e.target.value);
                setMostrarSugestoes(true);
              }}
              className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Ex: Ifood, Streaming..."
              autoComplete="off"
            />

            {mostrarSugestoes &&
              tipoGasto.length > 0 &&
              sugestoesFiltradas.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-[#2c2c2c] border border-gray-600 rounded max-h-40 overflow-y-auto">
                  {sugestoesFiltradas.map((s, index) => (
                    <li
                      key={index}
                      onClick={() => handleSelectSugestao(s)}
                      className="px-4 py-2 cursor-pointer hover:bg-purple-600"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
          </div>

         <div>
          <label className="block font-semibold mb-1" htmlFor="dataCobranca">
            Data de Cobrança
          </label>
          <DatePicker
            id="dataCobranca"
            selected={dataCobranca}
            onChange={(date) => setDataCobranca(date)}
            className="w-full p-3 bg-[#2c2c2c] text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            dateFormat="dd/MM/yyyy"
          />
        </div>



         <div className="flex items-center space-x-2 mt-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={cobrancaRecorrente}
              onChange={() => setCobrancaRecorrente(!cobrancaRecorrente)}
              className="sr-only"
            />
            <div
              className={`w-10 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 relative transition-colors ${
                cobrancaRecorrente ? "bg-purple-600" : "bg-purple-900"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform absolute top-1 left-1 ${
                  cobrancaRecorrente ? "translate-x-4" : ""
                }`}
              ></div>
            </div>
            <span className="ml-3 text-white font-semibold select-none">
              Cobrança recorrente
            </span>
          </label>
        </div>

          <button
            type="submit"
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700 transition-colors font-semibold py-3 rounded-lg"
          >
            Enviar
          </button>
        </form>
      </main>
    </div>
  );
}
