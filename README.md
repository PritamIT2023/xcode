# Express Application

A robust and scalable Express.js web application for managing authentication and Create Voucher QR and print.

## Features
- Fast and lightweight server-side framework
- RESTful API endpoints

## Prerequisites

Make sure you have the following installed:
- Node.js (18 or higher)
- npm or yarn (Node Package Manager)

## Getting Started

Follow these instructions to set up and run the application locally.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PritamIT2023/xcode.git
   cd xcode
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add necessary environment variables:
   ```plaintext
   PORT=3000
   DATABASE_NAME=DB_NAME
   USER_NAME=USERNAME
   DB_PASSWORD=YOUR_PASSWORD
   HOST=HOST_NAME
   DIALECT=mssql (For MS SQL SERVER)
   ```

4. Run the application:
   ```bash
   npm start
   ```

   Alternatively, for development with hot reloading:
   ```bash
   npm run dev
   ```

5. Open your browser and go to `http://localhost:3000`


## Scripts

The `package.json` includes the following scripts:

- `start`: Runs the application in production mode.
- `dev`: Runs the application in development mode using `nodemon`.

## Dependencies

List the major dependencies:

- `express`: Web framework for Node.js
- `sequelize`: ORM For database Interaction
- `dotenv`: Loads environment variables

Check `package.json` for the full list.


## Acknowledgements

- [Express](https://expressjs.com/) for the web framework