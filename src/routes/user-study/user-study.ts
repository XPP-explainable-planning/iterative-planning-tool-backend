import { UserStudyModel, UserStudy } from '../../db_schema/user-study/user-study';
import express from 'express';
import mongoose from 'mongoose';
import { auth, authForward, authUserStudy } from '../../middleware/auth';
import { USUser, USUserModel } from '../../db_schema/user-study/user-study-user';
import { USPlanRun, USExplanationRun, USExplanationRunModel, USPlanRunModel } from '../../db_schema/user-study/user-study-store';

export const userStudyRouter = express.Router();


userStudyRouter.post('/', auth, async (req: any, res) => {
    try {
        const userStudy: UserStudy = new UserStudyModel(req.body);
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
        res.send(ex.message);
    }
});


userStudyRouter.put('/:id', auth, async (req, res) => {
    try {
        const refId = mongoose.Types.ObjectId(req.params.id);

        await UserStudyModel.replaceOne({ _id: refId}, req.body);

        const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

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


userStudyRouter.get('/', authForward, async (req: any, res) => {
    try {
        let userStudies;
        if (req.user) {
            userStudies = await (await UserStudyModel.find({ user: req.user._id, available: false}))
                .concat(await UserStudyModel.find({ available: true}));
        } else {
            userStudies = await UserStudyModel.find({ available: true});
        }

        if (!userStudies) { return res.status(404).send({ message: 'Lookup user studies failed.' }); }

        res.send({
            data: userStudies
        });
    } catch (ex) {
        res.send(ex.message);
    }

});



userStudyRouter.get('/:id', authForward, authUserStudy, async (req: any, res) => {
    if (! req.user && ! req.userStudyUser) {
        return res.status(401).send({ message: 'Not authorized to access this resource' });
    }
    const id = mongoose.Types.ObjectId(req.params.id);
    const userStudy = await UserStudyModel.findOne({ _id: id });
    if (!userStudy) { return res.status(404).send({ message: 'No user study found.' }); }
    res.send({
        data: userStudy
    });

});

userStudyRouter.delete('/:id', auth, async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    const userStudy = await UserStudyModel.deleteOne({ _id: id });
    if (!userStudy) { return res.status(404).send({ message: 'No user study found.' }); }
    res.send({
        data: userStudy
    });

});


userStudyRouter.get('/:id/data', auth, async (req, res) => {
    try {
        const refId = mongoose.Types.ObjectId(req.params.id);

        const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

        if (!userStudy) {
            return res.status(403).send('update user study failed');
        }

        const users: USUser[] = await  USUserModel.find({ userStudy: userStudy._id});

        const data = [];
        for (const user of users) {
            const usPlanRuns: USPlanRun[] = await USPlanRunModel.find({ user: user._id}).populate('planRun');
            const planRunData = [];
            for (const run of usPlanRuns) {
                planRunData.push({ timestamp: run.createdAt, run: run.planRun});
            }
            const usExpRuns: USExplanationRun[] = await USExplanationRunModel.find({ user: user._id}).populate('explanationRun');
            const explanationRunData = [];
            for (const run of usExpRuns) {
                explanationRunData.push({ timestamp: run.createdAt, run: run.explanationRun});
            }

            data.push({ user, planRuns: planRunData, expRuns: explanationRunData});
        }

        res.send({
            status: true,
            message: 'user study updated',
            data
        });

    } catch (ex) {
        res.send(ex.message);
    }
});
