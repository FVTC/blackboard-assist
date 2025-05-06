
[![Tests](https://github.com/fvtc/blackboard-assist/actions/workflows/test.yml/badge.svg)](https://github.com/fvtc/blackboard-assist/actions/workflows/test.yml)


# 👨‍🏫 Blackboard Assist

Tools for automating Blackboard tasks using the Blackboard API.

## 🧠 Features

- **Easy Module Renaming**: Rename modules in your Blackboard course with ease.

- **More to Come**: This is just the beginning!

## 🚀 Installation

Project uses npm for package management. To install the project, run the following command:

```bash
npm install
```

### ➕ Environment Variables
Create a `.env` file in the root directory of the project and add the following variables:

```bash
NODE_ENV=development

PORT=3000
SITE_URL=http://localhost:3000

SESSION_SECRET=your-session-secret

BLACKBOARD_API_URL=https://your-blackboard-url/learn/api/public
BLACKBOARD_CLIENT_ID=your-client-id
BLACKBOARD_CLIENT_SECRET=your-client-secret
```

## 📦 Usage & Setup

To start the server, run the following command:

```bash
npm start
```

To run the server in development mode with hot reloading, use:

```bash
npm run dev
```

To run the tests, use:

```bash
npm test
```

## 🤝 Contributing

Contributions are welcome. Open an issue or submit a pull request.

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2025 Ryan Appel.