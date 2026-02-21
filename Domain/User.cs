namespace deskgeek.Domain
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Usuario { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
    }
}
