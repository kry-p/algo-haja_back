import Router from 'koa-router';
import {
  checkLoggedIn,
  checkGroupExists,
  checkPracticeExists,
} from '../../../lib/checker';
import * as psCtrl from './ps.ctrl';

const ps = new Router();

// PUT methods
ps.put('/', checkLoggedIn, checkGroupExists, psCtrl.createGroupPractice);
ps.put(
  '/pool',
  checkLoggedIn,
  checkGroupExists,
  psCtrl.createGroupPracticeFromPool,
);

// PATCH methods
ps.patch(
  '/',
  checkLoggedIn,
  checkGroupExists,
  checkPracticeExists,
  psCtrl.updateGroupPractice,
);
// DELETE methods
ps.delete(
  '/',
  checkLoggedIn,
  checkGroupExists,
  checkPracticeExists,
  psCtrl.deleteGroupPractice,
);

export default ps;
