import Router from 'koa-router';
import auth from './auth';
import problem from './problem';
import group from './group';
import user from './user';

const api = new Router();

api.use('/auth', auth.routes());
api.use('/problem', problem.routes());
api.use('/group', group.routes());
api.use('/user', user.routes());

export default api;
