using System.Collections.Concurrent;
using Microsoft.Data.SqlClient;
using Ssmsx.Core.Credentials;
using Ssmsx.Core.Storage;
using Ssmsx.Protocol.Models;

namespace Ssmsx.Core.Connections;

public class ConnectionManager
{
    private readonly ConcurrentDictionary<string, SqlConnection> _connections = new();
    private readonly SqlConnectionFactory _factory = new();

    public async Task<string> ConnectAsync(
        string connectionId,
        ConnectionStore store,
        ICredentialStore credentialStore,
        CancellationToken ct = default)
    {
        var info = await store.GetAsync(connectionId)
            ?? throw new InvalidOperationException($"Connection '{connectionId}' not found");

        var connection = await _factory.CreateAsync(info, credentialStore, ct: ct);

        // Dispose any existing connection with same ID
        if (_connections.TryRemove(connectionId, out var existing))
            await existing.DisposeAsync();

        _connections[connectionId] = connection;

        // Update LastUsed
        await store.SaveAsync(info with { LastUsed = DateTime.UtcNow });

        return connectionId;
    }

    public async Task DisconnectAsync(string connectionId)
    {
        if (_connections.TryRemove(connectionId, out var connection))
            await connection.DisposeAsync();
    }

    public SqlConnection GetConnection(string connectionId)
    {
        if (_connections.TryGetValue(connectionId, out var connection))
            return connection;
        throw new InvalidOperationException($"No active connection for '{connectionId}'");
    }

    public async Task TestAsync(
        ConnectionInfo info,
        ICredentialStore credentialStore,
        string? inlinePassword = null,
        CancellationToken ct = default)
    {
        await using var connection = await _factory.CreateAsync(info, credentialStore, inlinePassword, ct);
        // Connection opened and immediately disposed — test passed
    }
}
