import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import api from "../utils/api";
import "./calendario.css";

const baseURL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PRODUCAO
    : import.meta.env.VITE_LOCALHOST;

const diaSemanaMap = {
  domingo: 0,
  "segunda-feira": 1,
  "terca-feira": 2,
  "terça-feira": 2,
  "quarta-feira": 3,
  "quinta-feira": 4,
  "sexta-feira": 5,
  sabado: 6,
  "sábado": 6,
};

const diasPorIndice = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const hoverPreviewWidth = 330;
const hoverPreviewHeight = 210;
const hoverPreviewPadding = 12;
const hoverPreviewOffset = 18;

function getHoverPreviewPosition(clientX, clientY) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = clientX + hoverPreviewOffset;
  let top = clientY - 24;

  if (left + hoverPreviewWidth > viewportWidth - hoverPreviewPadding) {
    left = clientX - hoverPreviewWidth - hoverPreviewOffset;
  }
  if (left < hoverPreviewPadding) {
    left = hoverPreviewPadding;
  }

  if (top + hoverPreviewHeight > viewportHeight - hoverPreviewPadding) {
    top = viewportHeight - hoverPreviewHeight - hoverPreviewPadding;
  }
  if (top < hoverPreviewPadding) {
    top = hoverPreviewPadding;
  }

  return { left, top };
}

export default function CalendarioDex() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverPreview, setHoverPreview] = useState(null);

  useEffect(() => {
    async function fetchEventos() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/MediaDex/obterMediaPorUsuarioPorStatusEmAndamento", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data.filter(
          (item) =>
            item.status === "Em andamento" &&
            item.diaNovoCapitulo != null
        );

        const eventosFullCalendar = data.map((item) => {
          const dayIndex = diaSemanaMap[item.diaNovoCapitulo?.toLowerCase()] ?? 4;

          let urlImagem = "https://placehold.co/50x70?text=No+Image&font=roboto";
          if (item.imagemDirectory) {
            urlImagem = `${baseURL}/MediaDex/imagem/${item.imagemDirectory}`;
          } else if (item.imagemUrl) {
            urlImagem = item.imagemUrl;
          }

          return {
            id: item.id,
            title: item.nome,
            daysOfWeek: [dayIndex],
            display: "block",
            classNames: ["cal-event-card"],
            extendedProps: {
              imagem: urlImagem,
              status: item.status,
              dayIndex,
            },
          };
        });

        setEventos(eventosFullCalendar);
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEventos();
  }, []);

  useEffect(() => {
    const clearHoverPreview = () => setHoverPreview(null);

    window.addEventListener("resize", clearHoverPreview);
    window.addEventListener("scroll", clearHoverPreview, true);

    return () => {
      window.removeEventListener("resize", clearHoverPreview);
      window.removeEventListener("scroll", clearHoverPreview, true);
    };
  }, []);

  const quantidadePorDia = useMemo(() => {
    const porDia = {};
    eventos.forEach((evento) => {
      const diaIndex = evento.daysOfWeek?.[0];
      const diaNome = diasPorIndice[diaIndex] || "Sem dia";
      porDia[diaNome] = (porDia[diaNome] || 0) + 1;
    });
    return porDia;
  }, [eventos]);

  const diaMaisCheio = useMemo(() => {
    const entradas = Object.entries(quantidadePorDia);
    if (entradas.length === 0) return "Sem lançamentos";
    return entradas.sort((a, b) => b[1] - a[1])[0][0];
  }, [quantidadePorDia]);

  const handleEventMouseEnter = (mouseEvent, eventInfo) => {
    const { left, top } = getHoverPreviewPosition(mouseEvent.clientX, mouseEvent.clientY);
    const dayIndex = eventInfo.event.extendedProps.dayIndex;

    setHoverPreview({
      left,
      top,
      title: eventInfo.event.title,
      imagem: eventInfo.event.extendedProps.imagem,
      dia: diasPorIndice[dayIndex] || "Sem dia definido",
    });
  };

  const handleEventMouseMove = (mouseEvent) => {
    setHoverPreview((prev) => {
      if (!prev) return prev;
      const { left, top } = getHoverPreviewPosition(mouseEvent.clientX, mouseEvent.clientY);
      return { ...prev, left, top };
    });
  };

  const handleEventMouseLeave = () => {
    setHoverPreview(null);
  };

  const eventContent = (eventInfo) => (
    <div
      className="cal-event-content"
      onMouseEnter={(event) => handleEventMouseEnter(event, eventInfo)}
      onMouseMove={handleEventMouseMove}
      onMouseLeave={handleEventMouseLeave}
    >
      <img
        src={eventInfo.event.extendedProps.imagem}
        alt={eventInfo.event.title}
        className="cal-event-image"
      />
      <span className="cal-event-title">{eventInfo.event.title}</span>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <section className="page-surface fade-slide-in p-5 sm:p-7">
        <p className="section-tag">Lançamentos</p>
        <h1 className="section-title">Calendário de obras</h1>
        <p className="section-subtitle">
          Veja rapidamente em quais dias cada capítulo novo costuma sair.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="page-surface p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Total ativo</p>
          <p className="mt-2 text-3xl font-extrabold text-cyan-200">{eventos.length}</p>
          <p className="mt-1 text-sm text-slate-300">obras com dia de lançamento definido</p>
        </article>

        <article className="page-surface p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Dia mais cheio</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">{diaMaisCheio}</p>
          <p className="mt-1 text-sm text-slate-300">maior concentração de novidades</p>
        </article>

        <article className="page-surface p-4">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Visão mensal</p>
          <p className="mt-2 text-2xl font-bold text-slate-100">
            {loading ? "Carregando..." : "Atualizado"}
          </p>
          <p className="mt-1 text-sm text-slate-300">arraste para navegar entre meses</p>
        </article>
      </section>

      <section className="page-surface p-3 sm:p-5">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={eventos}
          locale={ptBrLocale}
          height="auto"
          contentHeight="auto"
          headerToolbar={{
            start: "prev,next today",
            center: "title",
            end: "",
          }}
          dayMaxEvents={4}
          eventContent={eventContent}
        />
      </section>

      {hoverPreview && (
        <div className="cal-hover-preview-layer" aria-hidden="true">
          <article
            className="cal-hover-preview"
            style={{ left: `${hoverPreview.left}px`, top: `${hoverPreview.top}px` }}
          >
            <img
              src={hoverPreview.imagem}
              alt={hoverPreview.title}
              className="cal-hover-preview-image"
            />
            <div className="cal-hover-preview-info">
              <p className="cal-hover-preview-day">{hoverPreview.dia}</p>
              <h3 className="cal-hover-preview-title">{hoverPreview.title}</h3>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
