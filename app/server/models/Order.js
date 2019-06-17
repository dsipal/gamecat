const mongoose = require('mongoose');

const order = new mongoose.Schema({
        prize: {type: mongoose.Schema.ObjectId, ref: 'Prizes'},
        user: {type: mongoose.Schema.ObjectId, ref: 'Users'},
        status: {type: String},
        order_date: {type: Date},
    },
    {collection: 'Orders'});

//static functions


//instance methods



const Order = mongoose.model('Order', order);
module.exports = Order;
