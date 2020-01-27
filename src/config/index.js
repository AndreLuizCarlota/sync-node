const projects = {
    isis: require("./projects/isis"),
    lingerie: require("./projects/lingerie"),
    greiceane: require("./projects/greiceane")
};

module.exports = {
    init: current => {
        return !!projects[current];
    },
    project: current => {
        try {
            return projects[current].project;
        } catch (error) {
            console.error("config:project", error);
        }
    },
    api: current => {
        try {
            return projects[current].api;
        } catch (error) {
            console.error("config:api", error);
        }
    }
}