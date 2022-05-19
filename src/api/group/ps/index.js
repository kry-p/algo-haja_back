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
  checkGroupExists,
  checkPracticeExists,
  psCtrl.updateGroupPractice,
);
// DELETE methods
ps.delete(
  '/',
  checkGroupExists,
  checkPracticeExists,
  psCtrl.deleteGroupPractice,
);
// POST methods
ps.post('/list', checkLoggedIn, checkGroupExists, psCtrl.getGroupPracticeList);

export default ps;
