import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';

import mongoose from 'mongoose';

import api from './api';
import jwtMiddleware from './lib/jwtMiddleware';

const app = new Koa();
const router = new Router();

require('dotenv').config();

const { PORT, MONGO_URI } = process.env;
const port = PORT || 4000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((e) => {
    console.error(e);
  });

router.use('/api', api.routes());

app.use(bodyParser());
app.use(jwtMiddleware);

app.use(router.routes()).use(router.allowedMethods());
app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
