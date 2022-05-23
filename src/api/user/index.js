import Router from 'koa-router';
import { checkLoggedIn, checkNicknameDuplicated } from '../../lib/checker';
import * as userCtrl from './user.ctrl';

const user = new Router();

// POST methods
user.post('/info', checkLoggedIn, userCtrl.getUserInfo);
user.post('/password', checkLoggedIn, userCtrl.changeUserPassword);
user.post('/nickname', checkLoggedIn, userCtrl.checkNickname);

// PATCH methods
user.patch(
  '/basic',
  checkLoggedIn,
  checkNicknameDuplicated,
  userCtrl.updateBasicInfo,
);
user.patch('/git', checkLoggedIn, userCtrl.updateGitRepositoryinfo);

export default user;
