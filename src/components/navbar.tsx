import React from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router-dom';
import UserContext, { UserContextType } from '../common/userContext';

type State = {
  redirectTo: string | undefined;
};

class Navbar extends React.Component<RouteComponentProps, State> {
  constructor(props: RouteComponentProps) {
    super(props);
    this.state = {
      redirectTo: undefined,
    };
  }

  redirectTo(path: string): void {
    const { state } = this;
    if (path !== state.redirectTo) {
      this.setState({ redirectTo: path });
    }
  }

  render(): JSX.Element {
    const { props, state } = this;
    if (state.redirectTo !== undefined) {
      const currentPath = props.location.pathname;
      if (!currentPath.includes(state.redirectTo) || state.redirectTo === '/') {
        return <Redirect to={state.redirectTo} />;
      }
    }

    const context = this.context as UserContextType;
    return (
      <nav className="navbar navbar-expand-md navbar-dark">
        <div className="container-fluid">
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbar"
            aria-controls="navbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse text-center navbar-collapse" id="navbar">
            <div className="col-md-2 text-start d-none d-md-block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="25"
                height="25"
                fill="#777"
                viewBox="0 0 16 16"
                role="button"
                onClick={() => this.redirectTo('/')}
              >
                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1v-1c0-1-1-4-6-4s-6 3-6 4v1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12z" />
              </svg>
              <span>
                &nbsp;{context.user.firstName.charAt(0)}.{context.user.lastName}
              </span>
            </div>
            <div className="col-sm-12 col-md-8">
              <ul className="nav navbar-nav justify-content-center w-100">
                <li className="nav-item">
                  <span className="nav-link" onClick={() => this.redirectTo('/Dashboard')} onKeyDown={() => {}} role="button" tabIndex={-1}>
                    Dashboard
                  </span>
                </li>
                <li className="nav-item">
                  <span className="nav-link" onClick={() => this.redirectTo('/Calendar')} onKeyDown={() => {}} role="button" tabIndex={-1}>
                    Calendar
                  </span>
                </li>
                <li className="nav-item">
                  <span className="nav-link" onClick={() => this.redirectTo('/UploadActivity')} onKeyDown={() => {}} role="button" tabIndex={-1}>
                    Upload
                  </span>
                </li>
                <li className="nav-item">
                  <span className="nav-link" onClick={() => this.redirectTo('/Segments')} onKeyDown={() => {}} role="button" tabIndex={-1}>
                    Segments
                  </span>
                </li>
                <li className="nav-item">
                  <span className="nav-link" onClick={() => this.redirectTo('/EditUser')} onKeyDown={() => {}} role="button" tabIndex={-1}>
                    Settings
                  </span>
                </li>
                <li className="nav-item d-block d-md-none">
                  <span className="nav-link">Switch User</span>
                </li>
              </ul>
            </div>
            <div className="col-md-2 text-end d-none d-md-block">
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="#777" viewBox="0 0 16 16" role="button">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z" />
              </svg>
            </div>
          </div>
        </div>
      </nav>
    );
  }
}
Navbar.contextType = UserContext;

export default withRouter(Navbar);
