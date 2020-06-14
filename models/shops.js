var mongoose = require("mongoose");

var shopsSchema = new mongoose.Schema({
	name: String,
	image: String,
	imageId: String,
	city: String,
	contact: String,
	opensAt: String,
	closesAt: String,
	days: String,
	address: String,
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