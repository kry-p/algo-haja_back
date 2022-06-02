import Router from 'koa-router';
import * as solveCtrl from './solve.ctrl';
import { checkLoggedIn } from '../../lib/checker';

const solve = new Router();

// PUT methods
solve.put('/', checkLoggedIn, solveCtrl.addSolve);

// POST methods
solve.post('/', checkLoggedIn, solveCtrl.getSolveFromDatabase);
solve.post('/git/personal', checkLoggedIn, solveCtrl.getSolveFromPersonalGit);
solve.post('/git/group', checkLoggedIn, solveCtrl.getSolveFromGroupGit);

// PATCH methods
solve.patch('/', checkLoggedIn, solveCtrl.updateSolve);

// DELETE methods
solve.delete('/', checkLoggedIn, solveCtrl.deleteSolve);

export default solve;
