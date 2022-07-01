/*
 * Server core
 */
// Koa.js
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import serve from 'koa-static';
import send from 'koa-send';

// Mongoose
import mongoose from 'mongoose';
// API and middlewares
import api from './api';

import jwtMiddleware from './lib/jwtMiddleware';

import { runScheduledJob } from './lib/schedule';
import { logger } from './config/winston';

import path from 'path';

const app = new Koa();
const router = new Router();

// env
require('dotenv').config();

const { PORT, MONGO_URI, BUILD_DIR } = process.env;
const port = PORT || 4000;

const buildDirectory =
  BUILD_DIR === undefined ? undefined : path.resolve(__dirname, BUILD_DIR);

// 작업 큐
let bojQueue = new Map();
let solvedacQueue = new Map();

global.bojQueue = bojQueue;
global.solvedacQueue = solvedacQueue;

// cron
runScheduledJob();

mongoose
  .connect(MONGO_URI)
  .then(() => {
    logger.info('MongoDB 데이터베이스에 연결되었습니다.');
  })
  .catch((e) => {
    logger.error(
      `데이터베이스에 연결할 수 없습니다. 오류 내용은 다음과 같습니다.\n${e}`,
    );
  });

router.use('/api', api.routes());

app.use(bodyParser());
app.use(jwtMiddleware);

app.use(router.routes()).use(router.allowedMethods());
app.use(serve(buildDirectory));
app.use(async (ctx) => {
  if (ctx.status === 404)
    await send(ctx, 'index.html', { root: buildDirectory });
});

app.listen(port, () => {
  logger.info('알고하자 서버가 시작되었습니다.');
  logger.info(`${port}번 포트로 접근할 수 있습니다.`);
});
