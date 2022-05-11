import Router from 'koa-router';
import auth from './auth';
import problem from './problem';
import group from './group';

const api = new Router();

api.use('/auth', auth.routes());
api.use('/problem', problem.routes());
api.use('/group', group.routes());

export default api;
