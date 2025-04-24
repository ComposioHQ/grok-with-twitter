# Grok with Twitter

A application to display and interact with Twitter content, potentially enhanced with Grok AI insights.

## ✨ Features

*   Displays tweets in a clean card format.
*   Built with modern web technologies.
*   (Potential) Integration with Grok for tweet analysis or summarization.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   Node.js (Version specified in `.nvmrc` if available, or latest LTS)
*   npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ComposioHQ/grok-with-twitter.git
    cd grok-with-twitter
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory by copying the example file (if one exists) or creating it manually.
    ```bash
    cp .env.example .env.local # If .env.example exists
    ```
    Populate `.env.local` with the necessary API keys and configuration values (e.g., Twitter API keys, Grok API keys).

    *Example `.env.local` structure:*
    ```env
    # Twitter API Credentials (replace with actual variables if needed)
    XAI_API_KEY=your_xai_api_Key
    COMPOSIO_API_KEY=your_composio_api_key


    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🛠️ Built With

*   [Next.js](https://nextjs.org/) - React Framework
*   [React](https://reactjs.org/) - UI Library
*   [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
*   [Tailwind CSS](https://tailwindcss.com/) - Utility-First CSS Framework
*   [Shadcn UI](https://ui.shadcn.com/) - Re-usable UI components

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details (if applicable).
