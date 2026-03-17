using Microsoft.Identity.Client;

namespace Ssmsx.Core.Auth;

public class EntraMfaAuthenticator
{
    // Well-known client ID used by Azure CLI / SSMS for public client apps accessing Azure SQL
    private const string ClientId = "04b07795-a71b-4346-935f-02f9a1efa4ce";
    private static readonly string[] Scopes = ["https://database.windows.net/.default"];

    private readonly IPublicClientApplication _app;

    public EntraMfaAuthenticator(string? cacheDirectory = null)
    {
        var cacheDir = cacheDirectory ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
            ".ssmsx", "token-cache");
        Directory.CreateDirectory(cacheDir);
        var cachePath = Path.Combine(cacheDir, "msal.cache");

        _app = PublicClientApplicationBuilder
            .CreateWithApplicationOptions(new PublicClientApplicationOptions
            {
                ClientId = ClientId,
                TenantId = "common",
            })
            .WithDefaultRedirectUri()
            .Build();

        // Enable file-based token cache
        TokenCacheHelper.EnableSerialization(_app.UserTokenCache, cachePath);
    }

    public async Task<string> AcquireTokenAsync(string? username = null, CancellationToken ct = default)
    {
        // Try silent first (cached token)
        var accounts = await _app.GetAccountsAsync();
        var account = username != null
            ? accounts.FirstOrDefault(a => string.Equals(a.Username, username, StringComparison.OrdinalIgnoreCase))
            : accounts.FirstOrDefault();

        if (account != null)
        {
            try
            {
                var silentResult = await _app
                    .AcquireTokenSilent(Scopes, account)
                    .ExecuteAsync(ct);
                return silentResult.AccessToken;
            }
            catch (MsalUiRequiredException)
            {
                // Fall through to interactive
            }
        }

        // Interactive flow — opens system browser for MFA
        var builder = _app.AcquireTokenInteractive(Scopes);
        if (!string.IsNullOrEmpty(username))
            builder = builder.WithLoginHint(username);

        var result = await builder.ExecuteAsync(ct);
        return result.AccessToken;
    }
}
