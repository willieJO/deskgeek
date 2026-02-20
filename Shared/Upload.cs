using deskgeek.Domain;
using Microsoft.Extensions.Options;
using System.Diagnostics;

namespace deskgeek.Shared
{
    public class UploadService
    {
        private readonly SshSettings _ssh;
        private readonly StorageSettings _storage;

        public UploadService(IOptions<SshSettings> sshOptions, IOptions<StorageSettings> storageOptions)
        {
            _ssh = sshOptions.Value;
            _storage = storageOptions.Value;
        }

        public async Task<string> UploadImageToServer(byte[] imageBytes, string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName);
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";

            if (UseLocalStorage())
            {
                var localBasePath = ResolveLocalBasePath();
                Directory.CreateDirectory(localBasePath);

                var destinationPath = Path.Combine(localBasePath, uniqueFileName);
                await File.WriteAllBytesAsync(destinationPath, imageBytes);

                return uniqueFileName;
            }

            var localTempFile = Path.Combine(Path.GetTempPath(), uniqueFileName);
            await File.WriteAllBytesAsync(localTempFile, imageBytes);

            var remoteDirectory = ResolveRemoteDirectory();
            var remoteFilePath = remoteDirectory + uniqueFileName;

            RunCommand(
                "ssh",
                $"-o StrictHostKeyChecking=no " +
                $"-o UserKnownHostsFile=/dev/null " +
                $"-o BatchMode=yes " +
                $"-i \"{_ssh.PrivateKeyPath}\" {_ssh.User}@{_ssh.Host} " +
                $"\"mkdir -p {remoteDirectory}\""
            );

            RunCommand(
                "scp",
                $"-o StrictHostKeyChecking=no " +
                $"-o UserKnownHostsFile=/dev/null " +
                $"-o BatchMode=yes " +
                $"-i \"{_ssh.PrivateKeyPath}\" " +
                $"\"{localTempFile}\" {_ssh.User}@{_ssh.Host}:\"{remoteFilePath}\""
            );

            File.Delete(localTempFile);
            return uniqueFileName;
        }

        public string? BaixarArquivoRemoto(string nomeArquivo)
        {
            var safeFileName = Path.GetFileName(nomeArquivo);
            if (string.IsNullOrWhiteSpace(safeFileName))
            {
                return null;
            }

            var tempFileLocal = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}_{safeFileName}");

            if (UseLocalStorage())
            {
                var sourcePath = Path.Combine(ResolveLocalBasePath(), safeFileName);
                if (!File.Exists(sourcePath))
                {
                    return null;
                }

                File.Copy(sourcePath, tempFileLocal, true);
                return tempFileLocal;
            }

            var remotePath = $"{ResolveRemoteDirectory()}{safeFileName}";

            RunCommand(
                "scp",
                $"-o StrictHostKeyChecking=no " +
                $"-o UserKnownHostsFile=/dev/null " +
                $"-o BatchMode=yes " +
                $"-o ConnectTimeout=10 " +
                $"-i \"{_ssh.PrivateKeyPath}\" " +
                $"{_ssh.User}@{_ssh.Host}:\"{remotePath}\" " +
                $"\"{tempFileLocal}\""
            );

            return File.Exists(tempFileLocal) ? tempFileLocal : null;
        }

        private bool UseLocalStorage()
        {
            return string.Equals(_storage.Provider, "Local", StringComparison.OrdinalIgnoreCase);
        }

        private string ResolveLocalBasePath()
        {
            var configuredPath = _storage.LocalBasePath?.Trim();
            if (string.IsNullOrWhiteSpace(configuredPath))
            {
                return Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "mediaDex");
            }

            if (Path.IsPathRooted(configuredPath))
            {
                return configuredPath;
            }

            return Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), configuredPath));
        }

        private string ResolveRemoteDirectory()
        {
            if (string.IsNullOrWhiteSpace(_ssh.RemoteBasePath))
            {
                throw new Exception("SshSettings:RemoteBasePath não configurado para upload remoto.");
            }

            return _ssh.RemoteBasePath.EndsWith("/")
                ? _ssh.RemoteBasePath
                : _ssh.RemoteBasePath + "/";
        }

        private static void RunCommand(string command, string args)
        {
            using var process = new Process();

            process.StartInfo = new ProcessStartInfo
            {
                FileName = command,
                Arguments = args,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            process.Start();

            if (!process.WaitForExit(30000))
            {
                process.Kill();
                throw new Exception("Processo travou (timeout 30s).");
            }

            var output = process.StandardOutput.ReadToEnd();
            var error = process.StandardError.ReadToEnd();

            Console.WriteLine("STDOUT:");
            Console.WriteLine(output);

            Console.WriteLine("STDERR:");
            Console.WriteLine(error);

            if (process.ExitCode != 0)
            {
                throw new Exception($"Erro ao executar comando:\n{error}");
            }
        }
    }
}
