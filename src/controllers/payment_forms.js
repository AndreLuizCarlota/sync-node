const dataBase = require('../services/connection');
const api = require('../services/api');

module.exports = {
      async push(project_id) {
            try {
                  let payment_forms = await dataBase.command('SELECT id, name FROM payment_forms WHERE _id IS NULL AND deleted_at IS NULL');
                  let data = [];
                  for (let p of payment_forms)
                        data.push({
                              id: p.id,
                              name: p.name
                        });

                  if (data.length) {
                        let response = await api.project(project_id).put(`/default/payment_forms`, { data });
                        for (let resp of response.data)
                              await dataBase.command(`UPDATE payment_forms SET _id = '${resp._id}' WHERE id = ${resp.id}`);
                  }
            }
            catch (err) {
                  console.error('Error payment_forms "push"', err.message);
            }
      }
}