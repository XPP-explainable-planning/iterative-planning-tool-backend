import { UserStudy } from './../db_schema/survey';
import { UserStudyModel } from './../db_schema/user-study';
import express from 'express';
import mongoose from 'mongoose';
import { auth, authForward } from '../middleware/auth';

export const userStudyRouter = express.Router();


userStudyRouter.post('/', auth, async (req, res) => {
    console.log('Create User Study');
    console.log('body');
    console.log(req.body);
    try {
        const userStudy = new UserStudyModel(req.body);
        userStudy.user = req.user._id;

        if (!userStudy) {
            return res.status(403).send('user study failed');
        }
        const data = await userStudy.save();
        res.send({
            status: true,
            message: 'user study created',
            data
        });
    }

    catch (ex) {
        console.log('Error: ' + ex.message);
        res.send(ex.message);
    }
});


userStudyRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = mongoose.Types.ObjectId(req.params.id);

        await UserStudyModel.replaceOne({_id: refId}, req.body);

        const userStudy: UserStudy | null = await UserStudyModel.findOne({_id: refId});

        if (!userStudy) {
            return res.status(403).send('update user study failed');
        }

        res.send({
            status: true,
            message: 'user study updated',
            data: userStudy
        });

    } catch (ex) {
        res.send(ex.message);
    }
});

userStudyRouter.get('/', authForward, async (req, res) => {
    try {
        let userStudies;
        if (req.user) {
            userStudies = await (await UserStudyModel.find({ user: req.user._id, available: false}))
            .concat(await UserStudyModel.find({ available: true}));
        } else {
            userStudies = await UserStudyModel.find({ available: true});
        }


        if (!userStudies) { return res.status(404).send({ message: 'lookup user studies failed' }); }

        console.log('User Studies: #' + userStudies.length);

        res.send({
            data: userStudies
        });
    } catch (ex) {
        res.send(ex.message);
    }

});



userStudyRouter.get('/:id', auth, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const userStudy = await UserStudyModel.findOne({ _id: id });
    if (!userStudy) { return res.status(404).send({ message: 'not found user study' }); }
    res.send({
        data: userStudy
    });

});

userStudyRouter.delete('/:id', auth, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const userStudy = await UserStudyModel.deleteOne({ _id: id });
    if (!userStudy) { return res.status(404).send({ message: 'not found user study' }); }
    res.send({
        data: userStudy
    });

});

