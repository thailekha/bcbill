import React from "react";
import backend from "../../backend";
import AsyncAwareContainer from '../AsyncAwareContainer';
import { Button, Container, Form, InputGroup, FormControl } from "react-bootstrap";
import { LinkContainer } from 'react-router-bootstrap';
import Auth from "../../stores/auth";

class HomePageStaff extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: Auth.getEmail()
    };

    this.handleChange = event => {
      const { name, value } = event.target;
      this.setState({
        [name]: value
      });
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
        <Container>
          <h1>Home - {this.state.email}</h1>
          <AsyncAwareContainer loading={this.state.loading}>
            {
              this.state.reads && this.state.reads.length > 0 &&
                <div>
                  <h2>Reads submitted by customers</h2>
                  {
                    this.state.reads.map(r =>
                      <div key={r.key}>
                        <LinkContainer to={`/asset/${r.key}/details`} replace>
                          <Button className="cdFore" size="lg" variant="light">{r.key}</Button>
                        </LinkContainer>
                      </div>
                    )
                  }
                </div>
            }
          </AsyncAwareContainer>
        </Container>
      </div>
    );
  }
}

export default HomePageStaff;
