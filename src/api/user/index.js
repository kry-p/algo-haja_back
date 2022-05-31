import Router from 'koa-router';
import { checkLoggedIn } from '../../lib/checker';
import * as userCtrl from './user.ctrl';

const user = new Router();

// POST methods
user.post('/info', checkLoggedIn, userCtrl.getUserInfo);
user.post('/password', checkLoggedIn, userCtrl.changeUserPassword);

// PATCH methods
user.patch('/basic', checkLoggedIn, userCtrl.updateBasicInfo);
user.patch('/git', checkLoggedIn, userCtrl.updateGitRepositoryInfo);
user.patch('/solved', checkLoggedIn, userCtrl.updateSolvedProblem);

export default user;
