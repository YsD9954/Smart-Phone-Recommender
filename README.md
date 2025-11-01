
# 📱 Smart Phone Recommender

An intelligent web application that helps users discover, compare, and choose the best smartphones based on their preferences — powered by an AI-driven recommendation engine.

## 🚀 Overview

The **Smart Phone Recommender** allows users to chat naturally to find or compare mobile phones.  
Just type queries like:

> 💬 “Best camera phone under ₹30,000”  
> 💬 “Compare Pixel 8a vs OnePlus 12R”

and get instant results, detailed specs, and AI-generated insights.

---

## ✨ Features

- 🤖 **AI-powered recommendations** based on natural language queries  
- ⚡ **Fast comparisons** between two or more smartphones  
- 🎨 **Modern and responsive UI** built with Next.js + Tailwind CSS  
- 🔍 **Smart filtering** for price, brand, and specifications  
- ☁️ **Serverless API** integration with Gemini for contextual responses  
- 🔒 **Secure environment handling** (no API keys exposed)

---

## 🧠 Tech Stack

### Frontend
- **Next.js (React 18+)**
- **TypeScript**
- **Tailwind CSS**
- **Vercel Deployment**

### Backend
- **Node.js / Express**
- **Google Gemini API**
- **JSON-based phone dataset**

---

## 🧩 Folder Structure

Smart-Phone-Recommender/
│
├── frontend/ # Next.js frontend
│ ├── app/ # Next.js app router
│ ├── components/ # UI components
│ ├── public/ # Static assets
│ ├── package.json
│ └── ...
│
├── backend/ # Node.js backend with Gemini API
│ ├── server.js
│ ├── phones.json # Sample phone dataset
│ ├── .env # Contains GEMINI_API_KEY (ignored)
│ └── package.json
│
├── .gitignore
└── README.md

---

## ⚙️ Setup Instructions

1️⃣ Clone the Repository
bash
git clone https://github.com/YsD9954/Smart-Phone-Recommender.git
cd Smart-Phone-Recommender

2️⃣ Install Dependencies
For both frontend and backend:
bash
cd frontend
npm install

cd ../backend
npm install

3️⃣ Create an .env file in /backend
bash
GEMINI_API_KEY=your_api_key_here
⚠️ Do not push .env to GitHub — it is already ignored in .gitignore.

4️⃣ Start the Backend Server
bash
cd backend
npm run dev

5️⃣ Run the Frontend
bash
cd ../frontend
npm run dev
Now open http://localhost:3000 

🧠 Example Queries
Type	Example
Find    best phones:	“Best gaming phone under ₹40k”
Compare models:	        “Compare iPhone 15 vs Galaxy S23”
Brand   specific:    	“Best OnePlus phone 2024”
Feature based:	        “Phones with 5000mAh battery and AMOLED display”

🧑‍💻 Author
Yash Doke
