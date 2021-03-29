import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.css';
import UserContext, { UserContextType } from './common/userContext';
import SelectUser from './pages/selectUser';
import AddUser from './pages/addUser';
import Dashboard from './pages/dashboard';
import Activity from './pages/activity';
import UploadActivity from './pages/uploadActivity';
import Segment from './pages/segment';
import SegmentList from './pages/segmentList';
import Calendar from './pages/calendar';
import User from './types/user';
import EditUser from './pages/editUser';

export default class App extends React.Component<unknown, UserContextType> {
  constructor(props: unknown) {
    super(props);
    this.state = {
      user: {} as User,
      setUser: (user: User) => {
        this.setState({ user });
      },
    };
  }

  render(): JSX.Element {
    const { state } = this;
    return (
      <UserContext.Provider value={{ user: state.user, setUser: state.setUser }}>
        <Router>
          <Switch>
            <Route path="/Calendar" component={Calendar} />
            <Route path="/Segment" component={Segment} />
            <Route path="/Segments" component={SegmentList} />
            <Route path="/Activity" component={Activity} />
            <Route path="/UploadActivity" component={UploadActivity} />
            <Route path="/Dashboard" component={Dashboard} />
            <Route path="/EditUser" component={EditUser} />
            <Route path="/AddUser" component={AddUser} />
            <Route path="/" component={SelectUser} />
          </Switch>
        </Router>
      </UserContext.Provider>
    );
  }
}
