const mongoose = require('mongoose');

const order = new mongoose.Schema({
        prize: {type: mongoose.Schema.ObjectId, ref: 'Prize'},
        option: {
            point_cost: Number,
            dollar_value: String
        },
        user: {type: mongoose.Schema.ObjectId, ref: 'User'},
        status: {type: String},
        order_date: {type: Date},
    },
    {collection: 'Orders'});

//static functions


//instance methods



const Order = mongoose.model('Order', order);

order.methods.completeCashout = function(){
    this.status = 'complete';
    console.log(this);
    this.save();
};

module.exports = Order;
