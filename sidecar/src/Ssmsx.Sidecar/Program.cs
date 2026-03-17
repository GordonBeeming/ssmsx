using System.Text.Json;
using Ssmsx.Protocol;

// Disable stdout buffering for real-time communication
Console.OutputEncoding = System.Text.Encoding.UTF8;

var handlers = new Dictionary<string, Func<JsonElement?, JsonElement>>
{
    ["ping"] = _ => JsonSerializer.SerializeToElement(
        new PingResult { Message = "pong", Version = "0.1.0" },
        ProtocolJsonContext.Default.PingResult)
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
            var result = handler(request.Params);
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
