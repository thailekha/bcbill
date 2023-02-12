import React, {useRef, useState} from "react";
import backend from "../../backend";
import AsyncAwareContainer from '../AsyncAwareContainer';
import { Button, Container, ListGroup, Form, Overlay } from "react-bootstrap";
import Auth from "../../stores/auth";
import differenceBy from "lodash/differenceBy";
import sortBy from "lodash/sortBy";
import ExtendedComponent from "../ExtendedComponent";
import {Tester_Overlay, API_Tester} from "./API_Tester";

class HomePageCustomer extends ExtendedComponent {
  constructor(props) {
    super(props);

    this.state = {
      email: Auth.getEmail(),
      endpointsStatus: []
    };
  }


  async fetchAll() {
    await this.tryAsync('Retrieving ...', async () => {
      const { endpoints, mappings } = (await backend.fetchall(this.state.email)).assets;
      const unclaimedEndpoints = differenceBy(endpoints, mappings, 'path');
      this.setState({ endpointsStatus: sortBy(mappings ? unclaimedEndpoints.concat(mappings) : unclaimedEndpoints, 'path') });
    })
  }

  async componentDidMount() {
    await this.fetchAll();
  }

  getAction(endpoint) {
    if (typeof endpoint.authorized === 'undefined') {
      return <Form.Check
          type="switch"
          id={ endpoint.path }
          label=""
          onChange={async (e) => {
            e.preventDefault();
            await this.tryAsync('Claiming endpoint...', async () => {
              await backend.claim(this.state.email, endpoint.path)
            },false)
            await this.fetchAll();
          }}
      />
    } else if(!endpoint.authorized) {
      return <Form.Check
          type="switch"
          isInvalid={true}
          id={ endpoint.path }
          label="Revoked by admin"
          disabled
      />
    } else {
      return <Form.Check
          type="switch"
          checked={true}
          id={ endpoint.path }
          label="Claimed"
          disabled
      />
    }
  }

  render() {
    return (
      <div>
        <Button className="cdFore" variant="light" onClick={this.handleReset}>Reset</Button>
        <Container>
          <h1>Home - {this.state.email}</h1>
          <AsyncAwareContainer loading={this.state.loading}>
            {
              this.state.endpointsStatus && this.state.endpointsStatus.length > 0 &&
                <div>
                  <h2>Endpoints</h2>

                  <ListGroup variant="flush">
                  {
                    this.state.endpointsStatus.map((e, i) =>
                      <ListGroup.Item key={e.key}>

                        { e.path }

                        <div>
                          { this.getAction(e) }
                          <Tester_Overlay>
                              <API_Tester endpoint={'http://localhost:9999/protected' + e.path} />
                          </Tester_Overlay>
                        </div>

                      </ListGroup.Item>
                    )
                  }
                  </ListGroup>

                </div>
            }
          </AsyncAwareContainer>
        </Container>
      </div>
    );
  }
}

export default HomePageCustomer;
