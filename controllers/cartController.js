const Cart = require("../models/cartSchema");
const mongoose = require("mongoose");
const User = require("../models/userSchema");
const ObjectId = mongoose.Types.ObjectId;
const Product = require("../models/productSchema");
const Order = require("../models/orderSchema");
const Wallet = require("../models/walletSchema");
//to find cart cout on add product on cart
exports.cartCount = async (req, res, next) => {
  try {
    let user = req.session.user;

    let cartCount = 0;
    if (user) {
      const cart = await Cart.findOne({ userId: user._id }); // Await the query to get the cart object
      const wallet = await Wallet.findOne({ userId: user._id }); //create a waller for user
      if (cart) {
        // Replace cart.products.length with cart.products.reduce((acc, product) => acc + product.quantity, 0)
        cartCount = cart.products.reduce(
          (acc, product) => acc + product.quantity,
          0
        );
        // console.log(cartCount,"xxxxxxxxxxxxxxxxxxxxxxxxxxx");
        // console.log(typeof(cartCount));
      }
    }
    req.cartCount = cartCount;
    // res.locals.cartCount = cartCount; // Set cartCount as a property on req object
    // console.log(req.cartCount,"zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");
    next();
  } catch (error) {
    console.log(error);
  }
};

//add product with size , this happening on ajax
exports.addtoCart = async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const productId = new ObjectId(req.params.id);
  const userId = req.session.user._id; // we will get user id here
  const offerPrice = req.query.discount;
  console.log(offerPrice, "zzzzzzzzzzzzzzzzzzzzz");
  // console.log(productId,"lllllllllllll");
  // console.log(userId,"xxxxxxxxxxxxxx");
  // console.log(req.query.size,'size')
  let proPrice = await Product.findOne({ _id: req.params.id });
  let taxAmount = Math.floor((proPrice.price / 100) * 12);
  // console.log(taxAmount,'taxxxxxxxxxxx')
  // console.log(proPrice,'proPrice')

  // console.log("worked");
  try {
    const quantity = 1;

    let proObj = {
      item: productId,
      quantity: quantity,
      currentPrice: req.query.discount ? offerPrice : proPrice.price,
      tax: taxAmount,
      size: req.query.size,
      deliverystatus: "not-shipped",
      orderstatus: "processing",
    };

    console.log(
      proObj,
      "wsedrftgyhuijhugfydtrserdftyguhihygtfrdessrdtfyguhiyftdresrdtfyghuij"
    );
    let userCart = await Cart.findOne({ userId: new ObjectId(userId) });
    // console.log(userCart,'🔥🔥🔥🔥🔥');
    let cartCheckProId = req.params.id;

    if (userCart) {
      let proExist = userCart.products.findIndex(
        (product) =>
          product.item == cartCheckProId && product.size === req.query.size
      );
      console.log(proExist);
      if (proExist > -1) {
        await Cart.updateOne(
          { userId, "products.item": productId },
          { $inc: { "products.$.quantity": 1 } }
        );
      } else {
        await Cart.updateOne({ userId }, { $push: { products: proObj } });
      }
    } else {
      const cartObj = new Cart({
        userId: userId,
        products: [proObj],
      });
      console.log(cartObj);
      await Cart.create(cartObj);
    }
    console.log("working");
    res.json(true);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};

//for getting cartproduct in cart page and disply product in diffrent size separatly
exports.getCartProducts = async (req, res) => {
  if (req.session.user) {
    let user = req.session.user;
    console.log(user);
    let userId = req.session.user._id;
    // userId = userId.toString();

    // console.log(userId, "user");
    let cartItems = [];
    try {
      cartItems = await Cart.aggregate([
        {
          $match: { userId },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: { $toObjectId: "$products.item" },
            quantity: "$products.quantity",
            size: "$products.size",
            currentPrice: "$products.currentPrice",
            tax: "$products.tax",
            unique_id: "$products._id",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $project: {
            unique_id: 1,
            item: 1,
            quantity: 1,
            size: 1,
            currentPrice: 1,
            tax: 1,
            productInfo: { $arrayElemAt: ["$productInfo", 0] },
          },
        },
      ]);
      console.log(cartItems, "cartItemssss");

      let total = await Cart.aggregate([
        {
          $match: { userId },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: { $toObjectId: "$products.item" },
            quantity: "$products.quantity",
            size: "$products.size",
            currentPrice: "$products.currentPrice",
            tax: "$products.tax",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            size: 1,
            currentPrice: 1,
            tax: 1,
            productInfo: { $arrayElemAt: ["$productInfo", 0] },
          },
        },
        {
          $group: {
            _id: null,
            totalTax: { $sum: { $multiply: ["$quantity", "$tax"] } },
            total: { $sum: { $multiply: ["$quantity", "$currentPrice"] } },
            totalWithTax: {
              $sum: {
                $multiply: ["$quantity", { $add: ["$tax", "$currentPrice"] }],
              },
            },
            // total: { $sum: { $multiply: ["$quantity", "$productInfo.price"] } },
          },
        },
      ]);

      // console.log(total,"loooooooooooooooooo")
      // console.log(total[0].total,"yyyyyyyyyyyyyyyyyyyyyy");

      //  console.log(cartItems,'cart')
      //  console.log(total,'dispak')
      let subtotal = 0;
      let tax = 0;
      let totalWithTax = 0;
      if (total.length > 0) {
        subtotal = total[0].total;
        tax = total[0].totalTax;
        totalWithTax = total[0].totalWithTax;
      }
      console.log(total, "....");

      const cartCount = req.cartCount;
      if (cartItems.length === 0) {
        res.render("user/emptycart", {
          cartCount,
          userloggedIn: req.session.userloggedIn,
        });
      } else {
        res.render("user/Cart", {
          cartItems,
          user,
          cartCount,
          cartIcon: true,
          total,
          subtotal,
          tax,
          totalWithTax,
          // result,
        });
      }
    } catch (error) {
      console.log(error, "helooooo");
    }
  } else {
    res.redirect("/login");
  }
};

