const dataBase = require('../services/connection');
const api = require('../services/api');

const oneDay = 86400000;

module.exports = {
      async push(project_id) {
            try {
                  let query = `SELECT entities.id, entities.name, entities.cpf, entities.email, entities.rg, entities.birth, entities.cellphone, entities.phone, entities.phone_contacts, entities.street, entities.no_transfer,
                               entities.number, entities.zip_code, entities.commission, entities.neighborhood, entities.complement, entity_groups_id, 
                               squares_id, squares.name AS squaresName, squares._id AS squares_OnlineId,
                               cities.uf, cities.name as citiesName FROM entities

                               LEFT OUTER JOIN entity_group_entities ON entities.id = entity_group_entities.entities_id
                               LEFT OUTER JOIN squares ON entities.squares_id = squares.id
                               LEFT OUTER JOIN cities ON entities.cities_id = cities.id
                               WHERE entities._id IS NULL AND entities.id > 2 AND entity_group_entities.entity_groups_id in (2,5) AND entities._id IS NULL`;

                  let entities = await dataBase.command(query);
                  let data = [];

                  for (let e of entities) {
                        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(e.email) && e.entity_groups_id === 5)
                              continue;

                        data.push({
                              id: e.id,
                              rg: e.rg,
                              uf: e.uf,
                              cpf: e.cpf,
                              name: e.name,
                              update: false,
                              email: e.email,
                              phone: e.phone,
                              street: e.street,
                              number: e.number,
                              city: e.citiesName,
                              zip_code: e.zip_code,
                              cellphone: e.cellphone,
                              complement: e.complement,
                              squares_id: e.squares_id,
                              neighborhood: e.neighborhood,
                              phone_contacts: e.phone_contacts,
                              entity_groups_id: e.entity_groups_id,
                              user: e.entity_groups_id === 5 ? true : false,
                              birth: !!e.birth ? Date.parse(e.birth) + oneDay : 0,
                              commission: e.entity_groups_id === 5 ? e.commission : null,
                              password: e.entity_groups_id === 5 ? e.cpf.replace(/[.-]/g, '') : null,
                        })
                  }

                  if (data.length) {
                        let response = await api.project(project_id).put(`/default/entities`, { data });
                        for (let res of response.data)
                              await dataBase.command(`UPDATE entities SET _id = '${res._id}' WHERE id = ${res.id}`);
                  }

            }
            catch (err) { console.error('Error entites "push"', err.message); }
      },
      async read(project_id) {
            try {
                  let entities = await api.project(project_id).get(`/sync?collection=entities&filter=${JSON.stringify({ update: true })}`);
                  let data = [];
                  for (let e of entities.data) {
                        let entity = await createUpdate(e);
                        if (entity)
                              data.push({ _id: entity._id, id: entity.id, update: false });
                  }

                  if (data.length)
                        await api.project(project_id).post(`/sync?mode=merge`, { collection: 'entities', data });
            }
            catch (err) { console.error('Error entites "read"', err.message); }
      },

}

createUpdate = async (e) => {
      try {
            let entity = await dataBase.command(`SELECT id, _id FROM entities WHERE (_id = '${e._id}' OR cpf = '${e.cpf}')`);
            if (!!entity.length) {

                  return entity[0];
            }

            let query = `INSERT INTO entities (rg, _id, cpf, name, phone, street, created_at, deleted_at, zip_code, email, cellphone,
                                               complement, neighborhood, phone_contacts ${e.entity_groups_id != 5 ? ', squares_id' : ''}) VALUES ('${e.rg}', ${e._id}, ${e.cpf},
                                               '${e.name}', '${e.phone}', '${e.street}', '${moment(e.created_at).format('YYYY-MM-DD')}', null, '${e.zip_code}', '${e.email}', '${e.cellphone}',
                                               '${e.complement}', '${e.neighborhood}', '${e.phone_contacts}' ${e.entity_groups_id != 5 ? `, ${e.squares_id}` : ''})`;

            e = await dataBase.command(query);

            await dataBase.command(`INSERT INTO entity_group_entities (entities_id, entity_groups_id) VALUES ('${e[0].id}', ${e[0].entity_groups_id})`);

            return e[0];
      }
      catch (err) {
            console.error('Error finances "create"', err.message)
      }
}