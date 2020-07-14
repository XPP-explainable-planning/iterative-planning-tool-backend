import { authUserStudy } from '../../middleware/auth';
import express from 'express';
import { USUserModel } from '../../db_schema/user-study/user-study-user';

export const userStudyUserRouter = express.Router();

userStudyUserRouter.post('/', async (req, res) => {

    try {
        console.log('register new user study user: ' + req.body.prolificId);
        const user = new USUserModel(req.body);
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });

    } catch (error) {
        res.status(400).send(error);
    }
});


userStudyUserRouter.post('/logout', authUserStudy,  async (req: any, res) => {

    try {
        req.userStudyUser.token = null;
        await req.userStudyUser.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
});
