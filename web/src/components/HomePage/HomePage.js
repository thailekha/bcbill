import React from "react";
import HomePageCustomer from "./HomePageCustomer";
import HomePageStaff from "./HomePageStaff";
import ExtendedComponent from "../ExtendedComponent";
import Auth from "../../stores/auth";

class HomePage extends ExtendedComponent {
  constructor(props) {
    super(props);
    if (!Auth.loggedIn()) {
      this.props.history.replace("/login");
    }
  }
  render() {
    return (window.FOR_STAFF) ? <HomePageStaff history={this.props.history} /> : <HomePageCustomer history={this.props.history}/>;
  }
}

export default HomePage;
