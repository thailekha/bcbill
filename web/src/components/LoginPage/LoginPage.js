import React from "react";
import backend from "../../backend";
import { Button, Container, FormControl, InputGroup } from "react-bootstrap";
import AsyncAwareContainer from '../AsyncAwareContainer';
import Auth from "../../stores/auth";
import FormRow from '../FormRow';
import { LinkContainer } from 'react-router-bootstrap';

class LoginForm extends React.Component {
  constructor(props) {
    super(props);

    // if (Auth.loggedIn()) {
    //   this.props.routerHistory.replace("/");
    // }

    this.state = {
      email: "",
      password: ""
    };

    this.handleChange = event => {
      const { name, value } = event.target;
      this.setState({
        [name]: value
      });
    }

    this.handleLogin = async event => {
      try {
        this.setState({loading: 'Logging in'});
        await backend.login(this.state.email, this.state.password);
        Auth.setToken(this.state.email);
        this.props.routerHistory.replace("/");
      } catch (error) {
        alert(error.message);
      } finally {
        if (!this.componentUnmounted)
          this.setState({loading: undefined});
      }
    }
  }

  componentWillUnmount() {
    this.componentUnmounted = true;
  }

  render() {
    return (
      <AsyncAwareContainer loading={this.state.loading}>
        <InputGroup className="mb-3">
          <FormControl
            name="email"
            placeholder="User ID"
            onChange={this.handleChange}
          />
          <InputGroup.Append>
            <InputGroup.Text>@usask.ca</InputGroup.Text>
          </InputGroup.Append>
        </InputGroup>
        <FormRow name="password" placeholder="Password" type="password" onChange={this.handleChange} />
        <Button className="cdFore" variant="light" size='sm' onClick={this.handleLogin} block></Button>
      </AsyncAwareContainer>
    )
  }
}

class LoginPage extends React.Component {
  render() {
    return (
      <div>
        <Container className="text-center">
          {/*<LoginForm routerHistory={this.props.history} />*/}
          <br/>
          <h6> Doesn't have an account? </h6>
          <LinkContainer to="/register">
            <a> Sign Up</a>
          </LinkContainer>
        </Container>
      </div>
    );
  }
}

export default LoginPage;
