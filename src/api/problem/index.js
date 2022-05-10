import Router from 'koa-router';
import { checkLoggedIn } from '../../lib/checker';
import * as problemCtrl from './problem.ctrl';

const problem = new Router();

// PUT methods
problem.put('/', problemCtrl.addProblem);
// PATCH methods
problem.patch('/', problemCtrl.updateProblem);

// POST methods
problem.post('/user-solved', problemCtrl.findUserSolved);
problem.post('/user-tried', problemCtrl.findUserTried);

export default problem;
