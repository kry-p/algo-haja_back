import Router from 'koa-router';
import { checkGroupExists, checkLoggedIn } from '../../lib/checker';
import * as problemCtrl from './problem.ctrl';

const problem = new Router();

// PUT methods
problem.put('/', checkLoggedIn, problemCtrl.addProblem);

// PATCH methods
problem.patch('/info', checkLoggedIn, problemCtrl.updateProblemInfo);
problem.patch('/rating', checkLoggedIn, problemCtrl.updateProblemRating);
// POST methods
problem.post('/rating', checkLoggedIn, problemCtrl.getUserRating);
problem.post('/user-solved', checkLoggedIn, problemCtrl.getUserSolved);
problem.post('/user-tried', checkLoggedIn, problemCtrl.getUserTried);

problem.post(
  '/group',
  checkLoggedIn,
  checkGroupExists,
  problemCtrl.getGroupProblem,
);

export default problem;
