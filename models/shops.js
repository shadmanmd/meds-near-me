var mongoose = require("mongoose");

var shopsSchema = new mongoose.Schema({
	name: String,
	image: String,
	address: String,
	contact: Number,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String,
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment"
		}
	],
	createdAt: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model("Shops", shopsSchema);