import { executionSettingsRouter } from './routes/execution_settings';
import { auth } from './middleware/auth';
import { userRouter } from './routes/user';
import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';

import logger from 'morgan';
import sassMiddleware from 'node-sass-middleware';

import errorMiddleware from './middleware/error.middleware';

import { projectRouter } from './routes/project';
import { indexRouter } from './routes';
import { pddlFileRouter } from './routes/pddl_file';
import { planPropertyRouter } from './routes/plan_property';
import { plannerRouter } from './routes/planner-runs/planner';
import { runRouter } from './routes/planner-runs/run';
import { demoRouter } from './routes/demo';
import { userStudyRouter } from './routes/user-study/user-study';
import { userStudyUserRouter } from './routes/user-study/user-study-user';
import { Environment } from './environment';

import * as dotenv from "dotenv";
dotenv.config();

console.log('-------- EXPLORE BACK END ---------');

export const environment = new Environment();

const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', userRouter);
app.use('/api/user-study-users', userStudyUserRouter);

app.use('/api/user-study', userStudyRouter);
app.use('/api/demo', demoRouter);

app.use('/api/settings', executionSettingsRouter);
app.use('/api/plan-property', planPropertyRouter);

app.use('/uploads', express.static(path.join(__dirname, 'data/uploads')));
app.use('/results', express.static(path.join(__dirname, 'data/results')));
app.use('/images', express.static(path.join(__dirname, 'data/images')));

app.use('/api/planner', plannerRouter);

app.use(auth);
app.use('/', indexRouter);
app.use('/api/pddl-file', pddlFileRouter);
app.use('/api/project', projectRouter);
app.use('/api/run', runRouter);




console.log('Static path: ');
console.log(path.join(__dirname, 'uploads'));
console.log(path.join(__dirname, 'results'));
console.log(path.join(__dirname, 'images'));


// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError('404'));
});

// error handler
app.use(errorMiddleware);


app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});


// Data base connection
const port = environment.port || 3000;
const mongodbURL = process.env.MONGO || 'mongodb://localhost/explore';
mongoose.connect(mongodbURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log('connected to DB');
      // mongoose.connection.db.dropDatabase();

    })
    .catch((err: { message: any; }) => console.log(`something went wrong ${err.message}`));


app.listen(port , () => console.log(`Backend server port working on ${port}`));

module.exports = app;
