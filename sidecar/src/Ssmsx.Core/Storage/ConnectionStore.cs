using System.Text.Json;
using Ssmsx.Protocol;
using Ssmsx.Protocol.Models;

namespace Ssmsx.Core.Storage;

public class ConnectionStore
{
    private readonly string _filePath;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public ConnectionStore(string? basePath = null)
    {
        var dir = basePath ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".ssmsx");
        Directory.CreateDirectory(dir);
        _filePath = Path.Combine(dir, "connections.json");
    }

    public async Task<List<ConnectionInfo>> ListAsync()
    {
        await _lock.WaitAsync();
        try
        {
            var connections = await ReadFileAsync();
            return connections.OrderByDescending(c => c.LastUsed).ToList();
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<ConnectionInfo?> GetAsync(string id)
    {
        await _lock.WaitAsync();
        try
        {
            var connections = await ReadFileAsync();
            return connections.FirstOrDefault(c => c.Id == id);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task SaveAsync(ConnectionInfo connection)
    {
        await _lock.WaitAsync();
        try
        {
            var connections = await ReadFileAsync();
            var index = connections.FindIndex(c => c.Id == connection.Id);
            if (index >= 0)
                connections[index] = connection;
            else
                connections.Add(connection);
            await WriteFileAsync(connections);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task<bool> DeleteAsync(string id)
    {
        await _lock.WaitAsync();
        try
        {
            var connections = await ReadFileAsync();
            var removed = connections.RemoveAll(c => c.Id == id);
            if (removed > 0)
                await WriteFileAsync(connections);
            return removed > 0;
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task<List<ConnectionInfo>> ReadFileAsync()
    {
        if (!File.Exists(_filePath))
            return new List<ConnectionInfo>();

        var json = await File.ReadAllTextAsync(_filePath);
        if (string.IsNullOrWhiteSpace(json))
            return new List<ConnectionInfo>();

        var connections = JsonSerializer.Deserialize(json, ProtocolJsonContext.Default.ListConnectionInfo);
        if (connections is null)
        {
            await Console.Error.WriteLineAsync($"Warning: Failed to deserialize connections from {_filePath}, returning empty list");
            return new List<ConnectionInfo>();
        }
        return connections;
    }

    private async Task WriteFileAsync(List<ConnectionInfo> connections)
    {
        var json = JsonSerializer.Serialize(connections, ProtocolJsonContext.Default.ListConnectionInfo);
        var tempPath = _filePath + ".tmp";
        await File.WriteAllTextAsync(tempPath, json);
        File.Move(tempPath, _filePath, overwrite: true);
    }
}
