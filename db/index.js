const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'password',
  host: '127.0.0.1',
  database: 'lightbnb',
});

module.exports = {
  query: (text, params, callback) => {
    const start = Date.now();

    return pool.query(text, params, (err, res) => {
      const duration = Date.now() - start;
      console.log('executed query', { text, params, duration});
      return callback(err, res);
    });
  },
  getClient: (callback) => {
    pool.connect((err, client, done) => {
      const query = client.query;

      // monkey patch the query method to keep track of the last query executed
      client.query = (...args) => {
        client.lastQuery = args;
        return query.apply(client, args);
      };

      // set a timeout of 5 seconds, after which we will log this client's last query
      const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!');
        console.error(
          `The last executed query on this client was: ${client.lastQuery}`
        );
      }, 5000);

      const release = (err) => {
        // call the actual 'done' method, returning this client to the pool
        done(err);

        // clear our timeout
        clearTimeout(timeout);

        // set the query method back to its old un-monkey-patched version
        client.query = query;
      };

      callback(err, client, release);
    });
  },
};
