import { HashRouter, Switch, Redirect, Route } from "react-router-dom";

import HomePage from "./components/HomePage/HomePage"
import SignupPage from "./components/SignupPage/SignupPage"
import LoginPage from "./components/LoginPage/LoginPage"

// function PrivateRoute({ component: Component, ...rest }) {
//   return (
//     <Route
//       {...rest}
//       render={props =>
//         Auth.loggedIn() ? (
//           <Component {...props} />
//         ) : (
//           <Redirect
//             to={{
//               pathname: "/login",
//               state: { from: props.location }
//             }}
//           />
//         )
//       }
//     />
//   );
// }

export default function App() {
  return (
    <HashRouter>
      <Switch>
        <Route exact path="/" component={LoginPage} />
        <Route exact path="/home" component={HomePage} />
      </Switch>
    </HashRouter>
  );
}
