import { useState } from "react";
import EmployeeForm from "./EmployeeForm";

const SignupGate = () => {
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(false);

  // You can store this in .env (VITE_INVITE_PIN) if using Vite
  const SECRET_PIN = "12345"; // e.g. "1234"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === SECRET_PIN) {
      setVerified(true);
    } else {
      alert("Invalid PIN. Please contact admin.");
    }
  };

  if (verified) {
    return <EmployeeForm />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl shadow-md w-80">
        <h2 className="text-lg font-semibold mb-4 text-center">Enter Access PIN</h2>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="border rounded w-full p-2 mb-4"
          placeholder="Enter PIN"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white w-full p-2 rounded hover:bg-blue-700"
        >
          Continue
        </button>
      </form>
    </div>
  );
};

export default SignupGate;
