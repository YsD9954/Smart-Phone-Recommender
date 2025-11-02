"use client";

import { useState } from "react";

// ✅ Define API URL — Vercel will inject NEXT_PUBLIC_API_URL automatically
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "https://smart-phone-recommender.onrender.com";

export default function ChatBox() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        role: "bot",
        content: data.reply || "🤖 No response received from the assistant.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("⚠️ Backend connection error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "⚠️ Unable to connect to the backend server. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 bg-white shadow-xl rounded-2xl">
      <h1 className="text-2xl font-bold mb-4 text-center">
        🛍️ Mobile Chat Assistant
      </h1>

      <div className="h-80 overflow-y-auto border p-4 rounded-lg bg-gray-50 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 ${
              m.role === "user" ? "text-right" : "text-left text-green-600"
            }`}
          >
            <span
              className={`inline-block px-3 py-2 rounded-xl ${
                m.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {m.content}
            </span>
          </div>
        ))}
        {loading && <p className="text-center text-gray-500">🤔 Thinking...</p>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded-lg px-4 py-2"
          placeholder="Ask about phones..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
