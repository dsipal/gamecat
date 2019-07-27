const mongoose = require('mongoose');

const order = new mongoose.Schema({
        prize: {type: mongoose.Schema.ObjectId, ref: 'Prize'},
        option: {type: Number},
        user: {type: mongoose.Schema.ObjectId, ref: 'User'},
        status: {type: String},
        code:   {type: String},
        order_date: {type: Date},
    },
    {collection: 'Orders'});

//static functions


//instance methods



const Order = mongoose.model('Order', order);

order.methods.completeCashout = async function(id, giftCode){
    try{
        await Order.updateOne(
            {_id: id, code: "pending", status: 'pending'},
            {$set: {status: 'complete', code: giftCode}}
        );
        return true;
    } catch(err){
        console.log(err);
        return false;
    }
};

module.exports = Order;
