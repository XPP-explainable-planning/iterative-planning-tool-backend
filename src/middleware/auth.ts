import { UserModel } from './../db_schema/user';
import * as jwt from 'jsonwebtoken';
import { USUserModel } from '../db_schema/user-study-user';

export const auth = async(req, res, next) => {
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
            return;
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        next();
    }

};

export const authUserStudy = async(req, res, next) => {
    console.log('User Study AUTH');
    if (! req.header('Authorization')) {
        console.log('No authorization falg...');
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }

    const token = req.header('Authorization').replace('Bearer ', '');
    console.log(token);
    const data = jwt.verify(token, process.env.JWT_KEY || '0');
    console.log(data);
    try {
        const user = await USUserModel.findOne({ _id: data._id, token });
        console.log(user);
        if (!user) {
            console.log('No matching user found.');
            next();
            return;
        }
        req.userStudyUser = user;
        req.userStudyToken = token;
        console.log(req.userStudyUser);
        console.log('user study user authenticated ...');
        next();
    } catch (error) {
        next();
    }

};