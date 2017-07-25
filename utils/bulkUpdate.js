const db = require('../models/database').db;

const update = (queryString, parameters) => {
    return db.tx(t => {
        const queries = parameters.map(p => {
          return t.none(queryString, p);
        });
        return t.batch(queries);
    })
    .then(data => {
      return data;
    })
    .catch(error => {
      console.log('error', error)
    });
}

module.exports = {
  update
};
