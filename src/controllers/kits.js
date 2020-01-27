const dataBase = require('../services/connection');
const controlerFinances = require('./finances');
const api = require('../services/api');

const oneDay = 86400000;

module.exports = {
      async push(project_id) {
            try {
                  const enterprises = await dataBase.command(`SELECT * FROM enterprises`);

                  let query = `SELECT kits.id, kits.status, kits.shawl, kits.amount_sold, kits.loads_id, kits.amount_loaded, kits.quantity_sold, kits.amount_returned, kits.quantity_loaded, kits.quantity_returned, kits.quantity_transfer, kits.amount_transfer, kits.package, kits.entities_id,
                               entities.name AS entitiesName, entities.street, entities.number, entities.neighborhood, entities.complement, cities.name AS citiesName, cities.uf, entities.cpf, entities.cellphone AS entitiesCellphone,
                               loads.week, loads.billing_week, loads.created_at, loads.period_of, loads.period_until, loads.squares_id, loads.entities_id AS entities_representative_id,
                               squares.name AS squaresName, squares._id AS squares_OnlineId, 
                               COALESCE(kits.delivered, 0) AS delivered FROM kits

                               JOIN loads ON loads.id = kits.loads_id
                               JOIN squares ON loads.squares_id = squares.id
                               LEFT OUTER JOIN entities ON kits.entities_id = entities.id
                               LEFT OUTER JOIN cities ON entities.cities_id = cities.id
                               JOIN entities representative ON loads.entities_id = representative.id
                               WHERE kits._id IS NULL and kits.deleted_at IS NULL AND kits.loads_id IS NOT NULL AND loads.location = 1 and kits.quantity_loaded > 0 AND kits.devolve_redial = 0 AND kits.to_push = 0`;

                  let kits = await dataBase.command(query);
                  let data = [];

                  for (let k of kits) {
                        let up = await dataBase.command(`SELECT _id FROM kits WHERE id = ${k.id}`);
                        if (!!up && !!up[0]._id)
                              continue;

                        data.push({
                              id: k.id,
                              devolve: 0,
                              shawl: k.shawl,
                              status: k.status,
                              package: k.package,
                              delivered: k.delivered,
                              entities_representative_id: k.entities_representative_id,
                              entity: {
                                    cpf: k.cpf,
                                    id: k.entities_id,
                                    name: k.entitiesName,
                                    cellphone: k.entitiesCellphone,
                                    address: !k.entities_id ? `${k.street}, ${k.number}, ${k.neighborhood} - ${k.citiesName} - ${k.uf}` : null
                              },
                              loads: {
                                    week: k.week,
                                    id: k.loads_id,
                                    billing_week: k.billing_week,
                                    period_of_test: k.period_of,
                                    period_of: Date.parse(k.period_of) + oneDay,
                                    created_at: Date.parse(k.created_at) + oneDay,
                                    period_until: Date.parse(k.period_until) + oneDay
                              },
                              squares: {
                                    id: k.squares_id,
                                    name: k.squaresName,
                                    _id: k.squares_OnlineId,
                              },
                              hit: false,
                              received: 0,
                              group: false,
                              update: false,
                              description: "",
                              sold_informed: 0,
                              commission_salesman: 0,
                              percent_representative: 0,
                              commission_representative: 0,
                              quantity_loaded: k.quantity_loaded,
                              amount_transfer: k.amount_transfer,
                              amount_loaded: k.amount_loaded,
                              amount_returned: k.amount_returned,
                              quantity_transfer: k.quantity_transfer,
                              quantity_returned: k.quantity_returned,
                              amount_sold: k.amount_loaded - k.amount_returned - k.amount_transfer,
                              quantity_sold: k.quantity_loaded - k.quantity_returned - k.quantity_transfer,
                              percent_salesman: enterprises[0].type_commission ? enterprises[0].preset_commission : 0
                        });
                  };

                  if (data.length > 0) {
                        await dataBase.command(`UPDATE kits SET to_push = 1 WHERE id IN (${data.map(c => c.id).join(',')})`);
                        let response = await api.project(project_id).put(`/default/kits`, { data });

                        for (let res of response.data)
                              await dataBase.command(`UPDATE kits SET _id = '${res._id}' WHERE id = ${res.id}`);

                        await dataBase.command(`UPDATE kits SET to_push = 0 WHERE id IN (${data.map(c => c.id).join(',')})`);
                  }

                  query = `SELECT TOP 100000 kit_products.id, kit_products.products_id, kit_products.quantity_loaded, kit_products.sale_value,
                           kit_products.amount_loaded, kit_products.quantity_returned, kit_products.amount_returned, products.name,
                           kit_products.amount_transfer, kit_products.quantity_transfer, kit_products.loads_id, products.barcodes,
                           kit_products.kits_id FROM kit_products

                           JOIN products ON kit_products.products_id = products.id 
                           JOIN kits ON kit_products.kits_id = kits.id
                           WHERE kit_products._id IS NULL AND kit_products.to_push = 0 AND kits._id IS NOT NULL ${(data.length > 0 ? `AND kits_id IN (${data.map(c => c.id).join(',')})` : '')}`;

                  let kit_products = await dataBase.command(query);
                  data = [];

                  for (let p of kit_products) {
                        data.push({
                              id: p.id,
                              name: p.name,
                              update: false,
                              kits_id: p.kits_id,
                              loads_id: p.loads_id,
                              barcodes: p.barcodes,
                              sale_value: p.sale_value,
                              products_id: p.products_id,
                              amount_loaded: p.amount_loaded,
                              amount_returned: p.amount_returned,
                              quantity_loaded: p.quantity_loaded,
                              amount_transfer: p.amount_transfer,
                              quantity_transfer: p.quantity_transfer,
                              quantity_returned: p.quantity_returned,
                              amount_sold: p.amount_loaded - p.amount_returned - p.amount_transfer,
                              quantity_sold: p.quantity_loaded - p.amount_returned - p.amount_transfer
                        })
                  }

                  if (data.length > 0) {
                        await dataBase.command(`UPDATE kit_products SET to_push = 1 WHERE id IN (${data.map(c => c.id).join(',')})`);
                        let response = await api.project(project_id).put(`/default/kit_products`, { data });

                        for (let res of response.data)
                              await dataBase.command(`UPDATE kit_products SET _id = '${res._id}' WHERE id = ${res.id}`);

                        await dataBase.command(`UPDATE kit_products SET to_push = 0 WHERE id IN (${data.map(c => c.id).join(',')})`);
                  }

            } catch (err) {
                  console.error('Error kits "push"', err); return { error: err.message };
            }
      },
      async read(project_id) {
            try {
                  let syncs = await api.project(project_id).get(`/sync/lasts`);
                  let kits = await api.project(project_id).get(`/sync?collection=kits&filter=${JSON.stringify({ update: true, entities_representative_id: { $nin: syncs.data.docs.filter(c => c.success).map(c => c.id) } })}`);
                  for (let k of kits.data) {
                        if (k.entity && !k.entity.id) {
                              let entity = await dataBase.command(`SELECT id FROM entities WHERE (cpf = '${k.entity.cpf}' OR _id = '${k.entity._id}')`);
                              k.entity = { id: !!entity ? entity[0].id : null, ...k.entity }
                        }

                        updateKit(k);
                  }

                  let data = [];

                  if (kits.data.length > 0) {
                        let finances = await api.project(project_id).get(`/sync?collection=kit_finances&filter=${JSON.stringify({ id: 0, kits_id: { $in: kits.data.map(c => c.id) } })}`);
                        for (let f in finances.data) {
                              let entities_id = kits.data.find(c => c.id == f.kits_id);

                              if (entities_id)
                                    f.entities_id = entities_id.entity.id;

                              let create = await controlerFinances.createUpdateate(f);

                              data.push({ _id: f._id, id: create.id, update: false });
                        }

                        if (data.length > 0)
                              await api.project(project_id).post(`/sync?mode=merge${JSON.stringify({ collection: 'kit_finances', data })}`);
                  }

                  data = [];

                  if (kits.data.length > 0) {
                        let products = await api.project(project_id).get(`/sync?collection=kit_products&filter=${JSON.stringify({ update: true, kits_id: { $in: kits.data.map(c => c.id) } })}`);
                        for (let p in products.data)
                              if (await updateKitProducts(p))
                                    data.push({ _id: p._id, update: false });

                        if (data.length > 0)
                              await api.project(project_id).post(`/sync?mode=merge${JSON.stringify({ collection: 'kit_products', data })}`);
                  }

                  if (!data.length)
                        return;

                  data = [];

                  for (let k in kits.data)
                        data.push({ _id: k._id, update: false });

                  if (data.Count > 0)
                        await api.project(project_id).post(`/sync?mode=merge${JSON.stringify({ collection: 'kits', data })}`);
            }
            catch (err) { console.error('Error kits "read"'); }
      }
}

