namespace desksaveanime.Domain
{
    public class SshSettings
    {
        public string Host { get; set; } = string.Empty;
        public string User { get; set; } = string.Empty;
        public string PrivateKeyPath { get; set; } = string.Empty;
        public string RemoteBasePath { get; set; } = string.Empty;
    }

}
