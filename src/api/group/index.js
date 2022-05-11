import Router from 'koa-router';
import { checkGroupExists, checkLoggedIn } from '../../lib/checker';
import * as groupCtrl from './group.ctrl';
import ps from './ps';

const group = new Router();

group.use('/ps', ps.routes());

// PUT methods
group.put('/', groupCtrl.createGroup);

// PATCH methods
group.patch('/', checkGroupExists, groupCtrl.updateGroup);

// DELETE methods
group.delete('/', checkGroupExists, groupCtrl.deleteGroup);

export default group;
