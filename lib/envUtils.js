const qerrors = require('qerrors');

function getMissingEnvVars(varArr) {
        console.log(`getMissingEnvVars is running with ${varArr}`);
        try {
                const missingArr = varArr.filter(name => !process.env[name]);
                console.log(`getMissingEnvVars returning ${missingArr}`);
                return missingArr;
        } catch (error) {
                qerrors(error, 'getMissingEnvVars error', {varArr});
                console.log(`getMissingEnvVars returning []`);
                return [];
        }
}

module.exports = { getMissingEnvVars };
