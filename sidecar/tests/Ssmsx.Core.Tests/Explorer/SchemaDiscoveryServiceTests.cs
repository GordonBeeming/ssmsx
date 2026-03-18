using Ssmsx.Core.Explorer;
using Xunit;

namespace Ssmsx.Core.Tests.Explorer;

public class SchemaDiscoveryServiceTests
{
    [Theory]
    [InlineData("master")]
    [InlineData("AdventureWorks2019")]
    [InlineData("my database")]
    [InlineData("db-name.test")]
    [InlineData("db_name")]
    public void ValidateDatabaseName_AcceptsValidNames(string name)
    {
        var ex = Record.Exception(() => SchemaDiscoveryService.ValidateDatabaseName(name));
        Assert.Null(ex);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("db; DROP TABLE users")]
    [InlineData("db' OR '1'='1")]
    [InlineData("test\ndb")]
    [InlineData("db[test]")]
    public void ValidateDatabaseName_RejectsInvalidNames(string name)
    {
        Assert.Throws<ArgumentException>(() => SchemaDiscoveryService.ValidateDatabaseName(name));
    }

    [Fact]
    public void ValidateDatabaseName_RejectsNull()
    {
        Assert.Throws<ArgumentException>(() => SchemaDiscoveryService.ValidateDatabaseName(null!));
    }
}
