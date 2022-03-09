import React from "react";
import backend from "../../backend";
import { Button } from "react-bootstrap";

class SignupPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      password: ""
    };

    this.handleChange = event => {
      const { name, value } = event.target;
      this.setState({
        [name]: value
      });
    }

    this.handleRegister = async event => {
      try {
        await backend.register(`${this.state.email}`);
        console.log("asd");
      } catch (error) {
        alert(error.message);
      } finally {
        if (!this.componentUnmounted)
          this.setState({loading: undefined});
      }
    }
  }

  render() {
    return (
      <div>
        <Button className="cdFore" variant="light" onClick={this.handleRegister}>Register</Button>
      </div>
    );
  }
}

export default SignupPage;
