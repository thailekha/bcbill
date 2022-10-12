import React from "react";
import backend from "../../backend";
import AsyncAwareContainer from '../AsyncAwareContainer';
import { Button, Container, Form, InputGroup, FormControl } from "react-bootstrap";
import Auth from "../../stores/auth";
import { Map, Marker } from "pigeon-maps"

class HomePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: Auth.getEmail(),
      assetKey: ""
    };

    this.handleChange = event => {
      const { name, value } = event.target;
      this.setState({
        [name]: value
      });
    }

    this.handleSubmitRead = async event => {
      try {
        this.setState({loading: 'Testing ...'});
        await backend.addRead(this.state.email, (new Date()).getTime(), 100);
      } catch (error) {
        alert(error.message);
      } finally {
        if (!this.componentUnmounted)
          this.setState({loading: undefined});
      }
    }
    this.handleGetReads = async event => {
      try {
        this.setState({loading: 'Testing ...'});
        this.setState({reads: (await backend.getReads(this.state.email)).reads});
      } catch (error) {
        alert(error.message);
      } finally {
        if (!this.componentUnmounted)
          this.setState({loading: undefined});
      }
    }
    this.handleHistory = async event => {
      try {
        this.setState({loading: 'Testing ...'});
        await backend.getHistory(this.state.email, this.state.assetKey);
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
          <h1>Home</h1>
          <AsyncAwareContainer loading={this.state.loading}>
            <FormControl
              name="assetKey"
              placeholder="assetKey"
              onChange={this.handleChange}
              value={this.state.assetKey}
            />
            <br />
            <Button className="cdFore" variant="light" onClick={this.handleSubmitRead}>Submit read</Button>
            <Button className="cdFore" variant="light" onClick={this.handleGetReads}>Get reads</Button>
            <Button className="cdFore" variant="light" onClick={this.handleHistory}>Get history</Button>
            <ul>
              {
                this.state.reads && this.state.reads.map(r => <li>ID: {r.key}, VAL: {r.value.val}</li>)
              }
            </ul>

            <Map height={300} defaultCenter={[50.879, 4.6997]}>
              <Marker width={50} anchor={[50.879, 4.6997]} />
            </Map>
          </AsyncAwareContainer>
        </Container>
      </div>
    );
  }
}

export default HomePage;
