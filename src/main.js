/*
 * Server core
 */
// Built-in module
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';

// Koa.js
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import serve from 'koa-static';
import send from 'koa-send';
// import compress from 'koa-compress';
import cors from '@koa/cors';

// Mongoose
import mongoose from 'mongoose';

// API and middlewares
import api from './api';
import jwtMiddleware from './lib/jwtMiddleware';

// Libraries
import { runScheduledJob } from './lib/schedule';
import { logger } from './config/winston';

const sslify = require('koa-sslify').default;
const app = new Koa();
const router = new Router();

// env
require('dotenv').config();

const { PORT, MONGO_URI, BUILD_DIR, CERT_PATH, DOMAIN } = process.env;
const port = PORT || 4000;

const buildDirectory = BUILD_DIR
  ? path.resolve(__dirname, BUILD_DIR)
  : undefined;
const serverCallback = app.callback();

// 작업 큐
let bojQueue = new Map();
let solvedacQueue = new Map();
let gitUserQueue = new Map();
let gitGroupQueue = new Map();

global.bojQueue = bojQueue;
global.solvedacQueue = solvedacQueue;
global.gitUserQueue = gitUserQueue;
global.gitGroupQueue = gitGroupQueue;

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

try {
  router.use('/api', api.routes());
  app.use(bodyParser());
  app.use(jwtMiddleware);
  app.use(router.routes()).use(router.allowedMethods());
  app.use(cors());

  // for stand-alone API server
  if (buildDirectory) {
    app.use(serve(buildDirectory));
    app.use(async (ctx) => {
      // not found, not started at /api
      if (ctx.status === 404 && ctx.path.indexOf('/api') !== 0) {
        // return index.html
        await send(ctx, 'index.html', { root: buildDirectory });
      }
    });
  }

  // for https callback
  if (CERT_PATH) {
    app.use(sslify());
    const config = {
      domain: DOMAIN,
      https: {
        port: 443,
        options: {
          key: fs
            .readFileSync(path.resolve(CERT_PATH, 'privkey.pem'), 'utf-8')
            .toString(),
          cert: fs
            .readFileSync(path.resolve(CERT_PATH, 'fullchain.pem'), 'utf-8')
            .toString(),
        },
      },
    };

    http.createServer(app.callback()).listen(80);
    const httpsServer = https.createServer(
      config.https.options,
      serverCallback,
    );

    httpsServer.listen(config.https.port, function (err) {
      if (err) {
        logger.error('서버: HTTPS 연결을 수립할 수 없습니다.');
      } else {
        logger.info(
          `Server: Established - https://${config.domain}:${config.https.port}`,
        );
      }
    });
  }

  app.listen(port, () => {
    logger.info('알고하자 서버가 시작되었습니다.');
    logger.info(`${port}번 포트로 접근할 수 있습니다.`);
  });
} catch (e) {
  logger.error('인스턴스를 수립할 수 없습니다.');
}
