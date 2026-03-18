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
// Explorer DTOs
[JsonSerializable(typeof(DatabaseInfo))]
[JsonSerializable(typeof(List<DatabaseInfo>))]
[JsonSerializable(typeof(TableInfo))]
[JsonSerializable(typeof(List<TableInfo>))]
[JsonSerializable(typeof(ViewInfo))]
[JsonSerializable(typeof(List<ViewInfo>))]
[JsonSerializable(typeof(ColumnInfo))]
[JsonSerializable(typeof(List<ColumnInfo>))]
[JsonSerializable(typeof(KeyInfo))]
[JsonSerializable(typeof(List<KeyInfo>))]
[JsonSerializable(typeof(IndexInfo))]
[JsonSerializable(typeof(List<IndexInfo>))]
[JsonSerializable(typeof(StoredProcedureInfo))]
[JsonSerializable(typeof(List<StoredProcedureInfo>))]
[JsonSerializable(typeof(FunctionInfo))]
[JsonSerializable(typeof(List<FunctionInfo>))]
[JsonSerializable(typeof(DatabaseUserInfo))]
[JsonSerializable(typeof(List<DatabaseUserInfo>))]
[JsonSerializable(typeof(ObjectScriptResult))]
// Explorer message params
[JsonSerializable(typeof(ExplorerDatabasesParams))]
[JsonSerializable(typeof(ExplorerTablesParams))]
[JsonSerializable(typeof(ExplorerViewsParams))]
[JsonSerializable(typeof(ExplorerColumnsParams))]
[JsonSerializable(typeof(ExplorerKeysParams))]
[JsonSerializable(typeof(ExplorerIndexesParams))]
[JsonSerializable(typeof(ExplorerProceduresParams))]
[JsonSerializable(typeof(ExplorerFunctionsParams))]
[JsonSerializable(typeof(ExplorerUsersParams))]
[JsonSerializable(typeof(ExplorerObjectDefinitionParams))]
[JsonSerializable(typeof(List<string>))]
[JsonSourceGenerationOptions(
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull)]
public partial class ProtocolJsonContext : JsonSerializerContext
{
}
