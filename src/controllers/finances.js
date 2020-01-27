const moment = require('moment');
const dataBase = require('../services/connection');

module.exports = {
    async createUpdate(f) {
        try {
            let exists = await dataBase.command(`SELECT id FROM finances WHERE _id = '${f._id}' ${(f.kits_id > 0 ? ` AND kits_id = ${f.kits_id}` : '')}`);
            if (!!exists.length){
                return exists[0];
            }

            let query = `INSERT INTO finances (_id, app, received_value, type_finances, account_plans_id, entities_user_id, entities_id, accounts_id, 
                                               payment_forms_id, value, due_date, created_at, description, devolve) VALUES ('${f._id}', ${1}, ${f.received_value},
                                               ${1}, ${2}, ${1}, ${f.entities_id}, ${f.accounts_id}, ${f.payment_forms_id}, ${f.value}, ${moment(f.created_at).format('YYYY-MM-DD')}, ${moment(f.created_at).format('YYYY-MM-DD')}, '${f.description}', ${f.devolve ? 1 : 0})`;

            f = await dataBase.command(query);

            return f[0];
        }
        catch (err) {
            console.error('Error finances "create"', err.message)
        }
    }
}