const dataBase = require('../services/connection');
const api = require('../services/api');

module.exports = {
      async push(project_id) {
            try {
                  let accounts = await dataBase.command('SELECT id, name FROM accounts WHERE _id IS NULL AND deleted_at IS NULL');
                  let data = [];
                  for (let a of accounts)
                        data.push({
                              id: a.id,
                              name: a.name
                        });

                  if (data.length) {
                        let response = await api.project(project_id).put(`/default/accounts`, { data });
                        for (let resp of response.data)
                              await dataBase.command(`UPDATE accounts SET _id = '${resp._id}' WHERE id = ${resp.id}`);
                  }
            }
            catch (err) {
                  console.error('Error accounts "push"', err.message);
            }
      }
}