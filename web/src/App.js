import { HashRouter, Switch, Redirect, Route } from "react-router-dom";
import Auth from "./stores/auth";

import HomePage from "./components/HomePage/HomePage"
import LoginPage from "./components/LoginPage/LoginPage"
import EnrollPage from "./components/EnrollPage/EnrollPage"
import DetailsPage from "./components/DetailsPage/DetailsPage"

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
    <div>
      <h6>({window.FOR_STAFF ? "Staff": "Customer"} view)</h6>
      <HashRouter>
        <Switch>
          <Route exact path="/login" component={LoginPage} />
          <Route exact path="/enroll" component={EnrollPage} />
          <PrivateRoute exact path="/" component={HomePage} />
          <PrivateRoute exact path="/asset/:id/details" component={DetailsPage} />
        </Switch>
      </HashRouter>
    </div>
  );
}
