const REQUIRED_VARS = ['GOOGLE_API_KEY', 'GOOGLE_CX']; //define required env vars
const OPTIONAL_VARS = ['OPENAI_TOKEN']; //define optional env vars
const OPENAI_WARN_MSG = `OPENAI_TOKEN environment variable is not set. This is required by the qerrors dependency for error logging.`; //define warning message for missing optional token

module.exports = { REQUIRED_VARS, OPTIONAL_VARS, OPENAI_WARN_MSG }; //export variables
