const express = require('express');

const sync = require('./controllers/sync');
const entities = require('./controllers/entities');


const routes = express.Router();

routes.post('/:project_id/sync', sync.sync);
// routes.get('/test', entities.get);

module.exports = routes;