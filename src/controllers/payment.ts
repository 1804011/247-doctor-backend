import uniqid from 'uniqid';
import { Request, Response } from 'express';
import { UserType } from '@models/user';
import User from '@models/user'
const SSLCommerzPayment = require('sslcommerz-lts');

const store_id = 'cuet64a6b41e334f7';
const store_passwd = 'cuet64a6b41e334f7@ssl';
const is_live = false; //true for live, false for sandbox

export const initiatePayment = async (req: Request, res: Response) => {
    try {
        console.clear();
        //@ts-ignore
        let _user: UserType = await User.findById(req.userID);
        if (_user.userType !== 'patient') {
            return res.status(200).json({ message: 'You are not a patient' });
        }
        const tnxId = uniqid.time();
        const data = {
            total_amount: 150,
            currency: 'BDT',
            tran_id: tnxId, // use unique tran_id for each API call
            success_url: 'http://192.168.0.102:3000/api/pay-slot/success',
            fail_url: 'http://192.168.0.102:3000/api/pay-slot/failure',
            cancel_url: 'http://192.168.0.102:3000/api/pay-slot/cancel',
            ipn_url: 'http://192.168.0.102:3000/api/pay-slot/ipn',
            shipping_method: 'Courier',
            product_name: 'Computer.',
            product_category: 'Electronic',
            product_profile: 'general',
            cus_name: 'Customer Name',
            cus_email: 'customer@example.com',
            cus_add1: 'Dhaka',
            cus_add2: 'Dhaka',
            cus_city: 'Dhaka',
            cus_state: 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: '01711111111',
            cus_fax: '01711111111',
            ship_name: 'Customer Name',
            ship_add1: 'Dhaka',
            ship_add2: 'Dhaka',
            ship_city: 'Dhaka',
            ship_state: 'Dhaka',
            ship_postcode: 1000,
            ship_country: 'Bangladesh',
        };

        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        const apiResponse = await sslcz.init(data);
        const gatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: gatewayPageURL });
        console.log('Redirecting to: ', gatewayPageURL);
    } catch (error) {
        console.error('Payment initiation failed:', error);
        res.status(500).send('Failed to initiate payment');
    }
};
