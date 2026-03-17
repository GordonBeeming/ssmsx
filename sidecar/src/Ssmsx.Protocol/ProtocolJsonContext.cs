using System.Text.Json.Serialization;
using Ssmsx.Protocol.Messages;
using Ssmsx.Protocol.Models;

namespace Ssmsx.Protocol;

[JsonSerializable(typeof(JsonRpcRequest))]
[JsonSerializable(typeof(JsonRpcResponse))]
[JsonSerializable(typeof(JsonRpcError))]
[JsonSerializable(typeof(PingResult))]
[JsonSerializable(typeof(ConnectionInfo))]
[JsonSerializable(typeof(List<ConnectionInfo>))]
[JsonSerializable(typeof(AuthType))]
[JsonSerializable(typeof(EncryptMode))]
[JsonSerializable(typeof(ConnectionGetParams))]
[JsonSerializable(typeof(ConnectionDeleteParams))]
[JsonSerializable(typeof(ConnectionSaveParams))]
[JsonSerializable(typeof(ConnectionTestParams))]
[JsonSerializable(typeof(ConnectionConnectParams))]
[JsonSerializable(typeof(ConnectionDisconnectParams))]
[JsonSerializable(typeof(ConnectionTestResult))]
[JsonSerializable(typeof(ConnectionConnectResult))]
[JsonSerializable(typeof(ConnectionDeleteResult))]
[JsonSerializable(typeof(bool))]
[JsonSerializable(typeof(object))]
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull)]
public partial class ProtocolJsonContext : JsonSerializerContext
{
}
