import React from "react";
import backend from "../../backend";
import AsyncAwareContainer from '../AsyncAwareContainer';
import { Button, Container, Form, InputGroup, FormControl } from "react-bootstrap";

class HomePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "customer1@gmail.com"
    };

    this.handleEnroll = async event => {
      try {
        this.setState({loading: 'Testing ...'});
        await backend.addRead(this.state.email, this.state.secret);
      } catch (error) {
        alert(error.message);
      } finally {
        if (!this.componentUnmounted)
          this.setState({loading: undefined});
      }
    }

    this.handleReset = async () => {
      localStorage.clear();
      this.props.history.replace("/");
    }
  }

  componentWillUnmount() {
    this.componentUnmounted = true;
  }

  render() {
    return (
      <div>
        <Button className="cdFore" variant="light" onClick={this.handleReset}>Reset</Button>
        <Container>
          <h1>Enroll</h1>
          <AsyncAwareContainer loading={this.state.loading}>
            <br />
            <Button className="cdFore" variant="light" onClick={this.handleEnroll}>Test</Button>
          </AsyncAwareContainer>
        </Container>
      </div>
    );
  }
}

export default HomePage;
