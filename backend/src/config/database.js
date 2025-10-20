module.exports = {
  development: {
    username: "postgres",
    password: "123456789",
    database: "formatosdb",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: "postgres",
    password: "1023456789",
    database: "formatosdb_test",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    username: "root",
    password: "1023456789",
    database: "formatosdb_prod",
    host: "127.0.0.1",
    dialect: "postgres"
  }
};