//this happening on ajax , changing quantity on cart page then changes values like tax and tot price
exports.changeProductQuantity = async (req, res) => {
  try {
    let response = {};
    let cart = req.body.cart;
    console.log(cart, "...........");
    let count = req.body.count;
    let quantity = req.body.quantity;
    let unique_id = new ObjectId(req.body.product);
    count = parseInt(count);
    quantity = parseInt(quantity);
    console.log(count, "//////////");
    console.log(quantity, "??????????");
    let userId = req.session.user._id;

    if (count == -1 && quantity == 1) {
      await Cart.updateOne(
        {
          _id: req.body.cart,
          "products._id": unique_id,
        },
        {
          $pull: { products: { _id: unique_id } },
        }
      );

      res.json({ removeProduct: true });
    } else {
      await Cart.updateOne(
        { _id: req.body.cart, "products._id": unique_id },
        { $inc: { "products.$.quantity": count } }
      );

      let total = await Cart.aggregate([
        {
          $match: { userId },
        },
        {
          $unwind: "$products",
        },
        {
          $project: {
            item: { $toObjectId: "$products.item" },
            quantity: "$products.quantity",
            size: "$products.size",
            currentPrice: "$products.currentPrice",
            tax: "$products.tax",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        {
          $project: {
            item: 1,
            quantity: 1,
            size: 1,
            currentPrice: 1,
            tax: 1,
            productInfo: { $arrayElemAt: ["$productInfo", 0] },
          },
        },
        {
          $group: {
            _id: null,
            totalTax: { $sum: { $multiply: ["$quantity", "$tax"] } },
            total: { $sum: { $multiply: ["$quantity", "$currentPrice"] } },
            totalWithTax: {
              $sum: {
                $multiply: ["$quantity", { $add: ["$tax", "$currentPrice"] }],
              },
            },
            // total: { $sum: { $multiply: ["$quantity", "$productInfo.price"] } },
          },
        },
      ]);

      // response.status = true;
      res.json({ success: true, total });
      console.log("else worked");
      console.log(total, "xxx");
    }
  } catch (error) {
    console.error(error);
  }
};
//this call from ajax and remove item fo=rom cart
exports.removeItem = async (req, res) => {
  try {
    console.log(req.body.product, "iddunique");
    let unique_id = new ObjectId(req.body.product);
    console.log(req.body.product, "iddunique");
    console.log(unique_id);
    await Cart.updateOne(
      {
        _id: req.body.cart,
        "products._id": unique_id,
      },
      {
        $pull: { products: { _id: unique_id } },
      }
    );

    let displayTotal = await Cart.aggregate([
      {
        $match: { user: req.session.userId },
      },
      {
        $unwind: "$products",
      },
      {
        $project: {
          item: { $toObjectId: "$products.item" },
          size: "$products.size",
          currentPrice: "$products.currentPrice",
          tax: "$products.tax",
          quantity: "$products.quantity",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "item",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $project: {
          item: 1,
          size: 1,
          currentPrice: 1,
          tax: 1,
          quantity: 1,
          productInfo: { $arrayElemAt: ["$productInfo", 0] },
        },
      },
      {
        $group: {
          _id: null,

          totalTax: { $sum: { $multiply: ["$quantity", "$tax"] } },
          total: { $sum: { $multiply: ["$quantity", "$currentPrice"] } },
          totalWithTax: {
            $sum: {
              $multiply: ["$quantity", { $add: ["$tax", "$currentPrice"] }],
            },
          },
        },
      },
    ]);
    console.log(displayTotal);

    let response = {};
    if (displayTotal.length === 0) {
      response.subtotal = 0;
      response.tax = 0;
      response.totalWithTax = 0;
      await res.json(response);
    } else {
      let subtotal = displayTotal[0].total;
      let tax = displayTotal[0].totalTax;
      let totalWithTax = displayTotal[0].totalWithTax;

      response.subtotal = subtotal;
      response.tax = tax;
      response.totalWithTax = totalWithTax;

      await res.json(response);
    }
  } catch (error) {
    console.log(error);
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////////

//calling from ajax and product size selected from single product page
exports.productSizeSelector = async (req, res) => {
  let proId = req.query.proId;
  console.log(proId, "product id");
  if (req.session.user) {
    let cartItem = await Cart.findOne({
      user: req.session.user._id,
      products: {
        $elemMatch: {
          size: req.params.id,
          item: proId,
        },
      },
    });
    console.log(cartItem, "valeu");
    if (cartItem) {
      return res.json(true);
    } else {
      return res.json(false);
    }
  } else {
    res.redirect("/login");
  }
};
