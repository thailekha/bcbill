import React, {useRef, useState} from 'react';
import {Button, Overlay} from "react-bootstrap";
import Auth from "../../stores/auth";

export function API_Tester(props) {
    const [method, setMethod] = useState('GET');
    const [body, setBody] = useState('');
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let res = await fetch(props.endpoint, {
                crossDomain:true,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    auth: JSON.stringify({
                        email: Auth.getEmail(),
                        wallet: Auth.getWallet()
                    })
                },
                body: method !== 'GET' ? JSON.stringify(body) : undefined,
            });
            res = await res.json();
            setResponse(res);
            setError(null);
        } catch (err) {
            setError(err.message);
            setResponse(null);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <label>
                    Method:
                    <select value={method} onChange={(e) => setMethod(e.target.value)}>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </label>
                <br />
                {method !== 'GET' && (
                    <label>
                        Request Body:
                        <textarea value={body} onChange={(e) => setBody(e.target.value)} />
                    </label>
                )}
                <br />
                <button type="submit">Submit</button>
            </form>
            {response && (
                <div>
                    <h2>Response:</h2>
                    <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
            {error && (
                <div>
                    <h2>Error:</h2>
                    <pre>{error}</pre>
                </div>
            )}
        </div>
    );
};


export function Tester_Overlay({ children }) {
    const [show, setShow] = useState(false);
    const target = useRef(null);

    return (
        <>
            <Button style={{
                float: 'right'
            }}  variant="secondary" ref={target} onClick={() => setShow(!show)}>
                Test
            </Button>
            <Overlay target={target.current} show={show} placement="left">
                {({
                      placement: _placement,
                      arrowProps: _arrowProps,
                      show: _show,
                      popper: _popper,
                      hasDoneInitialMeasure: _hasDoneInitialMeasure,
                      ...props
                  }) => (
                    <div
                        {...props}
                        style={{
                            backgroundColor: 'rgba(166, 217, 235, 0.8)',
                            padding: '2px 10px',
                            borderRadius: 3,
                            ...props.style,
                        }}
                    >
                        {children}
                    </div>
                )}
            </Overlay>
        </>
    );
}

