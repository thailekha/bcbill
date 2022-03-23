import React, { Component } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';
import utils from './utils';

// <Col xs="2">{utils.propercase(this.props.name)}</Col>

class FormRow extends Component {
  render() {
    return (
      <div>
        <Row>
          <Col>
            <FormControl
              placeholder={this.props.placeholder ? utils.propercase(this.props.placeholder) : ''}
              type={this.props.type ? this.props.type : 'text'}
              name={this.props.name}
              onChange={this.props.onChange}
            />
          </Col>
        </Row>
        <br />
      </div>
    );
  }
}

export default FormRow;
