using System.Runtime.InteropServices;

namespace Ssmsx.Core.Credentials;

public static class CredentialStoreFactory
{
    public static ICredentialStore Create()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            return new MacOsCredentialStore();
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            return new WindowsCredentialStore();
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            return new LinuxCredentialStore();

        throw new PlatformNotSupportedException(
            "No credential store available for this platform.");
    }
}
