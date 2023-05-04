const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const cartSchema = new Schema(
    {
        userId:{
            type:String,
            required :true
        },
        products:[
                {
                item:{
                   type:String,
                   required:true
                },
                quantity: {
                    type:Number,
                    required:true
                },
                // size:{
                //     type:String,
                //     required:true
                // },
              }
            
        ]
    
    },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Cart", cartSchema);