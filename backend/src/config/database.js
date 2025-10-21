module.exports = {
  development: {
    username: "postgres",
    password: "admin",
    database: "formatosdb",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  test: {
    username: "postgres",
    password: "admin",
    database: "formatosdb_test",
    host: "127.0.0.1",
    dialect: "postgres"
  },
  production: {
    username: "postgres",
    password: "admin",
    database: "formatosdb_prod",
    host: "127.0.0.1",
    dialect: "postgres"
  }
};
