import React from "react";
import HomePageCustomer from "./HomePageCustomer";
import HomePageStaff from "./HomePageStaff";

class HomePage extends React.Component {
  render() {
    return (window.FOR_STAFF) ? <HomePageStaff routerHistory={this.props.history} /> : <HomePageCustomer routerHistory={this.props.history}/>;
  }
}

export default HomePage;
