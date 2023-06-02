const Address = require("../models/addressSchema");
const Product = require("../models/productSchema");
const Cart = require("../models/cartSchema");
const mongoose = require("mongoose");
const Order = require("../models/orderSchema");
const Razorpay = require("razorpay");
const Wallet = require("../models/walletSchema");

//creation of instance for razorpay
var instance = new Razorpay({
  key_id: process.env.key_id,
  key_secret: process.env.key_secret,
});

//create or add address
exports.deliveryAddressPost = async (req, res) => {
  let orders = req.body;
  console.log(orders, "xxxxxxxxxxxx");
  let cod = req.body["payment-method"];
  console.log(cod);
  // const couponAmount = req.body.couponAmount;
  // console.log( couponAmount,"gggggggggggggggggggggggggggggggg");
  let myCoupon = req.body.couponAmount;
  console.log(myCoupon, "xxxxxxxxxxxxxzzzzzzzzzzz");
  myCoupon = myCoupon.replace("₹", "");
  let addressId = new mongoose.Types.ObjectId(req.body.address);

  console.log(addressId);

  try {
    const addressDetails = await Address.findOne(
      { "address._id": addressId },
      { "address.$": 1 }
    );
    console.log(addressDetails);

    let filteredAddress = addressDetails.address[0];
    console.log(filteredAddress);
    console.log(filteredAddress.firstname);

    let cart = await Cart.findOne({ userId: req.session.user._id });
    console.log(cart, "/////////////////////////////");
    console.log("vannu");
    var userId = req.session.user._id;

    let total = await Cart.aggregate([
      {
        $match: { userId: userId },
      },
      {
        $unwind: "$products",
      },
      {
        $project: {
          item: { $toObjectId: "$products.item" },
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
          quantity: 1,
          productInfo: { $arrayElemAt: ["$productInfo", 0] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$quantity", "$productInfo.price"] } },
        },
      },
    ]).allowDiskUse(true);

    //console.log(cart,'nnnnnnnnnnnnnnnnnn')
    // Store the total value in a session variable
    // req.session.total = total[0].total;

    console.log(total[0], "cart got");
    let status = req.body["payment-method"] === "COD" ? "placed" : "pending";

    let orderObj = new Order({
      deliveryDetails: {
        firstname: filteredAddress.firstname,
        lastname: filteredAddress.lastname,
        state: filteredAddress.state,
        streetaddress: filteredAddress.streetaddress,
        appartment: filteredAddress.appartment,
        town: filteredAddress.town,
        zip: filteredAddress.zip,
        mobile: filteredAddress.mobile,
        email: filteredAddress.email,
        radio: filteredAddress.radio,
      },
      userId: cart.userId,
      paymentMethod: req.body["payment-method"],
      products: cart.products,
      totalAmount: total[0].total,
      paymentstatus: status,
      deliverystatus: "not shipped",
      createdAt: new Date(),
    });
    console.log(orderObj);
    let orderDoc = await Order.create(orderObj);

    let orderId = orderDoc._id;
    let orderIdString = orderId.toString();
    console.log(orderIdString, "order string");

    let totTax = 0;
    for (const product of orderDoc.products) {
      totTax += product.tax * product.quantity;
    }
    console.log("Total Tax:", totTax);

    let totprice = 0;
    for (const product of orderDoc.products) {
      totprice += product.currentPrice * product.quantity;
    }
    console.log("Total amount:", totprice);

    // Find and delete the cart items for the user
    await Cart.findOneAndDelete({ userId: cart.userId });

    let walletItems = await Wallet.findOne({ userId: req.session.user._id });
    let balance;

    if (walletItems) {
      balance = walletItems.balance;
    } else {
      const newWallet = new Wallet({
        userId: req.session.user._id,
        balance: 0, // Set the initial balance to 0 or any other desired value
      });
      const savedWallet = await newWallet.save();
      balance = savedWallet.balance;
    }

    // Use the balance in further processing
    console.log(balance);

    if (req.body["payment-method"] == "COD") {
      res.json({ codSuccess: true });
    } else if (req.body["payment-method"] == "RazorPay") {
      if (myCoupon) {
        var options = {
          amount: (totprice + totTax - myCoupon) * 100, // amount in the smallest currency unit
          currency: "INR",
          receipt: orderIdString,
        };
      } else {
        var options = {
          amount: (totprice + totTax) * 100, // amount in the smallest currency unit
          currency: "INR",
          receipt: orderIdString,
        };
      }

      instance.orders.create(options, function (err, order) {
        console.log(order, "new order");
        res.json(order);
      });
    } else if (req.body["payment-method"] == "Wallet") {
      console.log(orderDoc._id, "iddd of order");
      console.log(balance, "ooooooooooooooooo");

      // const total= total[0].total
      console.log(total[0].total, "iiiiiiiiiiiiiiii");
      if (total[0].total <= balance) {
        console.log("first case");
        // Check if wallet balance is sufficient for the purchase
        // Deduct the purchase amount from the wallet balance
        balance -= total[0].total;
        walletItems.balance = balance;
        await walletItems.save();
        console.log("dat base done");

        // Create the order with the updated price
        // const order = new Order({
        //   userId,
        //   total: total[0].total,
        // });
        // await order.save();

        console.log("Order placed using wallet payment");
        res.json({ codSuccess: true });
      } else if (total[0].total > balance) {
        console.log("Insufficient funds in wallet");
        res.json({ emptyWallet: true });
        // return res.render("user/wallet", {
        //   user: req.session.user,
        //   cartCount: req.cartCount,
        //   balance,
        //   insufficientFunds: true,
        // });
      }
      // instance.orders.create(options, function (err, order) {
      //   console.log(order, "new order");
      //   res.json(order);
      // });
    } else if (req.body["payment-method"] == "PayPal") {
      let amount = Math.floor(orderDoc.totalAmount / 75);
      console.log(amount, "///////");
      amount = new String(amount);
      console.log(amount, "amount 1");
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: `http://localhost:3001/paymentsuccess/?objId=${orderId}`,
          cancel_url: `http://localhost:3001/paypal-cancel/?objId=${orderId}`,
        },
        transactions: [
          {
            item_list: {
              items: [
                {
                  name: "item",
                  sku: "item",
                  price: amount,
                  currency: "USD",
                  quantity: 1,
                },
              ],
            },
            amount: {
              currency: "USD",
              total: amount,
            },
            description: "This is the payment description.",
          },
        ],
      };

      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          console.log(error);
        } else {
          console.log("Create Payment Response");
          console.log(payment);
          console.log(payment.links[1].href, "link");
          console.log(payment.links, "payment link");
          console.log(payment.links[1], "payment link[1]");
          // Check that payment.links[1] exists
          if (payment.links && payment.links[1]) {
            // Redirect the user to the PayPal checkout page
            res.json({ payment });
          } else {
            console.log("Payment response missing redirect URL");
            res.status(500).send("Unable to process payment");
          }
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
};

//find address from database
exports.deliveryAddress = async (req, res) => {
  let user = req.session.user;
  // console.log(user, "id found");
  let userId = req.session.user._id;
  userId = userId.toString();

  const addressData = await Address.find({ user: user._id });
  // console.log(addressData);
  if (addressData.length === 0) {
    return res.redirect("/savedAddress");
  }
  const address = addressData[0].address;

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
    // console.log(cartItems, "cartItemssss");

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

    let subtotal = 0;
    let tax = 0;
    let totalWithTax = 0;
    if (total.length > 0) {
      subtotal = total[0].total;
      tax = total[0].totalTax;
      totalWithTax = total[0].totalWithTax;
    }
    
    // Store the total value in a session variable
    // req.session.total = total[0].total;

    console.log(total, "cart got");
    res.render("user/address", {
      user,
      total,
      address,
      cartItems,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.savedAddressPost = async (req, res) => {
  let user = req.session.user._id;
  // console.log(user, "user found");
  //console.log(req.body);
  let addaddress = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    state: req.body.state,
    streetaddress: req.body.address,
    appartment: req.body.appartment,
    town: req.body.town,
    zip: req.body.postcode,
    mobile: req.body.mobile,
    email: req.body.email,
    radio: req.body.optradio,
  };
  try {
    const data = await Address.findOne({ user: user });
    if (data) {
      data.address.push(addaddress);
      const updated_data = await Address.findOneAndUpdate(
        { user: user },
        { $set: { address: data.address } },
        { returnDocument: "after" }
      );
      console.log(updated_data, "updated address collection");
    } else {
      const address = new Address({
        user: req.session.user._id,
        address: [addaddress],
      });
      const address_data = await address.save();
      console.log(address_data, "address collection");
    }

    res.json(true);
  } catch (error) {
    console.log(error);
  }
};

//edit adress
exports.editSavedAddress = async (req, res) => {
  try {
    let user = req.session.user;
    // Access cartCount value from req object
    const cartCount = req.cartCount;
    console.log(req.params.id); // Check if id is coming in params
    const address = await Address.findOne({ "address._id": req.params.id });
    // Check if address is coming or not
    // if (!address) {
    //   return res.status(404).send("Address not found");
    // }
    const selectedAddress = address.address.find(
      (addr) => addr._id.toString() === req.params.id
    );
    console.log(selectedAddress, "selectedAddress");
    res.render("user/editSavedAddress", {
      video: true,
      user,
      cartCount,
      address: selectedAddress,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.savedAddressget = async (req, res) => {
  let user = req.session.user;
  let userId = req.session.user._id;
  userId = userId.toString();
  console.log(user, "user here");

  const cartCount = req.cartCount;
  const addressData = await Address.find({ user: user._id });

  if (addressData && addressData.length > 0) {
    const address = addressData[0].address;
    console.log(address, "address got");

    try {
      res.render("user/savedAddress", {
        addressData,
        user,
        cartCount,
        address,
      });
    } catch (error) {
      console.log(error);
    }
    // json(true);
  } else {
    console.log("No address data found");
    res.render("user/savedAddress", {
      addressData,
      user,
      cartCount,
      address: [],
    });
  }
  // Clear any existing session data for address
  req.session.address = null;
};

exports.editSavedAddressPost = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;

    console.log(userId);
    console.log(addressId);

    const user = await Address.findOne({ user: userId });

    const address = user.address.find((a) => a._id.toString() === addressId);
    console.log(address, "address got");

    const updatedAddress = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      state: req.body.state,
      streetaddress: req.body.address,
      appartment: req.body.appartment,
      town: req.body.town,
      zip: req.body.postcode,
      mobile: req.body.mobile,
      email: req.body.email,
      radio: req.body.optradio,
    };

    const result = await Address.updateOne(
      { user: userId, "address._id": new ObjectId(addressId) },
      { $set: { "address.$": updatedAddress } }
    );

    console.log(result);
    res.redirect("/savedAddress");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;

    const result = await Address.updateOne(
      { user: userId },
      { $pull: { address: { _id: new ObjectId(addressId) } } }
    );

    console.log(result);
    res.sendStatus(204);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};
