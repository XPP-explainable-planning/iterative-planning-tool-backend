import { authUserStudy } from '../../middleware/auth';
import express from 'express';
import { USUserModel } from '../../db_schema/user-study/user-study-user';

export const userStudyUserRouter = express.Router();

userStudyUserRouter.post('/', async (req, res) => {

    try {
        const user = new USUserModel(req.body);
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });

    } catch (error) {
        res.status(400).send(error);
    }
});


userStudyUserRouter.post('/timelog', authUserStudy,  async (req: any, res) => {

    try {
        const timeLog = req.body.timeLog;
        const userStudyUser = req.userStudyUser;
        userStudyUser.timeLog = timeLog;
        userStudyUser.save().then(() => res.send(), (err: any) => console.log(err));
    } catch (error) {
        res.status(500).send(error);
    }
});


userStudyUserRouter.put('/payment', authUserStudy,  async (req: any, res) => {

    try {
        const payment = req.body.payment;
        const userStudyUser = req.userStudyUser;
        userStudyUser.payment = payment;
        userStudyUser.save().then(() => res.send(), (err: any) => console.log(err));
    } catch (error) {
        res.status(500).send(error);
    }
});


userStudyUserRouter.post('/logout', authUserStudy,  async (req: any, res) => {

    try {
        req.userStudyUser.token = null;
        req.userStudyUser.finished = true;
        await req.userStudyUser.save();
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
});
