#!/bin/bash
set -euo pipefail

# Create a SQL Server 2022 Docker container with Microsoft sample databases
# Usage: ./build/create-demo-db.sh
# Port: 4242, Password: Password!@2

CONTAINER_NAME="ssmsx-demo-sql"
SA_PASSWORD="Password!@2"
SQL_PORT=4242
SQL_IMAGE="mcr.microsoft.com/mssql/server:2022-latest"
SQLCMD_PATH="/opt/mssql-tools18/bin/sqlcmd"
SQLCMD_EXTRA_FLAGS="-C"

echo "==> Setting up SQL Server 2022 demo database on port ${SQL_PORT}..."

# Stop and remove existing container if present
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "==> Removing existing container '${CONTAINER_NAME}'..."
    docker rm -f "${CONTAINER_NAME}" > /dev/null
fi

# Start SQL Server container
echo "==> Starting container..."
docker run -d \
    --platform linux/amd64 \
    --name "${CONTAINER_NAME}" \
    -e "ACCEPT_EULA=Y" \
    -e "MSSQL_SA_PASSWORD=${SA_PASSWORD}" \
    -e "MSSQL_PID=Developer" \
    -p "${SQL_PORT}:1433" \
    "${SQL_IMAGE}"

# Wait for SQL Server to be ready
echo "==> Waiting for SQL Server to start..."
for i in $(seq 1 60); do
    if docker exec "${CONTAINER_NAME}" "${SQLCMD_PATH}" \
        -S localhost -U sa -P "${SA_PASSWORD}" ${SQLCMD_EXTRA_FLAGS} -Q "SELECT 1" &>/dev/null; then
        echo "==> SQL Server is ready!"
        break
    fi
    if [ "$i" -eq 60 ]; then
        echo "ERROR: SQL Server did not start within 60 seconds"
        docker logs "${CONTAINER_NAME}" 2>&1 | tail -20
        exit 1
    fi
    sleep 1
done

SQLCMD="docker exec ${CONTAINER_NAME} ${SQLCMD_PATH} -S localhost -U sa -P ${SA_PASSWORD} ${SQLCMD_EXTRA_FLAGS}"

# Download backups to host temp dir, then copy into container
HOST_BACKUP_DIR=$(mktemp -d)
CONTAINER_BACKUP_DIR="/tmp/backups"
docker exec "${CONTAINER_NAME}" mkdir -p "${CONTAINER_BACKUP_DIR}"

trap "rm -rf ${HOST_BACKUP_DIR}" EXIT

echo "==> Downloading AdventureWorks2022 (OLTP)..."
curl -sL "https://github.com/Microsoft/sql-server-samples/releases/download/adventureworks/AdventureWorks2022.bak" \
    -o "${HOST_BACKUP_DIR}/AdventureWorks2022.bak"
docker cp "${HOST_BACKUP_DIR}/AdventureWorks2022.bak" "${CONTAINER_NAME}:${CONTAINER_BACKUP_DIR}/"

echo "==> Downloading AdventureWorksDW2022 (Data Warehouse)..."
curl -sL "https://github.com/Microsoft/sql-server-samples/releases/download/adventureworks/AdventureWorksDW2022.bak" \
    -o "${HOST_BACKUP_DIR}/AdventureWorksDW2022.bak"
docker cp "${HOST_BACKUP_DIR}/AdventureWorksDW2022.bak" "${CONTAINER_NAME}:${CONTAINER_BACKUP_DIR}/"

echo "==> Downloading WideWorldImporters (OLTP)..."
curl -sL "https://github.com/Microsoft/sql-server-samples/releases/download/wide-world-importers-v1.0/WideWorldImporters-Full.bak" \
    -o "${HOST_BACKUP_DIR}/WideWorldImporters-Full.bak"
docker cp "${HOST_BACKUP_DIR}/WideWorldImporters-Full.bak" "${CONTAINER_NAME}:${CONTAINER_BACKUP_DIR}/"

# Restore AdventureWorks2022
echo "==> Restoring AdventureWorks2022..."
${SQLCMD} -Q "
RESTORE DATABASE [AdventureWorks2022]
FROM DISK = '${CONTAINER_BACKUP_DIR}/AdventureWorks2022.bak'
WITH MOVE 'AdventureWorks2022' TO '/var/opt/mssql/data/AdventureWorks2022.mdf',
     MOVE 'AdventureWorks2022_log' TO '/var/opt/mssql/data/AdventureWorks2022_log.ldf',
     REPLACE;
"

# Restore AdventureWorksDW2022
echo "==> Restoring AdventureWorksDW2022..."
${SQLCMD} -Q "
RESTORE DATABASE [AdventureWorksDW2022]
FROM DISK = '${CONTAINER_BACKUP_DIR}/AdventureWorksDW2022.bak'
WITH MOVE 'AdventureWorksDW2022' TO '/var/opt/mssql/data/AdventureWorksDW2022.mdf',
     MOVE 'AdventureWorksDW2022_log' TO '/var/opt/mssql/data/AdventureWorksDW2022_log.ldf',
     REPLACE;
"

# Restore WideWorldImporters
echo "==> Restoring WideWorldImporters..."
${SQLCMD} -Q "
RESTORE DATABASE [WideWorldImporters]
FROM DISK = '${CONTAINER_BACKUP_DIR}/WideWorldImporters-Full.bak'
WITH MOVE 'WWI_Primary' TO '/var/opt/mssql/data/WideWorldImporters.mdf',
     MOVE 'WWI_UserData' TO '/var/opt/mssql/data/WideWorldImporters_UserData.ndf',
     MOVE 'WWI_Log' TO '/var/opt/mssql/data/WideWorldImporters_log.ldf',
     MOVE 'WWI_InMemory_Data_1' TO '/var/opt/mssql/data/WideWorldImporters_InMemory.ndf',
     REPLACE;
"

# Clean up backups inside container
docker exec "${CONTAINER_NAME}" rm -rf "${CONTAINER_BACKUP_DIR}"

# List databases
echo ""
echo "==> Databases available:"
${SQLCMD} -Q "SELECT name FROM sys.databases WHERE database_id > 4 ORDER BY name"

echo ""
echo "==> Demo SQL Server ready!"
echo "   Server: .,${SQL_PORT}"
echo "   User:   sa"
echo "   Pass:   ${SA_PASSWORD}"
echo "   Container: ${CONTAINER_NAME}"
echo ""
echo "   To stop:   docker stop ${CONTAINER_NAME}"
echo "   To start:  docker start ${CONTAINER_NAME}"
echo "   To remove: docker rm -f ${CONTAINER_NAME}"
