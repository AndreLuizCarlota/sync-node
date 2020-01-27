const axios = require('axios');
const config = require('../config/index');


module.exports = {
    project(project_id) {
        if (!config.init(project_id))
            return null;

        return axios.create({
            baseURL: config.api(project_id).url,
            headers: {
                'Authorization': config.api(project_id).token,
            }
        });
    }
}

