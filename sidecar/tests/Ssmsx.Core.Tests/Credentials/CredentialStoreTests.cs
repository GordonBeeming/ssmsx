using Ssmsx.Core.Credentials;
using Xunit;

namespace Ssmsx.Core.Tests.Credentials;

[Trait("Category", "Integration")]
public class CredentialStoreTests
{
    private readonly ICredentialStore _store = CredentialStoreFactory.Create();

    [Fact]
    public async Task StoreAndRetrieve_RoundTrip_ReturnsStoredSecret()
    {
        var key = $"ssmsx/test-{Guid.NewGuid()}";
        var secret = "test-secret-value-12345";

        try
        {
            await _store.StoreAsync(key, secret);

            var retrieved = await _store.RetrieveAsync(key);

            Assert.Equal(secret, retrieved);
        }
        finally
        {
            await _store.DeleteAsync(key);
        }
    }

    [Fact]
    public async Task RetrieveAsync_NonExistentKey_ReturnsNull()
    {
        var key = $"ssmsx/test-{Guid.NewGuid()}";

        var retrieved = await _store.RetrieveAsync(key);

        Assert.Null(retrieved);
    }

    [Fact]
    public async Task DeleteAsync_RemovesCredential()
    {
        var key = $"ssmsx/test-{Guid.NewGuid()}";
        var secret = "test-secret-to-delete";

        try
        {
            await _store.StoreAsync(key, secret);

            // Verify it was stored
            var beforeDelete = await _store.RetrieveAsync(key);
            Assert.Equal(secret, beforeDelete);

            await _store.DeleteAsync(key);

            var afterDelete = await _store.RetrieveAsync(key);
            Assert.Null(afterDelete);
        }
        finally
        {
            // Clean up in case test fails partway through
            await _store.DeleteAsync(key);
        }
    }

    [Fact]
    public async Task StoreAsync_OverwritesExistingCredential()
    {
        var key = $"ssmsx/test-{Guid.NewGuid()}";
        var originalSecret = "original-secret";
        var updatedSecret = "updated-secret";

        try
        {
            await _store.StoreAsync(key, originalSecret);
            await _store.StoreAsync(key, updatedSecret);

            var retrieved = await _store.RetrieveAsync(key);

            Assert.Equal(updatedSecret, retrieved);
        }
        finally
        {
            await _store.DeleteAsync(key);
        }
    }

    [Fact]
    public async Task DeleteAsync_NonExistentKey_DoesNotThrow()
    {
        var key = $"ssmsx/test-{Guid.NewGuid()}";

        // Should not throw
        await _store.DeleteAsync(key);
    }
}
