import React from 'react';
import User from '../types/user';

export type UserContextType = {
  user: User;
  setUser(user: User): void;
};

const userContext = React.createContext<UserContextType>({
  user: {} as User,
  setUser: () => {},
});
export default userContext;
