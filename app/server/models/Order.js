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

order.methods.completeCashout = async function(giftCode){
        await Order.updateOne(
            {
                _id: this._id
            },
            {
                $set:   {
                    status: 'complete',
                    code: giftCode
                }
            }
        ).catch( function(err) {
            console.log("Error updating order: " + this._id);
            console.log(err);
            return false;
        });

    return true;
};

const Order = mongoose.model('Order', order);
module.exports = Order;
