const mongoose = require("mongoose");

const ServerLogsSchema = new mongoose.Schema({
	timestamp: { type: Date, required: true, },
    level: { type: String, required: true  },
    message: { type: String, required: true  },
});


// Export model
module.exports = mongoose.model("ServerLogs", ServerLogsSchema);