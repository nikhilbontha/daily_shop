# Daily Shop E-commerce Platform

## Project Structure

```
/
├─ backend/           # Node.js/Express backend
│  ├─ controllers/    # Request handlers
│  ├─ models/        # Database models
│  ├─ routes/        # API routes
│  ├─ middleware/    # Custom middleware
│  ├─ config/        # Configuration files
│  ├─ server.js      # Entry point
│  └─ package.json   # Backend dependencies
├─ frontend/         # Angular frontend application
├─ shared/           # Shared constants and utilities
├─ scripts/          # Utility scripts
├─ docs/            # Documentation
└─ package.json     # Root package.json
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Setup environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration

3. Start development servers:
   ```bash
   # Start backend server
   npm run dev:backend
   
   # Start frontend server
   npm run dev:frontend
   ```

## Scripts

- `npm run dev`: Start both frontend and backend in development mode
- `npm run build`: Build both frontend and backend
- `npm test`: Run tests for both frontend and backend
- `npm run scaffold:frontend`: Create new Angular frontend using scaffold script

## API Documentation

API documentation is available at `/api/docs` when running the backend server.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details