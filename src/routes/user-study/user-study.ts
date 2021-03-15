import { UserStudyModel, UserStudy, UserStudyStepType } from '../../db_schema/user-study/user-study';
import express from 'express';
import mongoose from 'mongoose';
import { auth, authForward, authUserStudy } from '../../middleware/auth';
import { USUser, USUserModel } from '../../db_schema/user-study/user-study-user';
import {
    USPlanRun,
    USExplanationRun,
    USExplanationRunModel,
    USPlanRunModel,
    UserStudyData, UserStudyDemoData
} from '../../db_schema/user-study/user-study-store';
import { ExplanationRun, PlanRun } from '../../db_schema/run';

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

        const demoIds: string[] = [];
        for (const userStudyStep of userStudy.steps) {
            if (userStudyStep.type === UserStudyStepType.demo) {
                demoIds.push(userStudyStep.content);
            }
        }

        const users: USUser[] = await  USUserModel.find({ userStudy: userStudy._id});

        const data: UserStudyData[] = [];
        for (const user of users) {
            const demosData: { demoId: string, data: UserStudyDemoData}[] = [];
            const usPlanRuns: USPlanRun[] = await USPlanRunModel.find({ user: user._id}).populate('planRun');
            const usExpRuns: USExplanationRun[] = await USExplanationRunModel.find({ user: user._id}).populate('explanationRun');

            for (const demoId of demoIds) {
                const planRunData = [];
                const planRunIds: string[] = [];
                for (const run of usPlanRuns) {
                    if (run.planRun.project.toString() === demoId) {
                        planRunData.push({ timeStamp: run.createdAt, run: run.planRun});
                        planRunIds.push(run.planRun._id.toString());
                    }
                }

                const explanationRunData = [];
                for (const run of usExpRuns) {
                    if (planRunIds.includes((run.explanationRun.planRun as PlanRun)._id.toString())) {
                        explanationRunData.push({ timeStamp: run.createdAt, run: run.explanationRun});
                    }
                }
                demosData.push({ demoId, data: { planRuns: planRunData, expRuns: explanationRunData}});
            }
            // console.log(demosData);
            data.push({ user, demosData});
        }

        // console.log(data);

        res.send({
            status: true,
            message: 'user study updated',
            data
        });

    } catch (ex) {
        res.send(ex.message);
    }
});



userStudyRouter.get('/:id/users', auth, async (req, res) => {
    try {
        const refId = mongoose.Types.ObjectId(req.params.id);

        const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

        if (!userStudy) {
            return res.status(403).send('update user study failed');
        }

        const users: USUser[] = await  USUserModel.find({ userStudy: userStudy._id});

        res.send({
            status: true,
            message: 'user study updated',
            data: users
        });

    } catch (ex) {
        res.send(ex.message);
    }
});

userStudyRouter.get('/:id/num_accepted_users', async (req, res) => {
    try {
        const refId = mongoose.Types.ObjectId(req.params.id);

        const userStudy: UserStudy | null = await UserStudyModel.findOne({ _id: refId});

        if (!userStudy) {
            return res.status(403).send('update user study failed');
        }

        const users: USUser[] = await  USUserModel.find({ userStudy: userStudy._id, accepted: true});
        const numUsers = users.length;

        res.send({
            status: true,
            message: 'num accepted users',
            data: numUsers
        });

    } catch (ex) {
        res.send(ex.message);
    }
});
