import {AuthChecker} from 'type-graphql';
import decodeJwt from 'jwt-decode';
import {ROLE} from '../entity/User';

interface Context {
  auth?: any;
}

export const authChecker: AuthChecker<Context> = ({context: {auth}}, roles) => {
  const decodedToken = decodeJwt(auth) as any;
  if (decodedToken.role == ROLE.ADMIN && roles.includes('ADMIN')) return true;
  return false;
};
