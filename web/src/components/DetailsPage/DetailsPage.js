import React from "react";
import backend from "../../backend";
import AsyncAwareContainer from '../AsyncAwareContainer';
import { Button, Container, Form, InputGroup, FormControl } from "react-bootstrap";
import { LinkContainer } from 'react-router-bootstrap';
import Auth from "../../stores/auth";
import { Map, Marker } from "pigeon-maps"
import FormRow from "../FormRow";
import moment from "moment";

class DetailsPage extends React.Component {
  render() {
    return window.FOR_STAFF ? <DetailsPageStaff routerHistory={this.props.history} assetKey={this.props.match.params.id} /> : <DetailsPageCustomer routerHistory={this.props.history} assetKey={this.props.match.params.id}/>;
  }
}

class DetailsPageCustomer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: Auth.getEmail(),
      history: {},
      locations: []
    };

    this.handleChange = event => {
      const { name, value } = event.target;
      this.setState({
        [name]: value
      });
    }
  }

  componentWillUnmount() {
    this.componentUnmounted = true;
  }

  async componentDidMount() {
    try {
      this.setState({loading: true});
    /*
    {
      'staff1@org2.com': [
        {
          timestamp: '2022-11-23T07:50:30.954Z',
          location: '52.146973,-106.647034'
        }
      ],
      'staff2@org2.com': [
        {
          timestamp: '2022-11-23T07:50:33.121Z',
          location: '52.51666667,13.4'
        },
        {
          timestamp: '2022-11-23T07:50:35.260Z',
          location: '52.51666667,13.4'
        }
      ]
    }
    */

      const history = await backend.getHistory(this.state.email, this.props.assetKey);
      const locations = []
      for(const accessor in history) {
        locations.push(history[accessor].map(a => a.location.split(",").map(geo => parseFloat(geo))))
      }
      // const uniqueLocations = [...new Set(...locations.flat())];
      this.setState({ 
        history,
        locations: locations.flat()
      })

      console.warn("history", history)
      console.warn("locations", locations)

    } catch (error) {
      alert(error.message);
    } finally {
      if (!this.componentUnmounted)
        this.setState({loading: undefined});
    }
  }

  render() {
    return (
      <div>
        <Container>
          <h1>History of {this.props.assetKey}</h1>
          <AsyncAwareContainer loading={this.state.loading}>
            
                <Map height={500} defaultCenter={[52.146973,-106.647034]} defaultZoom={2}>
                {
                  this.state.locations && this.state.locations.length > 0 &&
                    this.state.locations.map( l =>
                      <Marker width={50} anchor={l} />
                    )
                }
                </Map>
          </AsyncAwareContainer>
        </Container>
      </div>
    );
  }
}

class DetailsPageStaff extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: Auth.getEmail(),
      read: {}
    };

    this.handleChange = event => {
      const { name, value } = event.target;
      this.setState({
        [name]: value
      });
    }
  }

  componentWillUnmount() {
    this.componentUnmounted = true;
  }

  async componentDidMount() {
    try {
      this.setState({loading: true});
    //   {
    //     active: true,
    //     authorizedUsers: [
    //     ],
    //     docType: "read",
    //     owner: "8019f054b84d1d9e87e1654adf532bd466e20d62",
    //     time: 1669533857198,
    //     val: "100",
    //   }

      const read = (await backend.getRead(this.state.email, this.props.assetKey)).read;
      this.setState({ read })
    } catch (error) {
      alert(error.message);
    } finally {
      if (!this.componentUnmounted)
        this.setState({loading: undefined});
    }
  }
  render() {
    return (
      <Container>
          <h1>Details</h1>
          <AsyncAwareContainer loading={this.state.loading}>        
            <p>{this.state.read.val} - {moment(this.state.read.time).format()}</p>
          </AsyncAwareContainer>
        </Container>
    );
  }
}

export default DetailsPage;
