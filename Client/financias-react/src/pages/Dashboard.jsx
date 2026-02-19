import { useEffect, useMemo, useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../utils/api";
import { toast } from "react-toastify";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const ACCENT = "#22d3ee";
const BAR_PALETTE = [
  "#22d3ee",
  "#38bdf8",
  "#f59e0b",
  "#34d399",
  "#a78bfa",
  "#fb7185",
  "#f97316",
];

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function SortableItem({ id, title, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="page-surface min-h-[320px] cursor-grab p-4 active:cursor-grabbing sm:p-5"
      {...attributes}
      {...listeners}
    >
      <h2 className="mb-3 text-lg font-semibold text-slate-100">{title}</h2>
      {children}
    </article>
  );
}

export default function Dashboard() {
  const [dados, setDados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [visiveis, setVisiveis] = useState({});
  const [widgets, setWidgets] = useState([
    { id: "line", title: "Gastos por mês" },
    { id: "bar", title: "Gastos por categoria" },
    { id: "pie", title: "Distribuição por categoria" },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await api.get("/Expense/Dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDados(response.data.gastosPorMes || []);
        setCategorias(response.data.gastosPorCategoria || []);
      } catch {
        toast.error("Erro ao buscar dados do dashboard.");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const initialVisiveis = {};
    categorias.forEach((categoria) => {
      initialVisiveis[categoria.categoria] = true;
    });
    setVisiveis(initialVisiveis);
  }, [categorias]);

  const categoriaColors = useMemo(() => {
    const map = {};
    categorias.forEach((item, index) => {
      map[item.categoria] = BAR_PALETTE[index % BAR_PALETTE.length];
    });
    return map;
  }, [categorias]);

  const totalGeral = useMemo(
    () => categorias.reduce((acc, item) => acc + Number(item.total || 0), 0),
    [categorias]
  );

  const lineData = {
    labels: dados.map((item) => item.mes),
    datasets: [
      {
        label: "Gastos",
        data: dados.map((item) => item.total),
        borderColor: ACCENT,
        backgroundColor: "rgba(34, 211, 238, 0.22)",
        tension: 0.34,
        pointRadius: 4,
        pointBackgroundColor: "#e0f2fe",
        fill: true,
      },
    ],
  };

  const sharedOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "#d6e4ff", font: { size: 13, family: "Manrope" } },
      },
      tooltip: {
        backgroundColor: "#081225",
        titleColor: "#67e8f9",
        bodyColor: "#d6e4ff",
      },
    },
    scales: {
      x: { ticks: { color: "#9fb2ce" }, grid: { color: "rgba(148,163,184,0.18)" } },
      y: { ticks: { color: "#9fb2ce" }, grid: { color: "rgba(148,163,184,0.18)" } },
    },
  };

  const barData = {
    labels: categorias.map((item) => item.categoria),
    datasets: categorias.map((item, index) => ({
      label: item.categoria,
      data: categorias.map((_, i) => (i === index ? item.total : 0)),
      backgroundColor: categoriaColors[item.categoria],
      borderRadius: 8,
    })),
  };

  const totalVisivel = useMemo(() => {
    return barData.datasets.reduce((acc, dataset) => {
      if (!visiveis[dataset.label]) return acc;
      return acc + dataset.data.reduce((sum, value) => sum + value, 0);
    }, 0);
  }, [barData, visiveis]);

  const barOptions = {
    ...sharedOptions,
    plugins: {
      ...sharedOptions.plugins,
      legend: {
        onClick: (event, legendItem, legend) => {
          const index = legendItem.datasetIndex;
          const chart = legend.chart;
          const meta = chart.getDatasetMeta(index);
          meta.hidden = meta.hidden === null ? !chart.data.datasets[index].hidden : null;

          setVisiveis((old) => {
            const label = chart.data.datasets[index].label;
            return { ...old, [label]: !old[label] };
          });
          chart.update();
        },
        labels: { color: "#d6e4ff", font: { size: 13, family: "Manrope" } },
      },
    },
  };

  const pieData = {
    labels: categorias.map((item) => item.categoria),
    datasets: [
      {
        data: categorias.map((item) => item.total),
        backgroundColor: categorias.map((item) => categoriaColors[item.categoria]),
        borderColor: "#081225",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#d6e4ff", font: { size: 13, family: "Manrope" } },
      },
      tooltip: {
        backgroundColor: "#081225",
        titleColor: "#67e8f9",
        bodyColor: "#d6e4ff",
      },
    },
    radius: "95%",
    cutout: "44%",
  };

  function renderChart(id) {
    if (id === "line") return <Line data={lineData} options={sharedOptions} />;
    if (id === "bar") {
      return (
        <>
          <p className="mb-3 text-sm font-semibold text-cyan-200">
            Total visível: {formatMoney(totalVisivel)}
          </p>
          <Bar data={barData} options={barOptions} />
        </>
      );
    }
    if (id === "pie") return <Pie data={pieData} options={pieOptions} />;
    return null;
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setWidgets((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <section className="page-surface fade-slide-in p-5 sm:p-7">
        <p className="section-tag">Resumo financeiro</p>
        <h1 className="section-title">Dashboard</h1>
        <p className="section-subtitle">
          Arraste os widgets para reorganizar como preferir. O painel atualiza conforme
          os filtros da legenda.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-500/35 bg-slate-900/45 p-3">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Categorias</p>
            <p className="mt-1 text-2xl font-bold text-slate-100">{categorias.length}</p>
          </div>
          <div className="rounded-xl border border-slate-500/35 bg-slate-900/45 p-3">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Meses</p>
            <p className="mt-1 text-2xl font-bold text-slate-100">{dados.length}</p>
          </div>
          <div className="rounded-xl border border-cyan-300/40 bg-cyan-300/10 p-3">
            <p className="text-xs uppercase tracking-[0.15em] text-cyan-100/80">Total geral</p>
            <p className="mt-1 text-2xl font-bold text-cyan-100">{formatMoney(totalGeral)}</p>
          </div>
        </div>
      </section>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={widgets.map((widget) => widget.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {widgets.map((widget) => (
              <SortableItem key={widget.id} id={widget.id} title={widget.title}>
                {renderChart(widget.id)}
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
