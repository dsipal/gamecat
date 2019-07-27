const mongoose = require('mongoose');

const order = new mongoose.Schema({
        prize: {type: mongoose.Schema.ObjectId, ref: 'Prize'},
        option: {type: Number},
        user: {type: mongoose.Schema.ObjectId, ref: 'User'},
        status: {type: String},
        order_date: {type: Date},
    },
    {collection: 'Orders'});

//static functions


//instance methods



const Order = mongoose.model('Order', order);

order.methods.completeCashout = async function(){
    try{
        this.status = 'complete';
        console.log(this);
        await this.save();
        return false;
    } catch(err){
        return err;
    }

};

module.exports = Order;