updateKit = async (k) => {
      try {
            let query = `UPDATE kits SET hit = ${k.hit ? 1 : 0}, 
                                         received = ${k.received},
                                         delivered = ${k.delivered},
                                         devolve_redial = ${k.devolve},
                                         amount_sold = ${k.amount_sold},
                                         description = '${k.description}',
                                         quantity_sold = ${k.quantity_sold},
                                         amount_loaded = ${k.amount_loaded},
                                         sold_informed = ${k.sold_informed},
                                         quantity_loaded = ${k.quantity_loaded},
                                         amount_returned = ${k.amount_returned},
                                         percent_salesman = ${k.percent_salesman},
                                         quantity_returned = ${k.quantity_returned},
                                         commission_salesman = ${k.amount_returned},
                                         entities_id = ${!!k.entity.id ? k.entity.id : null},
                                         percent_representative = ${k.percent_representative},
                                         commission_representative = ${k.commission_representative}`;

            await dataBase.command(query + ` WHERE id = ${k.id}`);

            return true;
      }
      catch (err) {
            console.error('Error "updateKit" kits', err.message); return false;
      }
}

updateKitProducts = (p) => {
      try {
            let query = `UPDATE kit_products SET amount_transfer = ${p.amount_transfer},
                                                 amount_returned = ${p.amount_returned},
                                                 quantity_transfer = ${p.quantity_transfer}, 
                                                 quantity_returned = ${p.quantity_returned}`;

            dataBase.command(query + ` WHERE id = ${p.id}`);

            return true;
      }
      catch (err) {
            console.error('Error "updateKitProducts" kits', err.message); return false;
      }
}