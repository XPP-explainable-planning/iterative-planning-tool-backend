import { authForward} from './../middleware/auth';
import express from 'express';
import { UserModel } from '../db_schema/user';
import { auth } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

export const userRouter = express.Router();

userRouter.post('/', async (req, res) => {
    try {
        const userExists = await UserModel.findOne({ name: req.body.name});
        if (userExists) {
            res.status(400).send('User name already exists.');
            return;
        }
        const user = new UserModel(req.body);
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user: { name: user.name}, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

userRouter.post('/login', authForward, async(req: any, res: Response) => {
    console.log('Login ...');
    try {
        if (req.user) {
            res.send({ user: req.user, token: req.token });
        }
        console.log('Login');
        const username = req.body.name;
        const password = req.body.password;
        const user = await (UserModel as any).findByCredentials(username, password);

        if (!user) {
            return res.status(401).send({ error: 'Login failed! Check authentication credentials'});
        }

        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }

});


userRouter.get('', auth, async(req: any, res) => {
    res.send({ data: req.user });
});

userRouter.post('/logout', auth, async (req: any, res) => {
    console.log('Logout ...');
    try {
        req.user.tokens = req.user.tokens.filter((token: {token: string}) => {
            return token.token !== req.token;
        });
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
});

// userRouter.post('/me/logoutall', auth, async(req, res) => {
//     // Log user out of all devices
//     try {
//         req.user.tokens.splice(0, req.user.tokens.length)
//         await req.user.save()
//         res.send()
//     } catch (error) {
//         res.status(500).send(error)
//     }
// });
