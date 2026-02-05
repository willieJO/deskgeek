import { useEffect, useState, useMemo } from "react";
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

const PURPLE = "#7c3aed";

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: "#1e1e1e",
    border: "1px solid #374151",
    borderRadius: "0.75rem",
    padding: "1rem",
    minHeight: "320px",
    height: "100%",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [dados, setDados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [visiveis, setVisiveis] = useState({});
  const [widgets, setWidgets] = useState([
    { id: "line", title: "Gastos por Mês" },
    { id: "bar", title: "Gastos por Categoria" },
    { id: "pie", title: "Distribuição por Categoria" },
  ]);

  const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 10, 
    },
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
      } catch (err) {
        toast.error("Erro ao buscar dados do dashboard.");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const initialVisiveis = {};
    categorias.forEach((c) => {
      initialVisiveis[c.categoria] = true;
    });
    setVisiveis(initialVisiveis);
  }, [categorias]);

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    return "#" + Array.from({ length: 6 })
      .map(() => letters[Math.floor(Math.random() * 16)])
      .join("");
  };

  const categoriaColors = useMemo(() => {
    const map = {};
    categorias.forEach((item) => {
      map[item.categoria] = getRandomColor();
    });
    return map;
  }, [categorias]);

  const lineData = {
    labels: dados.map((d) => d.mes),
    datasets: [
      {
        label: "Gastos",
        data: dados.map((d) => d.total),
        borderColor: PURPLE,
        backgroundColor: PURPLE,
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  const sharedOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: "#ddd", font: { size: 14 } },
      },
      tooltip: {
        backgroundColor: "#222",
        titleColor: PURPLE,
        bodyColor: "#ddd",
      },
    },
    scales: {
      x: { ticks: { color: "#aaa" }, grid: { color: "#333" } },
      y: { ticks: { color: "#aaa" }, grid: { color: "#333" } },
    },
  };

  const barData = {
    labels: categorias.map((c) => c.categoria),
    datasets: categorias.map((c, index) => ({
      label: c.categoria,
      data: categorias.map((_, i) => (i === index ? c.total : 0)),
      backgroundColor: categoriaColors[c.categoria],
    })),
  };

  const totalVisivel = useMemo(() => {
    return barData.datasets.reduce((acc, dataset) => {
      if (!visiveis[dataset.label]) return acc;
      return acc + dataset.data.reduce((sum, val) => sum + val, 0);
    }, 0);
  }, [barData, visiveis]);

  const barOptions = {
    ...sharedOptions,
    plugins: {
      ...sharedOptions.plugins,
      legend: {
        onClick: (e, legendItem, legend) => {
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          const meta = ci.getDatasetMeta(index);
          meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;

          setVisiveis((old) => {
            const label = ci.data.datasets[index].label;
            return { ...old, [label]: !old[label] };
          });

          ci.update();
        },
        labels: { color: "#ddd", font: { size: 14 } },
      },
    },
  };

  const pieData = {
    labels: categorias.map((c) => c.categoria),
    datasets: [
      {
        data: categorias.map((c) => c.total),
        backgroundColor: categorias.map((c) => categoriaColors[c.categoria]),
        borderColor: "#121212",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#ddd",
          font: { size: 14 },
        },
      },
      tooltip: {
        backgroundColor: "#222",
        titleColor: PURPLE,
        bodyColor: "#ddd",
      },
    },
    radius: "100%",
    cutout: "40%",
  };

  function renderChart(id) {
    if (id === "line") return <Line data={lineData} options={sharedOptions} />;
    if (id === "bar")
      return (
        <>
          <p className="text-purple-400 mb-2 font-medium">
            Total visível: R$ {totalVisivel.toFixed(2)}
          </p>
          <Bar data={barData} options={barOptions} />
        </>
      );
    if (id === "pie") return <Pie data={pieData} options={pieOptions} />;
    return null;
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
  

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      <main className="flex-1 p-6 space-y-8">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={widgets.map((w) => w.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {widgets.map((w) => (
                <SortableItem key={w.id} id={w.id}>
                  <h2 className="text-xl font-semibold mb-2">{w.title}</h2>
                  {renderChart(w.id)}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </main>
    </div>
  );
}
