import React from 'react';
import { Redirect } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Database from '../common/database';
import UserContext, { UserContextType } from '../common/userContext';
import User from '../types/user';

type State = {
  users: User[];
  redirectTo: string | undefined;
};

class SelectUser extends React.Component<unknown, State> {
  database: Database;

  constructor(props: unknown) {
    super(props);
    this.state = {
      users: [],
      redirectTo: undefined,
    };
    this.database = Database.getDatabaseInstance();
    this.redirectToDashboardPage = this.redirectToDashboardPage.bind(this);
    this.redirectToAddUserPage = this.redirectToAddUserPage.bind(this);
  }

  async componentDidMount(): Promise<void> {
    const users = await this.database.getAllUsers();
    this.setState({ users });
  }

  redirectToDashboardPage(user: User): void {
    const context = this.context as UserContextType;
    context.setUser(user);
    this.setState({ redirectTo: '/Dashboard' });
  }

  redirectToAddUserPage(): void {
    this.setState({ redirectTo: '/AddUser' });
  }

  render(): JSX.Element {
    const { state } = this;

    if (state.redirectTo !== undefined) {
      return <Redirect to={state.redirectTo} />;
    }

    return (
      <main>
        <h6 className="text-center display-6 pt-5">Select User</h6>
        <div className="mt-5 row row-cols-2 row-cols-md-3 row-cols-xl-4 noselect">
          {state.users.map((user, index) => {
            return (
              <div className="col mb-4 text-center" key={uuidv4()}>
                <div
                  className="card h-100 select-user-card"
                  role="button"
                  tabIndex={index + 1}
                  onClick={() => this.redirectToDashboardPage(user)}
                  onKeyDown={(event) => event.key === 'Enter' && this.redirectToDashboardPage(user)}
                >
                  <div className="card-body">
                    <div className="p-3 select-user-card-initials">
                      <span className="display-2 lead text-muted">
                        {`${user.firstName.toUpperCase().charAt(0)}.${user.lastName.toUpperCase().charAt(0)}`}
                      </span>
                    </div>
                    <h3 className="mt-3 text-center display-6">{`${user.firstName} ${user.lastName}`}</h3>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="col mb-4 text-center">
            <div
              className="card h-100 select-user-card"
              role="button"
              onClick={() => this.redirectToAddUserPage()}
              onKeyDown={(event) => event.key === 'Enter' && this.redirectToAddUserPage()}
              tabIndex={state.users.length + 1}
            >
              <div className="card-body">
                <div className="p-3 select-user-card-initials">
                  <span className="display-2 lead text-muted">+</span>
                </div>
                <h3 className="mt-3 text-center display-6">Add User</h3>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
SelectUser.contextType = UserContext;

export default SelectUser;
