# Grok with Twitter

This application allows you to integrate Grok directly with Twitter with capabilities including Posting a tweet, Follow a profile, Search and Fetch Tweets


## Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**

    Create a file named `.env.local` in the root of the project and add the following variable:

    ```env
    COMPOSIO_API_KEY=your_composio_api_key_here
    # You may also need an API key for the AI model provider (e.g., XAI_API_KEY)
    # Add it here if required by your setup
    # XAI_API_KEY=your_xai_api_key_here
    ```

    Replace `your_composio_api_key_here` with your actual Composio API key. If you are using a model provider that requires a separate key (like X AI), uncomment and fill in that line as well.

## Running the Application

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will typically be available at `http://localhost:3000`.


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


