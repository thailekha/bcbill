import React from "react";
import Auth from "../stores/auth";

class ExtendedComponent extends React.Component {
    constructor(props) {
        super(props);

        // do NOT move these out of the constructor, otherwise "this" can become undefined
        this.handleChange = event => {
            event.preventDefault();
            const { name, value } = event.target;
            this.setState({
                [name]: value
            });
        }

        this.tryAsync = async (loading, fn, reset=true) => {
            try {
                this.setState({loading});
                await fn();
            } catch (error) {
                this.setState({loading: 'Error ...'});
                console.warn(error.message);
                await this.sleep(1000);
                reset && this.handleReset();
            } finally {
                if (!this.componentUnmounted)
                    this.setState({loading: undefined});
            }
        }

        this.handleReset = () => {
            localStorage.clear();
            this.props.history.replace("/login");
        }

        this.sleep = milliseconds =>
            new Promise(resolve => setTimeout(resolve, milliseconds))
    }
    componentWillUnmount() {
        this.componentUnmounted = true;
    }
}

export default ExtendedComponent;