import Router from 'koa-router';
import { checkGroupExists, checkPracticeExists } from '../../../lib/checker';
import * as psCtrl from './ps.ctrl';

const ps = new Router();

// PUT methods
ps.put('/', checkGroupExists, psCtrl.createGroupPractice);
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

export default ps;
