import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import api from "../utils/api";
import { toast } from "react-toastify";

const baseURL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_PRODUCAO
    : import.meta.env.VITE_LOCALHOST;

// Tema escuro
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    primary: {
      main: "#a855f7",
    },
    text: {
      primary: "#ffffff",
    },
  },
  typography: {
    fontFamily: "inherit",
  },
});

export function TabelaDex() {
  const [data, setData] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Estados para imagem
  const [file, setFile] = useState(null);
  const [urlInput, setUrlInput] = useState("");

  // Modal de delete
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await api.get("/MediaDex/obterMediaPorUsuario", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data || []);
    } catch (error) {
      toast.error("Erro ao buscar tipos.");
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setOpenModal(true);

    // Resetar estados de imagem
    setFile(null);
    setUrlInput(item.imagemUrl || "");
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");

      // Se for arquivo, enviar como multipart
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
        // Se for URL ou sem imagem
        const payload = {
          ...selectedItem,
          imagemUrl: urlInput || null,
        };
        await api.put(`/MediaDex/${selectedItem.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success("Obra atualizada com sucesso!");
      setOpenModal(false);
      fetchData();
    } catch (error) {
      toast.error("Erro ao salvar alterações.");
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/MediaDex/${itemToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Obra "${itemToDelete.nome}" removida com sucesso!`);
      setOpenDeleteModal(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      toast.error("Erro ao remover obra.");
    }
  };

  const columns = [
    {
      accessorKey: "imagem",
      header: "Imagem",
      Cell: ({ row }) => {
        const item = row.original;
        let imageSrc = "https://placehold.co/50x70?text=No+Image&font=roboto";
        if (item.imagemDirectory) {
          imageSrc = `${baseURL}/MediaDex/imagem/${item.imagemDirectory}`;
        } else if (item.imagemUrl) {
          imageSrc = item.imagemUrl;
        }
        return (
          <img
            src={imageSrc}
            alt="Imagem"
            style={{
              width: "50px",
              height: "70px",
              objectFit: "cover",
              borderRadius: "4px",
            }}
          />
        );
      },
    },
    { accessorKey: "nome", header: "Nome" },
    { accessorKey: "totalCapitulos", header: "Total de capitulos" },
    { accessorKey: "capituloAtual", header: "Capitulo atual" },
    { accessorKey: "diaNovoCapitulo", header: "Dia de lançamento" },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "actions",
      header: "Ações",
      Cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row.original)}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-white"
          >
            Editar
          </button>
          <button
            onClick={() => handleDeleteClick(row.original)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
          >
            Remover
          </button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  // Lógica para preview da imagem escolhida
  const getPreviewImage = () => {
    if (file) return URL.createObjectURL(file);
    if (urlInput) return urlInput;
    if (selectedItem?.imagemDirectory)
      return `${baseURL}/MediaDex/imagem/${selectedItem.imagemDirectory}`;
    if (selectedItem?.imagemUrl) return selectedItem.imagemUrl;
    return "https://placehold.co/150x200?text=No+Image&font=roboto";
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className="min-h-screen bg-[#121212] text-white p-6">
        <h1 className="text-3xl font-bold mb-6">Lista de Obras</h1>
        <MaterialReactTable
          columns={columns}
          data={data}
          enableFilters
          enableColumnActions
          muiTableHeadCellProps={{
            sx: { backgroundColor: "#2c2c2c" },
          }}
          muiTableBodyCellProps={{
            sx: { backgroundColor: "#1e1e1e", color: "white" },
          }}
          muiTablePaperProps={{
            elevation: 0,
            sx: {
              backgroundColor: "#1e1e1e",
              border: "1px solid #444",
              borderRadius: "12px",
            },
          }}
        />

        {/* Modal de Edição */}
        <Dialog
          open={openModal}
          onClose={() => setOpenModal(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Editar Obra</DialogTitle>
          <DialogContent
            dividers
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {/* Preview da imagem */}
            <div className="flex flex-col items-center gap-2">
              <img
                src={getPreviewImage()}
                alt="Preview"
                style={{
                  width: "150px",
                  height: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #444",
                }}
              />
            </div>

            {/* Upload de arquivo */}
            <Button
              variant="contained"
              component="label"
              color="primary"
              sx={{ mt: 2 }}
            >
              Upload Imagem
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  setFile(e.target.files[0]);
                  setUrlInput(""); // limpa url
                }}
              />
            </Button>

            {/* Campo de URL */}
            <TextField
              label="URL da Imagem"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setFile(null); // limpa file
              }}
              fullWidth
            />

            <TextField
              label="Nome"
              value={selectedItem?.nome || ""}
              onChange={(e) =>
                setSelectedItem({ ...selectedItem, nome: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Total de Capitulos"
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
              label="Capitulo Atual"
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
              onChange={(e) =>
                setSelectedItem({ ...selectedItem, status: e.target.value })
              }
              fullWidth
            >
              {statusOpcoes.map((st) => (
                <MenuItem key={st} value={st}>
                  {st}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              Salvar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de confirmação para delete */}
        <Dialog
          open={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirmação</DialogTitle>
          <DialogContent dividers>
            <Typography>
              Tem certeza que deseja remover a obra{" "}
              <strong>{itemToDelete?.nome}</strong>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteModal(false)} color="inherit">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              variant="contained"
              color="error"
            >
              Remover
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}
