import { useState, useEffect } from "react";
import api from "../utils/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

export default function Home() {
  const [valor, setValor] = useState("0");
  const [tipoGasto, setTipoGasto] = useState("");
  const [dataCobranca, setDataCobranca] = useState(new Date());
  const [cobrancaRecorrente, setCobrancaRecorrente] = useState(false);
  const [todosTipos, setTodosTipos] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTipos = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await api.get("/Expense/Tipos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTodosTipos(response.data || []);
    } catch {
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
    setIsSubmitting(true);

    try {
      const payload = {
        valor,
        tipoGasto,
        cobrancaRecorrente,
      };

      if (dataCobranca) {
        payload.dataCobranca = dataCobranca;
      }

      await api.post("/Expense", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setValor("");
      setTipoGasto("");
      setDataCobranca(new Date());
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form onSubmit={handleSubmit} className="page-surface fade-slide-in space-y-4 p-5 sm:p-7">
        <p className="section-tag">Financeiro</p>
        <h1 className="section-title">Registrar gasto</h1>
        <p className="section-subtitle">Cadastre uma despesa e mantenha seu controle em dia.</p>

        <div>
          <label className="ui-label" htmlFor="valor">
            Valor
          </label>
          <input
            id="valor"
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="ui-input"
            placeholder="Digite o valor"
          />
        </div>

        <div className="relative">
          <label className="ui-label" htmlFor="tipoGasto">
            Tipo de gasto
          </label>
          <input
            id="tipoGasto"
            type="text"
            value={tipoGasto}
            onChange={(e) => {
              setTipoGasto(e.target.value);
              setMostrarSugestoes(true);
            }}
            className="ui-input"
            placeholder="Ex: Streaming, mercado, transporte..."
            autoComplete="off"
          />

          {mostrarSugestoes && tipoGasto.length > 0 && sugestoesFiltradas.length > 0 && (
            <ul className="absolute z-10 mt-2 max-h-40 w-full overflow-y-auto rounded-xl border border-slate-500/40 bg-[rgba(8,16,32,0.97)] p-1">
              {sugestoesFiltradas.map((sugestao, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleSelectSugestao(sugestao)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-cyan-300/15"
                  >
                    {sugestao}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="ui-label" htmlFor="dataCobranca">
            Data de cobrança
          </label>
          <DatePicker
            id="dataCobranca"
            selected={dataCobranca}
            onChange={(date) => setDataCobranca(date)}
            className="ui-input"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-500/35 bg-slate-900/40 px-3 py-2">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={cobrancaRecorrente}
              onChange={() => setCobrancaRecorrente(!cobrancaRecorrente)}
              className="peer sr-only"
            />
            <div className="h-6 w-10 rounded-full bg-slate-600 transition peer-checked:bg-cyan-500" />
            <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4" />
          </label>
          <span className="text-sm font-semibold text-slate-100">Cobrança recorrente</span>
        </div>

        <button type="submit" className="ui-button w-full">
          {isSubmitting ? "Enviando..." : "Salvar gasto"}
        </button>
      </form>
    </div>
  );
}
