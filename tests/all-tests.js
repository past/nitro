exports.testSession = require("./nitro/session-tests");
exports.testPaginator = require("./nitro/utils/paginator-tests");

if (require.main === module.id)
    require("os").exit(require("test/runner").run(exports));
