namespace Ssmsx.Core.Credentials;

// TODO: Implement proper Windows credential storage using P/Invoke with
// [LibraryImport] (AOT-safe source-generated interop) for CredWriteW,
// CredReadW, CredDeleteW, and CredFree from advapi32.dll.
// CREDENTIAL_TYPE = 1 (CRED_TYPE_GENERIC), CRED_PERSIST = 2 (CRED_PERSIST_LOCAL_MACHINE).
public class WindowsCredentialStore : ICredentialStore
{
    public Task StoreAsync(string key, string secret)
    {
        throw new PlatformNotSupportedException(
            "Windows credential store is not yet implemented. " +
            "P/Invoke with [LibraryImport] for advapi32.dll (CredWriteW/CredReadW/CredDeleteW) is required.");
    }

    public Task<string?> RetrieveAsync(string key)
    {
        throw new PlatformNotSupportedException(
            "Windows credential store is not yet implemented. " +
            "P/Invoke with [LibraryImport] for advapi32.dll (CredWriteW/CredReadW/CredDeleteW) is required.");
    }

    public Task DeleteAsync(string key)
    {
        throw new PlatformNotSupportedException(
            "Windows credential store is not yet implemented. " +
            "P/Invoke with [LibraryImport] for advapi32.dll (CredWriteW/CredReadW/CredDeleteW) is required.");
    }
}
