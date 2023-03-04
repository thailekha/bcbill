import React from "react";
import backend from "../../backend";
import AsyncAwareContainer from '../AsyncAwareContainer';
import { Button, Container, Form, Table  } from "react-bootstrap";
import Auth from "../../stores/auth";
import sortBy from "lodash/sortBy";
import find from "lodash/find";
import tail from "lodash/tail";
import hash from "object-hash";
import ExtendedComponent from "../ExtendedComponent";

const EMPTY_BOX = 'emptybox';

function getMappingId(certHash, path) {
  return hash({ certHash, path });
}
class HomePageStaff extends ExtendedComponent {
  constructor(props) {
    super(props);

    this.state = {
      email: Auth.getEmail(),
      statusTable: []
    };
  }

  async handleStatusChange(onOrOff, certHash, path) {
    if (onOrOff === 'reenable') {
      await this.tryAsync('Re-enabling ...', async () => {
        await backend.reenable(this.state.email, certHash, path);
      }, false)
    } else {
      await this.tryAsync('Revoking ...', async () => {
        await backend.revoke(this.state.email, certHash, path);
      }, false)
    }
    await this.fetchAll();
  }

  async fetchAll() {
    await this.tryAsync('Retrieving ...', async () => {
      const { users, endpoints, mappings } = (await backend.fetchall(this.state.email)).assets;
      // how to put this into a table?
      const sortedEndpoints = sortBy(endpoints, 'path');
      const sortedUsers = sortBy(users, 'email')
          .filter(u => !u.email.includes('admin'));
      const statusTable = [
          // first row
          [EMPTY_BOX].concat(sortedUsers.map(u => u.email))
      ];
      for (const e of sortedEndpoints) {
        const row = [e.path];
        for (const u of sortedUsers) {
          let status;
          const mapping = find(mappings, { email: u.email, path: e.path});
          if (mapping) {
            if (mapping.authorized) {
              status = <Form.Check
                  checked={mapping.authorized}
                  type="switch"
                  id={ getMappingId(mapping.certHash, mapping.path) }
                  label=""
                  onChange={async (e) => {
                    e.preventDefault();
                    await this.handleStatusChange('revoke', mapping.certHash, mapping.path)
                  }}
              />;
            } else {
              status = <Form.Check
                  checked={mapping.authorized}
                  type="switch"
                  id={ getMappingId(mapping.certHash, mapping.path) }
                  label=""
                  onChange={async (e) => {
                    e.preventDefault();
                    await this.handleStatusChange('reenable', mapping.certHash, mapping.path)
                  }}
              />;
            }
          } else {
            status = <Form.Check
                type="switch"
                id={ u.email + e.path }
                label=""
                disabled
            />;
          }
          row.push(status);
        }
        statusTable.push(row);
      }
      this.setState({ users, statusTable });
    })
  }

  async componentDidMount() {
    await this.fetchAll();
  }

  render() {
    const stat = this.state.statusTable;
    return (
      <div>
        <Button className="cdFore" variant="light" onClick={this.handleReset}>Reset</Button>
        <Container>
          <h1>Admin</h1>
          <AsyncAwareContainer loading={this.state.loading}>
            {
                stat && stat.length > 1 &&
                <div>
                  <h2>Overview</h2>
                  <Table>
                    <thead>
                    <tr>
                      {
                        stat[0].map((s, i) =>
                          i === 0 ? <td></td> : <th scope="col">{s}</th>
                        )
                      }
                    </tr>
                    </thead>

                    {
                      tail(stat).map(row =>
                        <tr>
                          {
                            row.map((s, i) =>
                              i === 0 ? <th scope="row">{s}</th> : <td>{s}</td>
                            )
                          }
                        </tr>
                      )
                    }
                  </Table>
                </div>
            }
          </AsyncAwareContainer>
        </Container>
      </div>
    );
  }
}

export default HomePageStaff;
