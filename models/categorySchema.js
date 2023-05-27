const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const categorySchema = new Schema({
  category: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Offer',
    },
  isListed: {
    type: Boolean,
    default: true,
    required: true,
  },
  images:[
    { type : String }
]
});

module.exports = mongoose.model("category", categorySchema);
