const urlParameters = {
    host: import.meta.env.VITE_PRIVATE_IP,
    port: import.meta.env.VITE_PORT
}

export function checkToken(token: String){
    return fetch(`http://${urlParameters.host}:${urlParameters.port}/api/checktoken`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"token": token})
    })
}