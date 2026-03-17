using System.Text.Json.Serialization;

namespace Ssmsx.Protocol.Models;

[JsonConverter(typeof(JsonStringEnumConverter<EncryptMode>))]
public enum EncryptMode
{
    Mandatory,
    Optional,
    Strict
}
