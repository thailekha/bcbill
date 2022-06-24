import React from "react";
import Auth from "../../stores/auth";
import backend from "../../backend";
import FormRow from '../FormRow';
import AsyncAwareContainer from '../AsyncAwareContainer';
import { Button, Container, Form, InputGroup, FormControl } from "react-bootstrap";

class EnrollPage extends React.Component {
  constructor(props) {
    super(props);

    if (Auth.loggedIn()) {
      this.props.history.replace("/");
    }

    this.state = {
      email: "customer1@org1.com",
      secret: "trNBUtXMuSji",
      orgNo: "1"
    };

    this.handleChange = event => {
      const { name, value } = event.target;
      this.setState({
        [name]: value
      });
    }

    this.handleEnroll = async event => {
      try {
        this.setState({loading: 'Enrolling'});
        const wallet = await backend.enroll(this.state.email, this.state.secret);
        this.setState({loading: 'Logging in'});
        Auth.setWallet(wallet);
        this.props.history.replace("/");
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
      <div>
        <Container>
          <h1>Enroll</h1>
          <AsyncAwareContainer loading={this.state.loading}>
            <InputGroup className="mb-3">
              <FormControl
                name="email"
                placeholder="email"
                onChange={this.handleChange}
                value={this.state.email}
              />
              <FormControl
                name="orgNo"
                placeholder="orgNo"
                onChange={this.handleChange}
                value={this.state.orgNo}
              />            
              <FormRow
                name="secret"
                placeholder="secret"
                type="password"
                onChange={this.handleChange}
                value={this.state.secret}
              />
            </InputGroup>
            <br />
            <Button className="cdFore" variant="light" onClick={this.handleEnroll}>Enroll</Button>
          </AsyncAwareContainer>
        </Container>
      </div>
    );
  }
}

export default EnrollPage;
