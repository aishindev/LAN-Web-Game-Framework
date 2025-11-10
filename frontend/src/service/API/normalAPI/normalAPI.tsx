export function checkToken(token: String){
    return fetch("http://127.0.0.1:4000/api/checktoken", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"token": token})
    })
}