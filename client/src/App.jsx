import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Connecting to server...");

  useEffect(() => {
    fetch("http://localhost:5000/api/test")
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setMessage("Failed to connect to the server.");
      });
  }, []);

  return (
    <div>
      <h1>FinGuard</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;