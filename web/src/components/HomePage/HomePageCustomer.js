import React from "react";
import backend from "../../backend";
import AsyncAwareContainer from '../AsyncAwareContainer';
import { Button, Container, Form, InputGroup, FormControl } from "react-bootstrap";
import { LinkContainer } from 'react-router-bootstrap';
import Auth from "../../stores/auth";
import FormRow from "../FormRow";
import moment from "moment";

class HomePageCustomer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: Auth.getEmail(),
      read: ""
    };

    this.handleChange = event => {
      const { name, value } = event.target;
      this.setState({
        [name]: value
      });
    }

    this.handleSubmitRead = async event => {
      try {
        this.setState({loading: 'Submitting ...'});
        await backend.addRead(this.state.email, (new Date()).getTime(), this.state.read);
        await this.getReads();
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
    this.getReads = async () => {
      try {
        this.setState({loading: 'Retrieving reads ...'});
        this.setState({reads: (await backend.getReads(this.state.email)).reads});
      } catch (error) {
        alert(error.message);
        localStorage.clear();
        this.props.history.replace("/");
      } finally {
        if (!this.componentUnmounted)
          this.setState({loading: undefined});
      }
    }
  }

  componentWillUnmount() {
    this.componentUnmounted = true;
  }

  async componentDidMount() {
    await this.getReads();
  }

  render() {
    return (
      <div>
        {/* <Button className="cdFore" variant="light" onClick={this.handleReset}>Reset</Button> */}
        <Container>
          <h1>Home - {this.state.email}</h1>
          <AsyncAwareContainer loading={this.state.loading}>
            {
              this.state.reads && this.state.reads.length > 0 &&
                <div>
                  <h2>Submitted reads</h2>
                  {
                    this.state.reads.map(r =>
                      <div key={r.key}>
                        <LinkContainer to={`/asset/${r.key}/details`} replace>
                          <Button className="cdFore" size="lg" variant="light">{r.value.val} - {moment(r.value.time).format()}</Button>
                        </LinkContainer>
                      </div>
                    )
                  }
                </div>
            }
          </AsyncAwareContainer>

          <br /><br /><br />
          <FormRow
            name="read"
            placeholder="read"
            onChange={this.handleChange}
            value={this.state.read}
            type="text"
          />
          <Button className="cdFore" variant="light" onClick={this.handleSubmitRead}>Submit read</Button>
        </Container>
      </div>
    );
  }
}

export default HomePageCustomer;
