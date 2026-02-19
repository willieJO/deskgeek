import { useEffect, useState } from "react";
import { MaterialReactTable } from "material-react-table";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Typography,
  Chip,
} from "@mui/material";
import api from "../utils/api";
import { toast } from "react-toastify";

const baseURL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PRODUCAO
    : import.meta.env.VITE_LOCALHOST;

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#22d3ee" },
    secondary: { main: "#38bdf8" },
    error: { main: "#f87171" },
    background: {
      default: "#070f1e",
      paper: "#0b172d",
    },
    text: {
      primary: "#e9f2ff",
      secondary: "#9eb1cc",
    },
  },
  typography: {
    fontFamily: "Manrope, sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(10, 19, 37, 0.85)",
        },
        notchedOutline: {
          borderColor: "rgba(148, 163, 184, 0.35)",
        },
      },
    },
  },
});

const diasSemana = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const statusOpcoes = ["Em andamento", "Finalizado", "Inativo"];

function getImageSource(item) {
  if (item.imagemDirectory) {
    return `${baseURL}/MediaDex/imagem/${item.imagemDirectory}`;
  }
  if (item.imagemUrl) {
    return item.imagemUrl;
  }
  return "https://placehold.co/50x70?text=No+Image&font=roboto";
}

export function TabelaDex() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [file, setFile] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const response = await api.get("/MediaDex/obterMediaPorUsuario", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data || []);
    } catch {
      toast.error("Erro ao buscar obras.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setOpenModal(true);
    setFile(null);
    setUrlInput(item.imagemUrl || "");
  };

  const handleSave = async () => {
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem("token");

      if (file) {
        const formData = new FormData();
        formData.append("ImagemUpload", file);
        formData.append("setUrlInput", urlInput);
        formData.append("nome", selectedItem.nome);
        formData.append("totalCapitulos", selectedItem.totalCapitulos);
        formData.append("capituloAtual", selectedItem.capituloAtual);
        formData.append("diaNovoCapitulo", selectedItem.diaNovoCapitulo);
        formData.append("status", selectedItem.status);

        await api.put(`/MediaDex/${selectedItem.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        const payload = {
          ...selectedItem,
          imagemUrl: urlInput || null,
        };
        await api.put(`/MediaDex/${selectedItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success("Obra atualizada com sucesso.");
      setOpenModal(false);
      fetchData();
    } catch {
      toast.error("Erro ao salvar alterações.");
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/MediaDex/${itemToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Obra "${itemToDelete.nome}" removida com sucesso.`);
      setOpenDeleteModal(false);
      setItemToDelete(null);
      fetchData();
    } catch {
      toast.error("Erro ao remover obra.");
    }
  };

  const getPreviewImage = () => {
    if (file) return URL.createObjectURL(file);
    if (urlInput) return urlInput;
    if (selectedItem?.imagemDirectory) {
      return `${baseURL}/MediaDex/imagem/${selectedItem.imagemDirectory}`;
    }
    if (selectedItem?.imagemUrl) return selectedItem.imagemUrl;
    return "https://placehold.co/150x200?text=No+Image&font=roboto";
  };

  const columns = [
    {
      accessorKey: "imagem",
      header: "Imagem",
      Cell: ({ row }) => (
        <img
          src={getImageSource(row.original)}
          alt={row.original.nome}
          style={{
            width: "52px",
            height: "72px",
            objectFit: "cover",
            borderRadius: "8px",
            border: "1px solid rgba(148,163,184,0.36)",
          }}
        />
      ),
      size: 80,
    },
    { accessorKey: "nome", header: "Nome" },
    { accessorKey: "totalCapitulos", header: "Total de capítulos" },
    { accessorKey: "capituloAtual", header: "Capítulo atual" },
    { accessorKey: "diaNovoCapitulo", header: "Lançamento" },
    {
      accessorKey: "status",
      header: "Status",
      Cell: ({ cell }) => {
        const value = cell.getValue();
        const palette =
          value === "Finalizado"
            ? { color: "#34d399", bg: "rgba(52,211,153,0.16)" }
            : value === "Inativo"
              ? { color: "#fca5a5", bg: "rgba(248,113,113,0.16)" }
              : { color: "#67e8f9", bg: "rgba(34,211,238,0.16)" };

        return (
          <Chip
            label={value}
            size="small"
            sx={{
              border: "1px solid rgba(148,163,184,0.4)",
              backgroundColor: palette.bg,
              color: palette.color,
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Ações",
      enableColumnActions: false,
      enableSorting: false,
      Cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleEdit(row.original)} className="ui-button-secondary text-sm">
            Editar
          </button>
          <button onClick={() => handleDeleteClick(row.original)} className="ui-button-danger text-sm">
            Remover
          </button>
        </div>
      ),
    },
  ];

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="mx-auto w-full max-w-[1200px] space-y-5">
        <section className="page-surface fade-slide-in p-5 sm:p-7">
          <p className="section-tag">Coleção</p>
          <h1 className="section-title">Minhas obras</h1>
          <p className="section-subtitle">
            Filtre, edite e mantenha sua biblioteca atualizada em uma única visão.
          </p>
        </section>

        <section className="page-surface fade-slide-in p-4">
          <MaterialReactTable
            columns={columns}
            data={data}
            state={{ isLoading }}
            enableFilters
            enableColumnActions
            muiTopToolbarProps={{
              sx: {
                backgroundColor: "rgba(10, 18, 33, 0.9)",
                borderBottom: "1px solid rgba(148,163,184,0.18)",
              },
            }}
            muiBottomToolbarProps={{
              sx: {
                backgroundColor: "rgba(10, 18, 33, 0.9)",
                borderTop: "1px solid rgba(148,163,184,0.18)",
              },
            }}
            muiTableHeadCellProps={{
              sx: {
                backgroundColor: "rgba(12, 22, 40, 0.96)",
                color: "#dbeafe",
                borderBottom: "1px solid rgba(148,163,184,0.24)",
              },
            }}
            muiTableBodyCellProps={{
              sx: {
                backgroundColor: "rgba(8, 16, 31, 0.86)",
                color: "#e2edff",
                borderBottom: "1px solid rgba(148,163,184,0.12)",
              },
            }}
            muiTablePaperProps={{
              elevation: 0,
              sx: {
                backgroundColor: "transparent",
                border: "1px solid rgba(148,163,184,0.3)",
                borderRadius: "12px",
                overflow: "hidden",
              },
            }}
          />
        </section>

        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              border: "1px solid rgba(148,163,184,0.36)",
              background: "linear-gradient(160deg,#0e1930,#0a1326)",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>Editar obra</DialogTitle>
          <DialogContent
            dividers
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              borderColor: "rgba(148,163,184,0.22)",
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <img
                src={getPreviewImage()}
                alt="Preview"
                style={{
                  width: "150px",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "10px",
                  border: "1px solid rgba(148,163,184,0.4)",
                }}
              />
            </div>

            <Button variant="outlined" component="label" color="primary" sx={{ mt: 1 }}>
              Upload imagem
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  setUrlInput("");
                }}
              />
            </Button>

            <TextField
              label="URL da imagem"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setFile(null);
              }}
              fullWidth
            />

            <TextField
              label="Nome"
              value={selectedItem?.nome || ""}
              onChange={(e) => setSelectedItem({ ...selectedItem, nome: e.target.value })}
              fullWidth
            />

            <TextField
              label="Total de capítulos"
              type="number"
              value={selectedItem?.totalCapitulos || ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  totalCapitulos: e.target.value === "" ? null : Number(e.target.value),
                })
              }
              fullWidth
            />

            <TextField
              label="Capítulo atual"
              type="number"
              value={selectedItem?.capituloAtual || ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  capituloAtual: e.target.value,
                })
              }
              fullWidth
            />

            <TextField
              select
              label="Dia de lançamento"
              value={selectedItem?.diaNovoCapitulo || ""}
              onChange={(e) =>
                setSelectedItem({
                  ...selectedItem,
                  diaNovoCapitulo: e.target.value,
                })
              }
              fullWidth
            >
              {diasSemana.map((dia) => (
                <MenuItem key={dia} value={dia}>
                  {dia}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={selectedItem?.status || ""}
              onChange={(e) => setSelectedItem({ ...selectedItem, status: e.target.value })}
              fullWidth
            >
              {statusOpcoes.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              border: "1px solid rgba(248,113,113,0.35)",
              background: "linear-gradient(160deg,#24131d,#130b13)",
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>Confirmação</DialogTitle>
          <DialogContent dividers sx={{ borderColor: "rgba(248,113,113,0.28)" }}>
            <Typography>
              Tem certeza que deseja remover a obra <strong>{itemToDelete?.nome}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenDeleteModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error">
              Remover
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}
