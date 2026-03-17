using System.Diagnostics;

namespace Ssmsx.Core.Credentials;

public class MacOsCredentialStore : ICredentialStore
{
    private const string Account = "ssmsx";

    public async Task StoreAsync(string key, string secret)
    {
        var result = await RunProcessWithStdinAsync(
            "security",
            $"add-generic-password -a {Account} -s {key} -w -U",
            secret);
        if (result.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"Failed to store credential for key '{key}': {result.StdErr}");
        }
    }

    public async Task<string?> RetrieveAsync(string key)
    {
        var result = await RunProcessAsync("security", $"find-generic-password -a {Account} -s {key} -w");
        if (result.ExitCode == 44)
        {
            return null;
        }

        if (result.ExitCode != 0)
        {
            // Treat other non-zero exit codes as "not found" as well,
            // since security CLI may return different codes on different macOS versions
            return null;
        }

        return result.StdOut.Trim();
    }

    public async Task DeleteAsync(string key)
    {
        var result = await RunProcessAsync("security", $"delete-generic-password -a {Account} -s {key}");
        // Ignore "not found" errors — the credential may not exist
        if (result.ExitCode != 0 && !result.StdErr.Contains("could not be found", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Failed to delete credential for key '{key}': {result.StdErr}");
        }
    }

    private static async Task<ProcessResult> RunProcessAsync(string fileName, string arguments)
    {
        return await RunProcessWithStdinAsync(fileName, arguments, null);
    }

    private static async Task<ProcessResult> RunProcessWithStdinAsync(string fileName, string arguments, string? stdin)
    {
        using var process = new Process();
        process.StartInfo = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = stdin is not null,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        process.Start();

        if (stdin is not null)
        {
            await process.StandardInput.WriteAsync(stdin);
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
