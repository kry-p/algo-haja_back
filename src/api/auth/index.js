import Router from 'koa-router';
import { RateLimit } from 'koa2-ratelimit';
import { checkLoggedIn } from '../../lib/checker';
import * as authCtrl from './auth.ctrl';

const auth = new Router();

const accountLimiter = RateLimit.middleware({
  interval: { min: 5 },
  delayAfter: 3,
  timeWait: 2 * 1000,
  max: 10,
  prefixKey: 'auth',
  message: '로그인 실패가 너무 많습니다. 잠시 후에 다시 시도하세요.',
});

// POST methods
auth.post('/register', authCtrl.register);
auth.post('/login', accountLimiter, authCtrl.login);
auth.post('/logout', authCtrl.logout);
auth.post('/promote', checkLoggedIn, authCtrl.promote);

// GET methods
auth.get('/check', authCtrl.check);
auth.get('/verify', authCtrl.verify);

export default auth;
