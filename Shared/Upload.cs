using deskgeek.Domain;
using Microsoft.Extensions.Options;
using Renci.SshNet;
using System.Diagnostics;

namespace deskgeek.Shared
{
    public class UploadService
    {
        private readonly SshSettings _ssh;

        public UploadService(IOptions<SshSettings> options)
        {
            _ssh = options.Value;
        }

        public async Task<string> UploadImageToServer(byte[] imageBytes, string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName);
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";

            var localTempFile = Path.Combine(Path.GetTempPath(), uniqueFileName);
            await File.WriteAllBytesAsync(localTempFile, imageBytes);

            var remoteDirectory = _ssh.RemoteBasePath.EndsWith("/")
                ? _ssh.RemoteBasePath
                : _ssh.RemoteBasePath + "/";

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
            var remotePath = $"{_ssh.RemoteBasePath}/{nomeArquivo}";
            var tempFileLocal = Path.Combine(Path.GetTempPath(), nomeArquivo);

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

            // Timeout de segurança (30 segundos)
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
                throw new Exception($"Erro ao executar comando:\n{error}");
        }
    }
}
