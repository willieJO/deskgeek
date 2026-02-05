import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import api from "../utils/api";
import "./calendario.css"; // vamos customizar aqui
const baseURL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PRODUCAO
    : import.meta.env.VITE_LOCALHOST;
const diaSemanaMap = {
  "domingo": 0,
  "segunda-feira": 1,
  "terca-feira": 2,
  "terça-feira": 2,
  "quarta-feira": 3,
  "quinta-feira": 4,
  "sexta-feira": 5,
  "sabado": 6,
  "sábado": 6,
};

export default function CalendarioDex() {
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    async function fetchEventos() {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/MediaDex/obterMediaPorUsuario", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.data;

        // Mapear para formato FullCalendar
        const eventosFullCalendar = data.map(item => {
          const dayIndex = diaSemanaMap[item.diaNovoCapitulo?.toLowerCase()] ?? 4;

          // Monta URL da imagem só se tiver imagemDirectory (nome do arquivo no servidor)
          // Senão usa imagemUrl ou placeholder
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
            display: 'block',
            color: '#a855f7',
            extendedProps: {
              imagem: urlImagem,
            },
          };
        });

        setEventos(eventosFullCalendar);
      } catch (error) {
        console.error("Erro ao carregar eventos:", error);
      }
    }

    fetchEventos();
  }, []);

  const handleClickDia = (info) => {
    alert(`Você clicou no dia ${info.dateStr}`);
  };

  const eventContent = (eventInfo) => {
    return (
      <div style={{display: 'flex', alignItems: 'center', gap: 6}}>
        <img 
          src={eventInfo.event.extendedProps.imagem} 
          alt={eventInfo.event.title} 
          style={{width: 30, height: 42, objectFit: 'cover', borderRadius: 4}} 
        />
        <span>{eventInfo.event.title}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-6">
      <h1 className="text-3xl font-bold mb-4">Calendário de Lançamentos</h1>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={eventos}
        locale={ptBrLocale}
        dateClick={handleClickDia}
        height="auto"
        headerToolbar={{
          start: "prev,next today",
          center: "title",
          end: "",
        }}
        dayMaxEvents={100}
        eventColor="#a855f7"
        contentHeight="auto"
        eventContent={eventContent}
        dayCellClassNames="bg-[#1e1e1e] text-white border border-gray-700"
      />
    </div>
  );
}
