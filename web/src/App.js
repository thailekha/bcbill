import { HashRouter, Switch, Redirect, Route } from "react-router-dom";

import HomePage from "./components/HomePage/HomePage"
import SignupPage from "./components/SignupPage/SignupPage"



export default function App() {
  return (
    <HashRouter>
      <Switch>
        <Route exact path="/" component={SignupPage} />
        <Route exact path="/home" component={HomePage} />
      </Switch>
    </HashRouter>
  );
}
