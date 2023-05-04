const Cart = require("../models/cartSchema");
const mongoose = require('mongoose');
const User = require("../models/userSchema");
const ObjectId = mongoose.Types.ObjectId;


exports.cartCount = async (req, res, next) => {
    try {
      let user = req.session.user;
  
      let cartCount = 0;
      if (user) {
        const cart = await Cart.findOne({ userId: user._id }); // Await the query to get the cart object
  
        if (cart) {
           // Replace cart.products.length with cart.products.reduce((acc, product) => acc + product.quantity, 0)
           cartCount = cart.products.reduce((acc, product) => acc + product.quantity, 0);
           console.log(cartCount);
        }
      }
      req.cartCount = cartCount
      // res.locals.cartCount = cartCount; // Set cartCount as a property on req object
  
      next();
    } catch (error) {
      console.log(error);
    }
  };
  
  
  

  

exports.addtoCart = async (req, res) => {
console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj");
  console.log(req.query.size);
    const productId = req.params.id;
 
    const userId =  req.session.user; // we will get user id here 
    console.log(productId)
    console.log(userId)
    
    console.log('worked')
    try {
      const quantity = 1
      let proObj = {
        item : productId,
        quantity : quantity,
        size:req.query.size
      }
      let userCart = await Cart.findOne({userId})
      if(userCart){
        let proExist = userCart.products.findIndex(product=> product.item===productId)
        console.log(proExist)
        if(proExist > -1){
           await Cart.updateOne({userId,'products.item':productId},{$inc:{'products.$.quantity':1}});
      
        }else{
           await Cart.updateOne({userId},{$push:{products:proObj}})
        }
      }else{  
          const cartObj = new Cart({
            userId:userId,
            products:[proObj]
          }) 
          console.log(cartObj)
          await Cart.create(cartObj)
          
    }
      console.log('working')
      res.json(true)
    
  
  }
    
    catch (error) {
      console.error(error);
      res.status(500).send('Internal server error');
    }
    
  }
  
  
  





exports.getCartProducts = async (req,res)=>{
    if(req.session.user){
           // let user = req.session.user
     let userId = req.session.user._id
     console.log(userId,"///////////////////////////////");
    //  userId = userId.toString()
     
     
     // console.log(userId,'user')
     let cartItems = [];
     try {
   
       cartItems = await Cart.aggregate([
         {
           $match:{userId}
         },
         {
           $unwind:'$products'
         },
         {
           $project:{
             item: { $toObjectId: '$products.item' },
             quantity:'$products.quantity',
             size:'$products.size'
           }
         },
         {
           $lookup:{
             from:'products',
             localField:'item',
             foreignField:'_id',
             as:'productInfo'
           }
         },
         {
           $project:{
             item:1,
             quantity:1,
             size:1,
             productInfo:{$arrayElemAt:['$productInfo',0]}
           }
         }
   ]);
   console.log(cartItems,'cartItemssss')
   
   let total = await Cart.aggregate([
     {
       $match:{userId}
     },
     {
       $unwind:'$products'
     },
     {
       $project:{
         item: { $toObjectId: '$products.item' },
         quantity:'$products.quantity'
       }
     },
     {
       $lookup:{
         from:'products',
         localField:'item',
         foreignField:'_id',
         as:'productInfo'
       }
     },
     {
       $project:{
         item:1,
         quantity:1,
         productInfo:{$arrayElemAt:['$productInfo',0]}
       }
     },
     {
       $group:{
         _id:null,
         total:{$sum:{$multiply:['$quantity','$productInfo.price']}}
       }
     }
   ])
   
   let result = await Cart.aggregate([
     {
       $match: { userId } // Replace 'userId' with the actual field that represents the user ID
     },
     {
       $unwind: '$products'
     },
     {
       $project: {
         item: { $toObjectId: '$products.item' },
         quantity: '$products.quantity'
       }
     },
     {
       $lookup: {
         from: 'products',
         localField: 'item',
         foreignField: '_id',
         as: 'productInfo'
       }  
     },
     {
       $project: {
         item: 1,
         quantity: 1,
         productInfo: { $arrayElemAt: ['$productInfo', 0] }
       }
     },
     {
       $project: {
         _id: 0,
         item: 1,
         quantity: 1,
         total: { $multiply: ['$quantity', '$productInfo.price'] }
       }
     }
   ]);
       // console.log(cartItems,'cartItemssst')
       // console.log(total[0].total,'total got')
       console.log(result,'result got')
   
         // Access cartCount value from req object
     const cartCount = req.cartCount;
     loggedin=req.session.userloggedIn
       res.render('user/Cart',{cartItems,cartCount,total,result,loggedin})
     } catch (error) {
       console.log(error,'helooooo')
     }
   }else{
    res.redirect('/login')   
}
   
    }
        
    
 
  
  
  

