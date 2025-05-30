# Checkmates Service

A Node.js TypeScript service implementing Express API and websocket server.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (for database)
- npm or yarn

## Setup

1. Clone the repository:

```bash
git clone <repository-url> checkmates-backend
cd checkmates-backend
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update the following variables in `.env`:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `DIRECT_URL`: Direct PostgreSQL connection string (same as DATABASE_URL)
     - `NEYNAR_API_KEY`: Your Neynar API key
     - `APP_URL`: Your application's public URL
     - Other variables can be left as default for local development


## Development

Run the development server with hot reload:

```bash
pnpm run dev
```

The server will start on `http://localhost:3000` by default.

## Production

Build and start the production server:

```bash
pnpm run build

# Start the server
pnpm run start
```

## Available Scripts

- `pnpm run dev`: Start development server with hot reload
- `pnpm run build`: Build the TypeScript code
- `pnpm run start`: Start the production server
- `pnpm run lint`: Run ESLint

## Project Structure

```
src/
  ├── index.ts          # Application entry point
  ├── routes/           # API routes
  ├── controllers/      # Route controllers
  ├── services/         # Business logic
  └── types/            # TypeScript type definitions
```

## Environment Variables

Key environment variables that need to be configured:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `API_SECRET_KEY`: Secret key for API authentication (min 32 characters)
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct PostgreSQL connection string
- `NEYNAR_API_KEY`: Your Neynar API key
- `APP_URL`: Your application's public URL

## API Authentication

All API endpoints (except `/health`) require authentication using an API secret key. To make authenticated requests:

1. Set the `API_SECRET_KEY` in your environment variables
2. Include the secret key in your requests using the `x-api-secret` header:

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "x-api-secret: your-secret-key-here" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "text": "Message"}'
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

See [LICENSE.md](./LICENSE.md)