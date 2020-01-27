const dataBase = require('../services/connection');
const api = require('../services/api');

module.exports = {
      async push(project_id) {
            try {
                  let squares = await dataBase.command('SELECT id, name, entities_id FROM squares WHERE _id IS NULL AND deleted_at IS NULL');
                  let data = [];
                  for (let a of squares)
                        data.push({
                              id: a.id,
                              name: a.name,
                              entities_id: a.entities_id,
                        });

                  if (data.length) {
                        let response = await api.project(project_id).put(`/default/squares`, { data });
                        for (let resp of response.data)
                              await dataBase.command(`UPDATE squares SET _id = '${resp._id}' WHERE id = ${resp.id}`);
                  }
            }
            catch (err) {
                  console.error('Error squares "push"', err.message);
            }
      }
}