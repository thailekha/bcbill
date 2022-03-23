import React, { Component } from 'react';
import { Spinner, Modal } from 'react-bootstrap';

class AsyncAwareContainer extends Component {
  render() {
    const loading = this.props.loading !== undefined && this.props.loading !== null;
    let message = 'Loading';
    if (typeof this.props.loading === 'string' && this.props.loading.trim().length > 0) {
      message = this.props.loading;
    }

    return (
      <div>
        {
          loading
            ? (
              <Modal show={loading} centered>
                <Modal.Body>
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                    &nbsp;
                    {' '}
                    {message}
                  </div>
                </Modal.Body>
              </Modal>
            )
            : React.createElement('div', null, this.props.children)
        }
      </div>
    );
  }
}

export default AsyncAwareContainer;
