import { UserModel } from './../db_schema/user';
import * as jwt from 'jsonwebtoken';
import { USUserModel } from '../db_schema/user-study/user-study-user';

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
    if (! req.header('Authorization')) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }

    const token = req.header('Authorization').replace('Bearer ', '');
    const data = jwt.verify(token, process.env.JWT_KEY || '0');
    try {
        const user = await USUserModel.findOne({ _id: data._id, token });
        if (!user) {
            next();
            return;
        }
        req.userStudyUser = user;
        req.userStudyToken = token;
        next();
    } catch (error) {
        next();
    }

};
