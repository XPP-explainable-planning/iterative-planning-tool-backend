import { UserModel, User } from './../db_schema/user';
import * as jwt from 'jsonwebtoken';
import { USUserModel, USUser } from '../db_schema/user-study/user-study-user';
import { Request, Response, NextFunction } from 'express';
import { environment } from '../app';


// export interface AuthRequest extends Request {
//     user: User;
//     token: string;
//     userStudyUser: USUser;
//     userStudyToken: string;

//     // header: (name: string) => string;
// }

export const auth = async(req: any, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }
    const data: User = jwt.verify(token, environment.jwtKey) as User;
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


export const authForward = async(req: any, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        next();
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }
    const data: User = jwt.verify(token, environment.jwtKey) as User;
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

export const authUserStudy = async(req: any, res: Response, next: NextFunction) => {
    if (! req.header('Authorization')) {
        next();
        return;
    }

    const token: string | undefined = req.header('Authorization')?.replace('Bearer ', '');
    if (token === undefined) {
        res.status(401).send({ error: 'Not authorized to access this resource' });
        return;
    }
    const data: USUser = jwt.verify(token, environment.jwtKey) as USUser;
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
