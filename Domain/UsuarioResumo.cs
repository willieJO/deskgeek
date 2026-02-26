namespace deskgeek.Domain
{
    public class UsuarioResumo
    {
        public Guid Id { get; set; }
        public string Usuario { get; set; } = string.Empty;
        public bool FotoPerfilDisponivel { get; set; }
    }
}
