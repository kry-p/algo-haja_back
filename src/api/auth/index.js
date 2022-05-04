import Router from 'koa-router';
import { checkLoggedIn } from '../../lib/checker';
import * as authCtrl from './auth.ctrl';

const auth = new Router();

// POST methods
auth.post('/register', authCtrl.register);
auth.post('/login', authCtrl.login);
auth.post('/logout', authCtrl.logout);
auth.post('/promote', checkLoggedIn, authCtrl.promote);

// GET methods
auth.get('/check', authCtrl.check);
auth.get('/verify', authCtrl.verify);

export default auth;
