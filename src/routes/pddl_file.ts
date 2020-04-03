import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';

import { PddlFileModel } from '../db_schema/pddl_file';

export const pddlFileRouter = express.Router();

const imgPort = 'http://localhost:3000';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(__dirname);
        cb(null, path.join(path.resolve(__dirname, '..'), 'uploads'));
    },
    filename: (req, file, cb) => {
        // cb(null, file.originalname);
        cb(null, Date.now() + file.originalname);
    },
});

const fileFilter = (req: any, file: any, cb: (arg0: null, arg1: boolean) => void) => {
    cb(null, true);
    /*if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }*/
};

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter
});

pddlFileRouter.post('/', upload.single('pddlfile'), async (req, res) => {
    try {
        console.log('POST FILE');
        console.log(req.body);
        const file = new PddlFileModel({
            name: req.body.name,
            path: imgPort + '/uploads/' + req.file.filename,
            type: req.body.type,
            domain: req.body.domain
        });
        if (!file) {
            console.log('File ERROR');
            return res.status(403).send('not found file');
        }
        const data = await file.save();
        console.log('File: ' + file);
        res.send({
            status: true,
            message: 'File is uploaded',
            data
        });
    }

    catch (ex) {
        res.send(ex.message);
    }
});

pddlFileRouter.get('/type/:type', async (req, res) => {
    console.log('PDDL FILE: GET');
    const fileType = req.params.type;
    const pddlFiles = await  PddlFileModel.find({ type: fileType });
    console.log('GET PDDL FILES: #' + pddlFiles.length);
    if (!pddlFiles) { return res.status(404).send({ message: 'not found PDDL files' }); }
    res.send({
        data: pddlFiles
    });

});

pddlFileRouter.get('/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('ID: ' + id);
    const pddlFile = await PddlFileModel.findOne({ _id: id });
    if (!pddlFile) { return res.status(404).send({ message: 'not found PDDL file' }); }
    res.send({
        data: pddlFile
    });

});

pddlFileRouter.delete('/:id', async (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    console.log('DELETE ID: ' + id);
    const pddlFile = await PddlFileModel.deleteOne({ _id: id });
    console.log(pddlFile);
    if (!pddlFile) { return res.status(404).send({ message: 'not found PDDL file' }); }
    res.send({
        data: pddlFile
    });

});

