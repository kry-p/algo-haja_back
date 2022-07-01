import Router from 'koa-router';
import { checkGroupExists, checkLoggedIn } from '../../lib/checker';
import * as problemCtrl from './problem.ctrl';

const problem = new Router();

// PATCH methods
problem.patch('/rating', checkLoggedIn, problemCtrl.updateProblemRating);

// POST methods
problem.post(
  '/list-user',
  checkLoggedIn,
  problemCtrl.getUserSolvedOrTriedProblem,
);
problem.post('/rating', checkLoggedIn, problemCtrl.getUserRating);
problem.post('/user-solved', checkLoggedIn, problemCtrl.getUserSolved);
problem.post('/user-tried', checkLoggedIn, problemCtrl.getUserTried);
problem.post('/info', problemCtrl.updateProblemInfo);
problem.post(
  '/group',
  checkLoggedIn,
  checkGroupExists,
  problemCtrl.getGroupProblem,
);
// GET methods
problem.get('/:problemId', problemCtrl.getProblem);

export default problem;
