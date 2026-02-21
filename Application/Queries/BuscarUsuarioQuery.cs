using deskgeek.Domain;
using MediatR;

namespace deskgeek.Application.Queries
{
    public class BuscarUsuarioQuery : IRequest<List<UsuarioResumo>>
    {
        public string Termo { get; set; } = string.Empty;
        public int Limite { get; set; } = 10;
    }
}
