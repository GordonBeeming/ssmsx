using System.Diagnostics;

namespace Ssmsx.Core.Credentials;

public class MacOsCredentialStore : ICredentialStore
{
    private const string Account = "ssmsx";

    public async Task StoreAsync(string key, string secret)
    {
        var result = await RunProcessWithArgsAsync("security",
            ["add-generic-password", "-a", Account, "-s", key, "-w", secret, "-U"]);
        if (result.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"Failed to store credential for key '{key}': {result.StdErr}");
        }
    }

    public async Task<string?> RetrieveAsync(string key)
    {
        var result = await RunProcessWithArgsAsync("security",
            ["find-generic-password", "-a", Account, "-s", key, "-w"]);
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
        var result = await RunProcessWithArgsAsync("security",
            ["delete-generic-password", "-a", Account, "-s", key]);
        // Ignore "not found" errors — the credential may not exist
        if (result.ExitCode != 0 && !result.StdErr.Contains("could not be found", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                $"Failed to delete credential for key '{key}': {result.StdErr}");
        }
    }

    private static async Task<ProcessResult> RunProcessWithArgsAsync(string fileName, string[] args)
    {
        using var process = new Process();
        process.StartInfo = new ProcessStartInfo
        {
            FileName = fileName,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        foreach (var arg in args)
        {
            process.StartInfo.ArgumentList.Add(arg);
        }

        process.Start();

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
