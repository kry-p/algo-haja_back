import Router from 'koa-router';
import { checkLoggedIn } from '../../lib/checker';
import * as userCtrl from './user.ctrl';

const user = new Router();

export default user;
