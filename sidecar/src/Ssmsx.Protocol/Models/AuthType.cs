using System.Text.Json.Serialization;

namespace Ssmsx.Protocol.Models;

[JsonConverter(typeof(JsonStringEnumConverter<AuthType>))]
public enum AuthType
{
    SqlAuth,
    ConnectionString,
    EntraMfa
}
