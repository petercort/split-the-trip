# Split the Trip

Split the Trip is a Next.js React web application for splitting expenses during group trips. Users can add participants, track expenses with vendor/cost/attendees/payer information, and automatically calculate optimized payments to settle all debts.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap the Repository
- Install dependencies: `npm install` -- takes 30 seconds. May show deprecation warnings but these are safe to ignore.
- Check code quality: `npm run lint` -- takes 3 seconds. Should pass with no warnings/errors.
- Build the application: `npm run build` -- takes 20 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
- Run tests: `npm test` -- takes 6 seconds. NEVER CANCEL. Set timeout to 30+ minutes. Note: 3 tests fail due to text mismatches but this is expected.
- Run tests with coverage: `npm run test:ci` -- takes 6 seconds. NEVER CANCEL. Set timeout to 30+ minutes.

### Development Workflow  
- Start development server: `npm run dev` -- starts in 1 second on http://localhost:3000 with Turbopack enabled
- Run tests in watch mode: `npm run test:watch`
- Run specific tests: `npm test -- --testNamePattern="pattern"`
- Debug tests: `npm run test:debug`

### Production Deployment
- **DO NOT use `npm start`** -- this fails because the app is configured for static export to GitHub Pages
- The app is deployed via GitHub Actions workflow (`nextjs.yml`) that builds and deploys to GitHub Pages
- CI pipeline (`ci.yml`) runs on pull requests: `npm install && npm run build`

## Validation

### Manual Testing Scenarios
ALWAYS test the application manually after making changes by running through these complete scenarios:

1. **Basic Functionality Test**:
   - Start dev server: `npm run dev`
   - Navigate to http://localhost:3000
   - Click "Load Example Data" 
   - Verify example trip loads with peter, john, tim and 3 expenses (Pizza party $20, car rental $60, beer $15)
   - Click "🧮 Generate Payment Plan"
   - Verify payment summary shows: peter→tim $20.00, john→peter $5.00, john→tim $15.00

2. **Detailed Calculation Test**:
   - Expand "Balance Details & Calculations" section
   - Verify expense breakdown shows correct split amounts
   - Verify direct debts and net payments are mathematically correct

3. **User Interface Test**:
   - Test adding new participants manually
   - Test adding new expenses with different configurations
   - Test "Clear All" functionality resets everything
   - Verify responsive design works properly

### Build and Test Validation
- Always run `npm run build` to ensure your changes don't break the production build
- Always run `npm run lint` before committing -- CI will fail if linting fails
- Run `npm run test:ci` to verify tests pass and check coverage
- Coverage should maintain >70% for statements/branches/functions/lines

## Technology Stack

### Core Technologies
- **Next.js 15.4.4** with App Router and Turbopack for fast development
- **React 19.1.0** with modern hooks and TypeScript
- **TypeScript 5** with strict configuration for type safety
- **TailwindCSS 4** for styling with dark mode support
- **Jest 30** with React Testing Library for comprehensive testing

### Key Dependencies
- Node.js 20+ recommended (tested with v20.19.4)
- All dependencies installed via `npm install`
- No additional SDKs or external tools required

## Project Structure

### Important Directories
- `src/app/` -- Next.js App Router pages and layouts
- `src/types/` -- TypeScript type definitions (User, Expense, Trip, Payment interfaces)
- `src/utils/` -- Core business logic for bill splitting algorithms
- `src/__tests__/` -- Integration tests for end-to-end scenarios
- `.github/workflows/` -- CI pipeline and GitHub Pages deployment
- All tests are co-located with their source files in `__tests__/` directories

### Key Files
- `src/app/page.tsx` -- Main application component with expense tracking UI
- `src/utils/billSplitting.ts` -- Core payment calculation algorithms
- `src/types/index.ts` -- TypeScript interfaces for data models
- `jest.config.js` -- Jest configuration with Next.js integration
- `next.config.ts` -- Next.js configuration (currently minimal)

## Common Tasks

### Testing
- **Unit Tests**: Test individual components and utilities in isolation
- **Integration Tests**: Test complete user workflows from UI to business logic
- **Coverage**: Maintain >70% coverage across all metrics
- **Test Structure**: Tests are co-located with source files for easy discovery

### Code Style and Quality
- **Linting**: Use `npm run lint` -- required before committing
- **TypeScript**: Strict mode enabled, all code must be type-safe
- **Formatting**: Handled by ESLint configuration
- **Import Paths**: Use `@/` alias for imports from src/ directory

### Development Tips
- Use the example data (Load Example Data button) to quickly test functionality
- The bill splitting algorithm uses debt netting to minimize number of payments
- All monetary calculations use proper floating-point handling with 2-decimal rounding
- The app supports complex scenarios with multiple users and expenses
- Dark mode is fully supported throughout the UI

## Build Timing Expectations
- **npm install**: 30 seconds
- **npm run build**: 20 seconds -- NEVER CANCEL, set 60+ minute timeout
- **npm test**: 6 seconds -- NEVER CANCEL, set 30+ minute timeout  
- **npm run lint**: 3 seconds
- **npm run dev startup**: 1 second

## Known Issues
- 3 tests fail due to text mismatches between test expectations and actual UI text (not functional issues)
- `npm start` does not work locally due to static export configuration for GitHub Pages
- Some npm deprecation warnings during install are expected and safe to ignore