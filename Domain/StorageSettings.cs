namespace deskgeek.Domain
{
    public class StorageSettings
    {
        public string Provider { get; set; } = "Ssh";
        public string LocalBasePath { get; set; } = string.Empty;
    }
}
