using System.Text.Json;
using Ssmsx.Protocol;
using Ssmsx.Protocol.Messages;
using Ssmsx.Protocol.Models;
using Ssmsx.Core.Storage;
using Ssmsx.Core.Connections;
using Ssmsx.Core.Credentials;

// Disable stdout buffering for real-time communication
Console.OutputEncoding = System.Text.Encoding.UTF8;

// Initialize shared services
var connectionStore = new ConnectionStore();
var credentialStore = CredentialStoreFactory.Create();
var connectionManager = new ConnectionManager();

var handlers = new Dictionary<string, Func<JsonElement?, Task<JsonElement>>>
{
    ["ping"] = _ => Task.FromResult(JsonSerializer.SerializeToElement(
        new PingResult { Message = "pong", Version = "0.1.0" },
        ProtocolJsonContext.Default.PingResult)),

    ["connection.list"] = async _ =>
    {
        var connections = await connectionStore.ListAsync();
        return JsonSerializer.SerializeToElement(connections, ProtocolJsonContext.Default.ListConnectionInfo);
    },

    ["connection.get"] = async p =>
    {
        var args = Deserialize<ConnectionGetParams>(p, ProtocolJsonContext.Default.ConnectionGetParams);
        var connection = await connectionStore.GetAsync(args.Id);
        return connection is not null
            ? JsonSerializer.SerializeToElement(connection, ProtocolJsonContext.Default.ConnectionInfo)
            : JsonSerializer.SerializeToElement<object?>(null, ProtocolJsonContext.Default.Object);
    },

    ["connection.save"] = async p =>
    {
        var args = Deserialize<ConnectionSaveParams>(p, ProtocolJsonContext.Default.ConnectionSaveParams);
        // Store password in keychain if provided
        ConnectionInfo saved;
        if (!string.IsNullOrEmpty(args.Password))
        {
            var credKey = $"ssmsx/{args.Connection.Id}";
            await credentialStore.StoreAsync(credKey, args.Password);
            // Save connection with credential reference
            saved = args.Connection with { CredentialRef = credKey };
            await connectionStore.SaveAsync(saved);
        }
        else
        {
            saved = args.Connection;
            await connectionStore.SaveAsync(saved);
        }
        return JsonSerializer.SerializeToElement(saved, ProtocolJsonContext.Default.ConnectionInfo);
    },

    ["connection.delete"] = async p =>
    {
        var args = Deserialize<ConnectionDeleteParams>(p, ProtocolJsonContext.Default.ConnectionDeleteParams);
        // Try to delete credential from keychain
        try { await credentialStore.DeleteAsync($"ssmsx/{args.Id}"); } catch { /* ignore */ }
        var deleted = await connectionStore.DeleteAsync(args.Id);
        return JsonSerializer.SerializeToElement(
            new ConnectionDeleteResult { Deleted = deleted },
            ProtocolJsonContext.Default.ConnectionDeleteResult);
    },

    ["connection.test"] = async p =>
    {
        var args = Deserialize<ConnectionTestParams>(p, ProtocolJsonContext.Default.ConnectionTestParams);
        try
        {
            await connectionManager.TestAsync(args.Connection, credentialStore, args.Password);
            return JsonSerializer.SerializeToElement(
                new ConnectionTestResult { Success = true },
                ProtocolJsonContext.Default.ConnectionTestResult);
        }
        catch (Exception ex)
        {
            return JsonSerializer.SerializeToElement(
                new ConnectionTestResult { Success = false, Error = ex.Message },
                ProtocolJsonContext.Default.ConnectionTestResult);
        }
    },

    ["connection.connect"] = async p =>
    {
        var args = Deserialize<ConnectionConnectParams>(p, ProtocolJsonContext.Default.ConnectionConnectParams);
        var connId = await connectionManager.ConnectAsync(args.Id, connectionStore, credentialStore);
        return JsonSerializer.SerializeToElement(
            new ConnectionConnectResult { ConnectionId = connId },
            ProtocolJsonContext.Default.ConnectionConnectResult);
    },

    ["connection.disconnect"] = async p =>
    {
        var args = Deserialize<ConnectionDisconnectParams>(p, ProtocolJsonContext.Default.ConnectionDisconnectParams);
        await connectionManager.DisconnectAsync(args.Id);
        return JsonSerializer.SerializeToElement(true, ProtocolJsonContext.Default.Boolean);
    }
};

await using var stdout = Console.OpenStandardOutput();
using var writer = new StreamWriter(stdout) { AutoFlush = true };

string? line;
while ((line = Console.ReadLine()) is not null)
{
    if (string.IsNullOrWhiteSpace(line))
        continue;

    JsonRpcResponse response;
    try
    {
        var request = JsonSerializer.Deserialize(line, ProtocolJsonContext.Default.JsonRpcRequest);
        if (request is null)
        {
            response = new JsonRpcResponse
            {
                Id = "unknown",
                Error = new JsonRpcError { Code = "INVALID_REQUEST", Message = "Deserialized request was null" }
            };
            var nullJson = JsonSerializer.Serialize(response, ProtocolJsonContext.Default.JsonRpcResponse);
            await writer.WriteLineAsync(nullJson);
            continue;
        }

        if (handlers.TryGetValue(request.Method, out var handler))
        {
            var result = await handler(request.Params);
            response = new JsonRpcResponse { Id = request.Id, Result = result };
        }
        else
        {
            response = new JsonRpcResponse
            {
                Id = request.Id,
                Error = new JsonRpcError { Code = "METHOD_NOT_FOUND", Message = $"Unknown method: {request.Method}" }
            };
        }
    }
    catch (JsonException ex)
    {
        response = new JsonRpcResponse
        {
            Id = "unknown",
            Error = new JsonRpcError { Code = "PARSE_ERROR", Message = ex.Message }
        };
    }
    catch (Exception ex)
    {
        response = new JsonRpcResponse
        {
            Id = "unknown",
            Error = new JsonRpcError { Code = "INTERNAL_ERROR", Message = ex.Message }
        };
    }

    var json = JsonSerializer.Serialize(response, ProtocolJsonContext.Default.JsonRpcResponse);
    await writer.WriteLineAsync(json);
}

// Helper to deserialize params with proper error handling
static T Deserialize<T>(JsonElement? element, System.Text.Json.Serialization.Metadata.JsonTypeInfo<T> typeInfo)
{
    if (element is null)
        throw new ArgumentException($"Missing params for {typeof(T).Name}");
    return JsonSerializer.Deserialize(element.Value, typeInfo)
        ?? throw new ArgumentException($"Failed to deserialize params for {typeof(T).Name}");
}
