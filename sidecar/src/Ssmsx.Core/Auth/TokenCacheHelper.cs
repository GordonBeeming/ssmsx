using Microsoft.Identity.Client;

namespace Ssmsx.Core.Auth;

public static class TokenCacheHelper
{
    private static readonly object FileLock = new();

    public static void EnableSerialization(ITokenCache tokenCache, string cacheFilePath)
    {
        tokenCache.SetBeforeAccess(args =>
        {
            lock (FileLock)
            {
                args.TokenCache.DeserializeMsalV3(
                    File.Exists(cacheFilePath) ? File.ReadAllBytes(cacheFilePath) : null);
            }
        });

        tokenCache.SetAfterAccess(args =>
        {
            if (args.HasStateChanged)
            {
                lock (FileLock)
                {
                    File.WriteAllBytes(cacheFilePath, args.TokenCache.SerializeMsalV3());

                    // Set restrictive permissions on Unix
                    if (!OperatingSystem.IsWindows())
                    {
                        File.SetUnixFileMode(cacheFilePath,
                            UnixFileMode.UserRead | UnixFileMode.UserWrite);
                    }
                }
            }
        });
    }
}
