namespace Ssmsx.Core.Credentials;

public interface ICredentialStore
{
    Task StoreAsync(string key, string secret);
    Task<string?> RetrieveAsync(string key);
    Task DeleteAsync(string key);
}
