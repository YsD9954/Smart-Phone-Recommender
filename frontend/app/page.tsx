


"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

type Phone = {
  name: string;
  brand: string;
  price: number;
  camera?: string;
  battery?: string;
  display?: string;
  processor?: string;
  charging?: string;
  storage?: string;
  image?: string;
};

type Msg = {
  sender: "user" | "bot";
  text?: string;
  results?: Phone[];
  compare?: {
    left?: Phone;
    right?: Phone;
    tradeoffs?: string[];
  };
};

export default function Home() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      sender: "bot",
      text: "🤖 Your Smart Assistant for Phone Recommendations — Ask, Compare, and Discover the Best Phones Instantly!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function send() {
    if (!input.trim()) return;

    const userMsg: Msg = { sender: "user", text: input };
    setMsgs((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();

      setMsgs((prev): Msg[] => {
        if (data.left || data.right) {
          return [
            ...prev,
            {
              sender: "bot",
              compare: {
                left: data.left,
                right: data.right,
                tradeoffs: data.tradeoffs || [],
              },
            },
          ];
        } else if (data.details) {
          return [
            ...prev,
            {
              sender: "bot",
              results: [data.details],
              text: data.reply,
            },
          ];
        } else if (data.results) {
          return [
            ...prev,
            {
              sender: "bot",
              results: data.results,
              text: data.reply,
            },
          ];
        } else {
          return [
            ...prev,
            { sender: "bot", text: data.reply || "No results found." },
          ];
        }
      });
    } catch {
      setMsgs((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Server error — please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") send();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 via-indigo-200 to-pink-200 p-6">
      <div className="w-full max-w-3xl backdrop-blur-xl bg-white/40 border border-white/30 shadow-2xl rounded-3xl p-6 transition-all">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
          📲 Smart Phone Recommender
        </h2>

        {/* Chat Window */}
        <div className="h-[60vh] overflow-y-auto p-4 rounded-2xl bg-white/70 shadow-inner space-y-4">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-4 rounded-2xl shadow-md text-sm sm:text-base transition-all duration-300 ${
                  m.sender === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white max-w-[80%]"
                    : "bg-white/90 text-gray-900 border border-gray-200 max-w-[85%]"
                }`}
              >
                {m.text && (
                  <div className="whitespace-pre-line leading-relaxed">{m.text}</div>
                )}

                {/* Show Phone List */}
                {m.results && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {m.results.map((p, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-xl bg-white/90 shadow-sm hover:shadow-lg transition-all duration-300 p-3"
                      >
                        {p.image && (
                          <Image
                            src={p.image}
                            alt={p.name}
                            width={200}
                            height={150}
                            className="w-full h-36 object-cover rounded-lg"
                          />
                        )}
                        <div className="mt-2">
                          <div className="font-semibold text-lg">{p.name}</div>
                          <div className="text-sm text-gray-600">{p.brand}</div>
                          <div className="font-bold mt-1 text-blue-700">
                            ₹{p.price}
                          </div>
                          <div className="text-xs mt-1 text-gray-700">
                            {p.camera}
                          </div>
                          <div className="text-xs">{p.battery}</div>
                          <div className="text-xs">{p.processor}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Compare Layout */}
                {m.compare && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[m.compare.left, m.compare.right].map((side, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-xl bg-white/80 p-3 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="font-semibold text-base text-gray-800">
                          {side?.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {side?.brand} — ₹{side?.price}
                        </div>
                        <div className="text-xs mt-2">{side?.camera}</div>
                        <div className="text-xs">{side?.battery}</div>
                        <div className="text-xs">{side?.processor}</div>
                      </div>
                    ))}

                    {m.compare.tradeoffs && (
                      <div className="col-span-full mt-3 bg-blue-50 p-3 rounded-lg">
                        <div className="font-semibold text-gray-700">
                          Tradeoffs:
                        </div>
                        <ul className="list-disc pl-5 text-sm text-gray-700 mt-1">
                          {m.compare.tradeoffs.map((t, j) => (
                            <li key={j}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="mt-5 flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none bg-white/80 placeholder:text-gray-500"
            placeholder="Ask e.g. ‘Best phone under ₹30k’ or ‘Compare Pixel 8a vs OnePlus 12R’"
          />
          <button
            onClick={send}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-semibold rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
