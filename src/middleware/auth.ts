import { UserModel } from './../db_schema/user';
import * as jwt from 'jsonwebtoken';

export const auth = async(req, res, next) => {
    console.log('Authenticate ...');
    if (! req.header('Authorization')) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }

    const token = req.header('Authorization').replace('Bearer ', '');
    const data = jwt.verify(token, process.env.JWT_KEY || '0');
    try {
        const user = await UserModel.findOne({ _id: data._id, 'tokens.token': token });
        if (!user) {
            throw new Error();
        }
        req.user = user;
        req.token = token;
        console.log('SUCC');
        next();
    } catch (error) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
    }

};


export const authForward = async(req, res, next) => {
    if (! req.header('Authorization')) {
        next();
        return;
    }

    const token = req.header('Authorization').replace('Bearer ', '');
    const data = jwt.verify(token, process.env.JWT_KEY || '0');
    try {
        const user = await UserModel.findOne({ _id: data._id, 'tokens.token': token });
        if (!user) {
            next();
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
        next();
    }

};