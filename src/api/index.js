import Router from 'koa-router';
import auth from './auth';
import problem from './problem';

const api = new Router();

api.use('/auth', auth.routes());
api.use('/problem', problem.routes());

export default api;
