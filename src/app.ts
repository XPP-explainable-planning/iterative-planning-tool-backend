import { projectRouter } from './routes/project';

console.log('-------- EXPLORE BACKEND ---------');

import HttpErrors from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';

import logger from 'morgan';
import  createError from 'http-errors';
import sassMiddleware from 'node-sass-middleware';

import errorMiddleware from './middleware/error.middleware';

import { indexRouter } from './routes';
import { pddlFileRouter } from './routes/pddl_file';
import { planPropertyRouter } from './routes/plan_property';
import  { plannerCallRouter} from './routes/planner-calls';

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

app.use('/', indexRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/pddl-file', pddlFileRouter);
app.use('/api/plan-property', planPropertyRouter);
app.use('/api/project', projectRouter);
app.use('/api/planner', plannerCallRouter);


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
const port = process.env.PORT || 3001;
mongoose.connect('mongodb://localhost/chat', { useNewUrlParser: true })
    .then(() => console.log('connected to DB'))
    .catch((err: { message: any; }) => console.log(`something went wrong ${err.message}`));

app.listen(port , () => console.log(`DB port working on ${port}`));

module.exports = app;
