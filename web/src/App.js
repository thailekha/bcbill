import { HashRouter, Switch, Redirect, Route } from "react-router-dom";
import Auth from "./stores/auth";

import HomePage from "./components/HomePage/HomePage"
import LoginPage from "./components/LoginPage/LoginPage"
import EnrollPage from "./components/EnrollPage/EnrollPage"

import './style.css';

function PrivateRoute({ component: Component, ...rest }) {
  return (
    <Route
      {...rest}
      render={props =>
        Auth.loggedIn() ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/enroll",
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );
}

export default function App() {
  return (
    <HashRouter>
      <Switch>
        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/enroll" component={EnrollPage} />
        <PrivateRoute exact path="/" component={HomePage} />
      </Switch>
    </HashRouter>
  );
}
