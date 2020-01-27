const mssql = require('mssql');

const options = {
      user: 'Andre',
      encrypt: true,
      database: 'greiceAne',
      password: '241386Ac9@',
      server: 'DEVELOPER\\SQLEXPRESS',
      pool: {
            min: 0,
            max: 10,
            idleTimeoutMillis: 30000
      }
};

var conn = null;

module.exports = {
      async connect() {
            conn = await mssql.connect(options);
      },
      async disconnect() {
            conn.close();
      },
      async command(query) {
            try {
                  if (!conn || !conn._connected)
                        await this.connect();

                  const data = await conn.request().query(query);
                  if (!data.recordsets || !data.recordsets.length)
                        return null;

                  return data.recordsets[0];
            }
            catch (err) {
                  console.error('Error connection "command"', err.message);
            }
      }
}