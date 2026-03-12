# Contributing to MarketPulse

Thank you for contributing! Please follow these guidelines to ensure code quality.

## Pre-Commit Checklist

Before pushing code, ensure:

### 1. **Python Code (Backend)**
```bash
cd backend
pip install flake8 pylint black isort

# Check code style
flake8 main.py

# Format code automatically
black main.py
isort main.py
```

### 2. **TypeScript/JavaScript (Frontend)**
```bash
cd frontend
npm install

# Check code quality
npm run lint

# Check types
npm run type-check

# Format code automatically
npm run lint:fix
npm run format

# Build to verify
npm run build
```

### 3. **Docker Verification**
```bash
# Ensure Docker builds without errors
docker-compose build --no-cache

# Test locally
docker-compose up
# Visit http://localhost and verify app works
```

## Git Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Keep commits small and focused
   - Write descriptive commit messages

3. **Run linting locally**
   ```bash
   # Backend
   cd backend && flake8 main.py

   # Frontend
   cd frontend && npm run lint && npm run type-check
   ```

4. **Format your code**
   ```bash
   # Backend
   black backend/ && isort backend/

   # Frontend
   npm run lint:fix && npm run format
   ```

5. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **GitHub Actions will automatically**
   - Run flake8 and pylint on Python code
   - Run ESLint on TypeScript/JavaScript
   - Check TypeScript types
   - Build the frontend
   - Report any issues

## Code Quality Standards

### Python
- **Style**: PEP 8 (enforced by flake8)
- **Formatting**: Black code formatter
- **Imports**: Sorted with isort
- **Max line length**: 120 characters
- **Type hints**: Recommended for new functions

### JavaScript/TypeScript
- **Style**: ESLint + prettier
- **Max line length**: 100 characters
- **Quotes**: Double quotes
- **Semicolons**: Required
- **Type safety**: TypeScript strict mode

## Common Commands

| Command | Purpose |
|---------|---------|
| `flake8 backend/` | Check Python style |
| `black backend/` | Format Python code |
| `npm run lint` | Check JS/TS style |
| `npm run lint:fix` | Auto-fix JS/TS issues |
| `npm run format` | Format with Prettier |
| `npm run type-check` | Check TypeScript types |
| `docker-compose up` | Run full app locally |

## Troubleshooting

**"flake8 not found"**
```bash
pip install flake8
```

**"npm: command not found"**
```bash
# Install Node.js from https://nodejs.org/
```

**"Docker build fails"**
```bash
docker-compose down
docker system prune  # Remove old images
docker-compose build --no-cache
```

## Questions?

Check the [README.md](README.md) for architecture and setup details.
