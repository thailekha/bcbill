import React from "react";
import { Button, Container, FormControl, InputGroup } from "react-bootstrap";
import AsyncAwareContainer from '../AsyncAwareContainer';
import Auth from "../../stores/auth";
import FormRow from '../FormRow';
import { LinkContainer } from 'react-router-bootstrap';
import ExtendedComponent from "../ExtendedComponent";
import backend from "../../backend";
import unionBy from "lodash/unionBy";

class LoginForm extends ExtendedComponent {
  constructor(props) {
    super(props);
    this.state = {
      email: window.FOR_STAFF ? "staff1@org2.com" : "customer1@org1.com",
      wallet: ""
    };

    this.handleLogin = async () => {
      this.setState({loading: 'Logging in'});
      await this.sleep(2000)
      Auth.setWallet(this.state.wallet, this.state.email);
      this.props.routerHistory.replace("/");
    }
  }

  render() {
    return (
      <AsyncAwareContainer loading={this.state.loading}>
        <InputGroup className="mb-3">
          <FormControl
            name="email"
            placeholder="User ID"
            onChange={this.handleChange}
            value={this.state.email}
          />
          <InputGroup.Append>
            <InputGroup.Text>@usask.ca</InputGroup.Text>
          </InputGroup.Append>
        </InputGroup>
        <FormRow name="wallet" placeholder="Password" type="password" onChange={this.handleChange} />
        <Button className="cdFore" variant="light" size='sm' onClick={this.handleLogin} block>Login</Button>
      </AsyncAwareContainer>
    )
  }
}

class LoginPage extends ExtendedComponent {
  render() {
    return (
      <div>
        <Container className="text-center">
          <LoginForm routerHistory={this.props.history} />
          <br/>
          <LinkContainer to="/enroll">
            <a> Sign Up</a>
          </LinkContainer>
        </Container>
      </div>
    );
  }
}

export default LoginPage;