exports.changeProductQuantity = async (req, res) => {
    const { product, cart, count, quantity } = req.body;
    const parsedCount = parseInt(count);
    const parsedQuantity = parseInt(quantity);
    console.log(parsedQuantity)
    const cartId = cart;
    const productId = product;
    // Convert cartId to ObjectId
    const objectIdCartId = new ObjectId(cartId);
    const objectIdproductId = new ObjectId(productId);
  
    try {
     
  
      console.log("inside the try");
      console.log("parsedCount:", parsedCount);
      console.log("parsedQuantity:", parsedQuantity);
      console.log("objectIdCartId:", objectIdCartId);
      console.log("objectIdproductId:", objectIdproductId);
  
      
      let total = await Cart.aggregate([
        {
          $match:{user:req.body.user}
        },
        {
          $unwind:'$products'
        },
        {
          $project:{
            item: { $toObjectId: '$products.item' },
            quantity:'$products.quantity'
          }
        },
        {
          $lookup:{
            from:'products',
            localField:'item',
            foreignField:'_id',
            as:'productInfo'
          }
        },
        {
          $project:{
            item:1,
            quantity:1,
            productInfo:{$arrayElemAt:['$productInfo',0]}
          }
        },
        {
          $group:{
            _id:null,
            total:{$sum:{$multiply:['$quantity','$productInfo.price']}}
          }
        }
     
      ]);
      
      console.log(total)
  
      let subtotal = await Cart.aggregate([
        {
          $match: { user:req.body.user } // Replace 'userId' with the actual field that represents the user ID
        },
        {
          $unwind: '$products'
        },
        {
          $project: {
            item: { $toObjectId: '$products.item' },
            quantity: '$products.quantity'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'item',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            productInfo: { $arrayElemAt: ['$productInfo', 0] }
          }
        },
        {
          $project: {
            _id: 0,
            item: 1,
            quantity: 1,
            subtotal: { $multiply: ['$quantity', '$productInfo.price'] }
          }
        }
      ]);
      console.log(subtotal)
      
  // Extract only the subtotal amount for each product
  let subtotalAmounts = subtotal.map(item => item.subtotal);
  
  console.log(subtotalAmounts);
  console.log(subtotalAmounts[0])
  
      if (parsedCount === -1 && parsedQuantity === 1) {
        console.log("if condition matched");
        await Cart.updateOne(
          { _id: objectIdCartId },
          {
            $pull: { products: { item: objectIdproductId } }
          }
        );
        
        console.log("removed");
  
        res.json({ success: true, removeProduct: true,total:total}); // Send removeProduct flag as true in the response
  //, subtotalAmounts:subtotalAmounts ,subtotal: subtotal
      } else {
        console.log("else condition");
        console.log(parsedCount)
        await Cart.updateOne(
          { _id: objectIdCartId, 'products.item': objectIdproductId },
          {
            $inc: { 'products.$.quantity': parsedCount }
          }
        );
      }
  
      //  console.log( req.session.total);
       res.json({ success: true, removeProduct: false ,total:total });
  //,subtotalAmounts:subtotalAmounts ,subtotal: subtotal
     
  
    } catch (error) {
      console.error(error);
    }
  };
  
  
  
  exports.removeItem = async (req, res) => {
    console.log("remove cart here");
  
    const { cart, product, confirmResult } = req.body; // Retrieve confirmResult from req.body
    console.log(cart);
    console.log(product);
    const objectIdCartId = cart;
    const objectIdProductId = new ObjectId(product);
    console.log(objectIdCartId);
    console.log(objectIdProductId);
    try {
      console.log("inside try");
      // Update cart in the database only if user confirmed the removal
      if (confirmResult) {
        await Cart.findByIdAndUpdate(objectIdCartId, { $pull: { products: { item: objectIdProductId } } });
        console.log("pulled");
        res.json({ success: true, removeProduct: true });
      } else {
        res.json({ success: false, removeProduct: false });
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  exports.productSizeSelector =async(req,res)=>{
    let proId = req.query.proId;
    console.log(proId,'product id')
    if(req.session.user){
      let cartItem = await Cart.findOne({
        user: req.session.user._id,
        products: { 
          $elemMatch: { 
            size: req.params.id,
            item: proId
          } 
        }
      });
      console.log(cartItem,'valeu')
      if (cartItem) {
        return res.json(true)
      } else {
        return res.json(false)
      }
    }else{
      res.redirect('/login')
    }
   
}