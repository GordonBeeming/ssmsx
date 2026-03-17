using Ssmsx.Core.Connections;
using Ssmsx.Core.Credentials;
using Ssmsx.Protocol.Models;
using Xunit;

namespace Ssmsx.Core.Tests.Connections;

public class SqlConnectionFactoryTests
{
    private readonly SqlConnectionFactory _factory = new();

    [Fact]
    public async Task CreateAsync_ConnectionStringAuth_RequiresConnectionString()
    {
        var info = new ConnectionInfo
        {
            ServerName = "localhost",
            AuthType = AuthType.ConnectionString,
            ConnectionString = null
        };

        var store = new FakeCredentialStore();

        await Assert.ThrowsAsync<ArgumentException>(
            () => _factory.CreateAsync(info, store));
    }

    [Fact]
    public async Task CreateAsync_EntraMfa_AttemptsTokenAcquisition()
    {
        var info = new ConnectionInfo
        {
            ServerName = "localhost",
            AuthType = AuthType.EntraMfa
        };

        var store = new FakeCredentialStore();

        // EntraMfa is now supported — it will attempt interactive token acquisition
        // which fails in headless/test environments. Use a short cancellation timeout
        // to avoid hanging.
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        var ex = await Assert.ThrowsAnyAsync<Exception>(
            () => _factory.CreateAsync(info, store, ct: cts.Token));
        Assert.IsNotType<NotSupportedException>(ex);
    }

    [Fact]
    public async Task CreateAsync_SqlAuth_NoPasswordAvailable_ThrowsInvalidOperation()
    {
        var info = new ConnectionInfo
        {
            ServerName = "localhost",
            AuthType = AuthType.SqlAuth,
            Username = "sa",
            CredentialRef = null
        };

        var store = new FakeCredentialStore();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _factory.CreateAsync(info, store));
    }

    [Fact]
    public async Task CreateAsync_SqlAuth_NullUsername_ThrowsArgumentException()
    {
        var info = new ConnectionInfo
        {
            ServerName = "localhost",
            AuthType = AuthType.SqlAuth,
            Username = null,
            CredentialRef = "cred-1"
        };

        var store = new FakeCredentialStore();
        store.Store("cred-1", "password123");

        await Assert.ThrowsAsync<ArgumentException>(
            () => _factory.CreateAsync(info, store));
    }

    private class FakeCredentialStore : ICredentialStore
    {
        private readonly Dictionary<string, string> _store = new();

        public void Store(string key, string secret) => _store[key] = secret;

        public Task StoreAsync(string key, string secret)
        {
            _store[key] = secret;
            return Task.CompletedTask;
        }

        public Task<string?> RetrieveAsync(string key)
        {
            _store.TryGetValue(key, out var value);
            return Task.FromResult(value);
        }

        public Task DeleteAsync(string key)
        {
            _store.Remove(key);
            return Task.CompletedTask;
        }
    }
}
