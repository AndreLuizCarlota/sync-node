const kits = require('./kits');
const squares = require('./squares');
const entities = require('./entities');
const accounts = require('./accounts');
const payment_forms = require('./payment_forms');
const dataBase = require('../services/connection');

module.exports = {
      async sync(req, res) {
            const { project_id } = req.params;

            await payment_forms.push(project_id);
            await accounts.push(project_id);

            await entities.push(project_id);
            await entities.read(project_id);

            await squares.push(project_id);

            await kits.push(project_id);
            await kits.push(project_id);
            await kits.read(project_id);

            dataBase.disconnect();

            return res.json({ sucess: true });
      }
}