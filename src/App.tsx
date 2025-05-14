import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster, toast } from "sonner";
import { useState } from "react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">Average Calculator</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

type NumberResponse = {
  windowPrevState: number[];
  windowCurrState: number[];
  numbers: number[];
  avg: number;
  error?: string;
  timeout?: boolean;
};

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NumberResponse | null>(null);

  const fetchNumbers = async (type: string) => {
    setLoading(true);
    try {
      const deploymentName = window.location.hostname.split('.')[0];
      const response = await fetch(`https://${deploymentName}.convex.cloud/numbers/${type}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        toast.error(data.error);
      } else if (data.timeout) {
        toast.warning("Request timed out. Using previous state.");
      }
      
      setResult(data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch numbers");
    } finally {
      setLoading(false);
    }
  };

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold accent-text mb-4">Number Average Calculator</h1>
        <Authenticated>
          <p className="text-xl text-slate-600 mb-8">
            Welcome back, {loggedInUser?.email ?? "friend"}!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { type: 'p', label: 'Prime Numbers' },
              { type: 'f', label: 'Fibonacci Numbers' },
              { type: 'e', label: 'Even Numbers' },
              { type: 'r', label: 'Random Numbers' }
            ].map(({ type, label }) => (
              <button
                key={type}
                onClick={() => fetchNumbers(type)}
                disabled={loading}
                className="p-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
          {loading && (
            <div className="flex justify-center mb-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          )}
          {result && (
            <div className="space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResultBox 
                  title="Previous Window State" 
                  numbers={result.windowPrevState}
                />
                <ResultBox 
                  title="Current Window State" 
                  numbers={result.windowCurrState}
                />
              </div>
              <ResultBox 
                title="New Numbers from API" 
                numbers={result.numbers}
              />
              <div className="p-6 bg-white rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold mb-2">Average</h3>
                <p className="text-3xl font-bold text-indigo-600">
                  {result.avg.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-slate-600">Sign in to get started</p>
          <SignInForm />
        </Unauthenticated>
      </div>
    </div>
  );
}

function ResultBox({ title, numbers }: { title: string; numbers: number[] }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {numbers.length === 0 ? (
          <p className="text-slate-500 italic">No numbers</p>
        ) : (
          numbers.map((num, i) => (
            <span 
              key={i}
              className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full"
            >
              {num}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
