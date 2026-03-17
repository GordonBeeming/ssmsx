using System.Diagnostics;

namespace Ssmsx.Core.Credentials;

public class LinuxCredentialStore : ICredentialStore
{
    private const string Service = "ssmsx";

    public async Task StoreAsync(string key, string secret)
    {
        // secret-tool reads the secret from stdin
        var result = await RunProcessAsync(
            "secret-tool",
            $"store --label={Service} service {Service} key {key}",
            stdinData: secret);

        if (result.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"Failed to store credential for key '{key}': {result.StdErr}");
        }
    }

    public async Task<string?> RetrieveAsync(string key)
    {
        var result = await RunProcessAsync(
            "secret-tool",
            $"lookup service {Service} key {key}");

        if (result.ExitCode != 0)
        {
            return null;
        }

        var value = result.StdOut.Trim();
        return string.IsNullOrEmpty(value) ? null : value;
    }

    public async Task DeleteAsync(string key)
    {
        var result = await RunProcessAsync(
            "secret-tool",
            $"clear service {Service} key {key}");

        // Ignore "not found" errors — the credential may not exist
        if (result.ExitCode != 0
            && !result.StdErr.Contains("not found", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(result.StdErr))
        {
            throw new InvalidOperationException(
                $"Failed to delete credential for key '{key}': {result.StdErr}");
        }
    }

    private static async Task<ProcessResult> RunProcessAsync(
        string fileName,
        string arguments,
        string? stdinData = null)
    {
        using var process = new Process();
        process.StartInfo = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = stdinData is not null,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        process.Start();

        if (stdinData is not null)
        {
            await process.StandardInput.WriteAsync(stdinData);
            process.StandardInput.Close();
        }

        var stdOutTask = process.StandardOutput.ReadToEndAsync();
        var stdErrTask = process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync();

        return new ProcessResult(
            process.ExitCode,
            await stdOutTask,
            await stdErrTask);
    }

    private sealed record ProcessResult(int ExitCode, string StdOut, string StdErr);
}
